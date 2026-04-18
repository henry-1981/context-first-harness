"""
Unit tests for session-start-handoff-scan hook.

Run: python .claude/hooks/test_session_start_handoff_scan.py
"""
import datetime
import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path

_SCAN_PATH = Path(__file__).parent / "session-start-handoff-scan.py"
_spec = importlib.util.spec_from_file_location("_handoff_scan", _SCAN_PATH)
_module = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_module)
scan = _module.scan  # will fail until refactor exposes scan(repo_root)


def write_handoff(dir_path: Path, name: str, frontmatter: dict, body: str = ""):
    lines = ["---"]
    for k, v in frontmatter.items():
        if isinstance(v, list):
            lines.append(f"{k}:")
            for item in v:
                lines.append(f"  - {item}")
        else:
            lines.append(f"{k}: {v}")
    lines.append("---")
    lines.append("")
    lines.append(body)
    (dir_path / "drafts" / "handoffs").mkdir(parents=True, exist_ok=True)
    (dir_path / "drafts" / "handoffs" / name).write_text("\n".join(lines), encoding="utf-8")


class TestHandoffScan(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        self.root = Path(self.tmp)
        self.today = datetime.date.today().isoformat()

    def test_entry_candidates_ready_and_waked_scheduled(self):
        write_handoff(self.root, "a.md", {
            "handoff": "a", "created": self.today,
            "last_touched": self.today, "status": "ready",
        })
        write_handoff(self.root, "b.md", {
            "handoff": "b", "created": self.today,
            "last_touched": self.today, "status": "scheduled",
            "wake_date": self.today,
        })
        out = scan(self.root)
        self.assertIn("Handoff 진입 후보", out)
        self.assertIn("a.md", out)
        self.assertIn("b.md", out)
        self.assertIn("(오늘 도래)", out)

    def test_dormant_blocked_and_future_scheduled(self):
        future = (datetime.date.today() + datetime.timedelta(days=30)).isoformat()
        write_handoff(self.root, "c.md", {
            "handoff": "c", "created": self.today,
            "last_touched": self.today, "status": "blocked",
            "unblock_when": "티알 미팅 답변",
        })
        write_handoff(self.root, "d.md", {
            "handoff": "d", "created": self.today,
            "last_touched": self.today, "status": "scheduled",
            "wake_date": future,
        })
        out = scan(self.root)
        self.assertIn("Handoff — 휴면", out)
        self.assertIn("blocked", out)
        self.assertIn("티알 미팅 답변", out)
        self.assertIn(future, out)

    def test_stale_section(self):
        old = (datetime.date.today() - datetime.timedelta(days=30)).isoformat()
        write_handoff(self.root, "e.md", {
            "handoff": "e", "created": old,
            "last_touched": old, "stale_after": "14d",
            "status": "ready",
        })
        out = scan(self.root)
        self.assertIn("Handoff — Stale", out)
        self.assertIn("e.md", out)
        self.assertIn("30d 경과", out)

    def test_corrupted_frontmatter(self):
        (self.root / "drafts" / "handoffs").mkdir(parents=True, exist_ok=True)
        (self.root / "drafts" / "handoffs" / "broken.md").write_text(
            "---\nthis is not valid yaml: [[\n---\n본문",
            encoding="utf-8"
        )
        out = scan(self.root)
        self.assertIn("Handoff — 손상", out)
        self.assertIn("broken.md", out)

    def test_sanity_inconsistency_ready_with_unblock_when(self):
        write_handoff(self.root, "f.md", {
            "handoff": "f", "created": self.today,
            "last_touched": self.today, "status": "ready",
            "unblock_when": "something",
        })
        out = scan(self.root)
        self.assertIn("f.md", out)
        self.assertIn("⚠ inconsistency", out)

    def test_sanity_orphan_related_paths(self):
        write_handoff(self.root, "g.md", {
            "handoff": "g", "created": self.today,
            "last_touched": self.today, "status": "ready",
            "related_paths": ["does/not/exist.md"],
        })
        out = scan(self.root)
        self.assertIn("g.md", out)
        self.assertIn("⚠ related_paths", out)
        self.assertIn("존재 안 함", out)

    def test_sanity_status_missing_defaults_ready(self):
        write_handoff(self.root, "h.md", {
            "handoff": "h", "created": self.today,
            "last_touched": self.today,
        })
        out = scan(self.root)
        self.assertIn("h.md", out)
        self.assertIn("⚠ status 누락", out)
        self.assertIn("Handoff 진입 후보", out)  # still listed as ready

    def test_sanity_legacy_status_active(self):
        write_handoff(self.root, "i.md", {
            "handoff": "i", "created": self.today,
            "last_touched": self.today, "status": "active",
        })
        out = scan(self.root)
        self.assertIn("i.md", out)
        self.assertIn("legacy", out)
        self.assertIn("ready로 해석", out)

    def test_silent_when_no_files(self):
        out = scan(self.root)
        self.assertEqual(out.strip(), "")


if __name__ == "__main__":
    unittest.main(verbosity=2)
