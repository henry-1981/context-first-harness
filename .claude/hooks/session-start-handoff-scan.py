#!/usr/bin/env python
"""
SessionStart hook: handoff scan (4 sections + sanity checks).

rules/handoff.md 참조. 결정론적 감지만 수행한다.

Sections:
- 진입 후보 (Ready + 깨어난 Scheduled)
- 휴면 (blocked / 미wake scheduled)
- Stale (last_touched + stale_after < today, 모든 상태)
- 손상 (frontmatter parse error)

Sanity checks:
- status=ready + unblock_when 있음 → ⚠ inconsistency
- related_paths 중 존재 안 함 → ⚠ related_paths N건 없음
- status 누락 → default ready + ⚠ status 누락
- status=active (legacy) → default ready + ⚠ status=active (legacy)

실패는 stderr로만 — stdout 깨끗 유지 (safe failure).
"""
import datetime
import glob
import re
import sys
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

DEFAULT_STALE_AFTER_DAYS = 14
TOP_DETAIL = 3

FM_LINE = re.compile(r"^([A-Za-z_][A-Za-z0-9_]*):\s*(.*?)\s*$")
LIST_ITEM = re.compile(r"^\s+-\s+(.*?)\s*$")
DAYS_PAT = re.compile(r"^(\d+)d$")


def parse_frontmatter(path: Path):
    """Parse YAML-ish frontmatter. Returns dict or raises ValueError on malformed."""
    text = path.read_text(encoding="utf-8", errors="replace")
    if not text.startswith("---\n"):
        raise ValueError("no frontmatter opening")
    end = text.find("\n---\n", 4)
    if end < 0:
        raise ValueError("no frontmatter closing")
    fm = {}
    current_list_key = None
    for line in text[4:end].splitlines():
        if not line.strip():
            current_list_key = None
            continue
        # list continuation
        if current_list_key:
            m_list = LIST_ITEM.match(line)
            if m_list:
                fm[current_list_key].append(m_list.group(1).strip().strip('"').strip("'"))
                continue
            current_list_key = None
        # key: value or key: (list start)
        m = FM_LINE.match(line)
        if not m:
            raise ValueError(f"malformed line: {line!r}")
        key, val = m.group(1), m.group(2).strip().strip('"').strip("'")
        if val == "":
            # could be start of list
            fm[key] = []
            current_list_key = key
        else:
            fm[key] = val
    return fm


def parse_days(s, default=DEFAULT_STALE_AFTER_DAYS):
    m = DAYS_PAT.match(str(s or "").strip())
    return int(m.group(1)) if m else default


def parse_date(s):
    try:
        return datetime.date.fromisoformat(str(s).strip())
    except Exception:
        return None


def collect_targets(repo_root: Path):
    targets = sorted(glob.glob(str(repo_root / "drafts" / "handoffs" / "*.md")))
    if repo_root.exists():
        for sub in sorted(repo_root.iterdir()):
            if sub.is_dir() and not sub.name.startswith("."):
                # Case-sensitive HANDOFF.md match (Windows FS is case-insensitive;
                # iterate actual entries and compare name exactly to avoid matching
                # e.g. rules/handoff.md when probing for */HANDOFF.md).
                for entry in sub.iterdir() if sub.is_dir() else []:
                    if entry.is_file() and entry.name == "HANDOFF.md":
                        targets.append(str(entry))
                        break
    return targets


def classify_and_check(fm: dict, path: Path, repo_root: Path, today: datetime.date):
    """Return (section_name, warnings_list, display_extra)."""
    warnings = []

    # status handling with legacy/missing default
    raw_status = fm.get("status")
    if raw_status is None:
        warnings.append("⚠ status 누락 (default ready)")
        status = "ready"
    elif raw_status == "active":
        warnings.append("⚠ status=active (legacy, ready로 해석)")
        status = "ready"
    else:
        status = raw_status

    # stale check (overrides section)
    lt = parse_date(fm.get("last_touched") or fm.get("created"))
    stale_days = parse_days(fm.get("stale_after"))
    age_days = (today - lt).days if lt else 0
    is_stale = lt is not None and age_days > stale_days

    # sanity: inconsistency
    unblock_when = fm.get("unblock_when") or ""
    if status == "ready" and unblock_when.strip():
        warnings.append("⚠ inconsistency (ready + unblock_when 있음)")

    # sanity: orphan related_paths
    related = fm.get("related_paths") or []
    if isinstance(related, list):
        missing = [p for p in related if not (repo_root / p).exists()]
        if missing:
            warnings.append(f"⚠ related_paths {len(missing)}건 존재 안 함")

    # classify by status (stale section takes priority if stale)
    if is_stale:
        section = "stale"
        extra = f"age {age_days}d 경과, stale_after {stale_days}d"
    elif status == "ready":
        section = "entry"
        extra = f"ready | last_touched {lt}"
    elif status == "scheduled":
        wake = parse_date(fm.get("wake_date"))
        if wake and wake <= today:
            section = "entry"
            marker = " (오늘 도래)" if wake == today else f" (wake {wake})"
            extra = f"scheduled | wake_date {wake}{marker}"
        else:
            section = "dormant"
            extra = f"scheduled | wake_date {fm.get('wake_date', '?')}"
    elif status == "blocked":
        section = "dormant"
        uw = unblock_when.strip() or "(unblock_when 공란)"
        extra = f'blocked | "{uw}"'
    else:
        section = "entry"  # unknown status → treat as ready
        warnings.append(f"⚠ unknown status: {status}")
        extra = f"{status} | last_touched {lt}"

    return section, warnings, extra


def render_section(title: str, entries: list) -> list:
    if not entries:
        return []
    out = [f"## {title}"]
    for e in entries[:TOP_DETAIL]:
        line = f"- `{e['path']}` — {e['extra']}"
        out.append(line)
        for w in e.get("warnings", []):
            out.append(f"  {w}")
    if len(entries) > TOP_DETAIL:
        out.append(f"... 그 외 {len(entries) - TOP_DETAIL}건")
        for e in entries[TOP_DETAIL:]:
            out.append(f"- `{e['path']}` — {e['extra']}")
    out.append("")
    return out


def scan(repo_root: Path) -> str:
    """Main scan entry point. Returns markdown string (empty if nothing to show)."""
    today = datetime.date.today()
    entry, dormant, stale, broken = [], [], [], []

    for path_str in collect_targets(repo_root):
        p = Path(path_str)
        rel = str(p.relative_to(repo_root)).replace("\\", "/")
        try:
            fm = parse_frontmatter(p)
        except Exception as e:
            broken.append({"path": rel, "extra": f"frontmatter parse error: {e}",
                          "warnings": []})
            continue

        section, warnings, extra = classify_and_check(fm, p, repo_root, today)
        item = {"path": rel, "extra": extra, "warnings": warnings,
                "last_touched": parse_date(fm.get("last_touched") or fm.get("created"))
                                or datetime.date.min}

        if section == "entry":
            entry.append(item)
        elif section == "dormant":
            dormant.append(item)
        elif section == "stale":
            stale.append(item)

    for lst in (entry, dormant, stale):
        lst.sort(key=lambda x: x["last_touched"], reverse=True)

    out = []
    out += render_section("Handoff 진입 후보 (Ready + 깨어난 Scheduled)", entry)
    out += render_section("Handoff — 휴면 (blocked / scheduled 미도래)", dormant)
    out += render_section("Handoff — Stale", stale)
    out += render_section("Handoff — 손상", broken)

    if not out:
        return ""
    out.append("rules/handoff.md Phase 1~3 프로토콜을 각 진입 후보에 적용. 휴면·Stale·손상은 감지 리포트.")
    return "\n".join(out)


def main():
    try:
        repo_root = Path(__file__).resolve().parents[2]
        out = scan(repo_root)
        if out:
            print(out)
    except Exception as e:
        print(f"[handoff-scan error] {e}", file=sys.stderr)
        sys.exit(0)


if __name__ == "__main__":
    main()
