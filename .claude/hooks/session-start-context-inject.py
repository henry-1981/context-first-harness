#!/usr/bin/env python
"""
SessionStart hook: lessons.md 최근 heading pointer 주입.

progressive disclosure 원칙 — 본문 주입 금지. "뭐가 있다"만 노출하고
필요 시 Claude가 Read로 로드. handoff 진입 리스트는
session-start-handoff-scan.py가 전담하므로 여기서는 다루지 않는다.

실패는 stderr로만 — stdout 깨끗 유지.
"""
import datetime
import json
import re
import sys
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

REPO_ROOT = Path(__file__).resolve().parents[2]
LESSONS_PATH = REPO_ROOT / "tasks" / "lessons.md"
LESSONS_TAIL = 3

DATE_HEADER = re.compile(r"^## (\d{4}-\d{2}-\d{2})")
ITEM_HEADER = re.compile(r"^### (.+)$")


def extract_lessons(path: Path, tail: int):
    """### 제목을 tail 개 수집. 직전 ## YYYY-MM-DD 헤더의 날짜를 prefix로."""
    if not path.exists():
        return []
    lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
    entries = []
    current_date = ""
    for line in lines:
        m = DATE_HEADER.match(line)
        if m:
            current_date = m.group(1)
            continue
        m = ITEM_HEADER.match(line)
        if m:
            entries.append((current_date, m.group(1).strip()))
    return entries[-tail:]


def _debug_log(tag, **fields):
    try:
        log_path = Path(__file__).parent / "session-start.log"
        ts = datetime.datetime.now().isoformat(timespec="seconds")
        kv = " | ".join(f"{k}={v!r}" for k, v in fields.items())
        with open(log_path, "a", encoding="utf-8") as f:
            f.write(f"{ts} | {tag} | {kv}\n")
    except Exception:
        pass


def _read_stdin():
    try:
        if sys.stdin.isatty():
            return ""
        return sys.stdin.read()
    except Exception as e:
        return f"<read error: {e}>"


def main():
    stdin_data = _read_stdin()
    lessons = extract_lessons(LESSONS_PATH, LESSONS_TAIL)
    _debug_log("context-inject", stdin_len=len(stdin_data),
               stdin_head=stdin_data[:300], lessons_count=len(lessons))
    if not lessons:
        return

    out = []
    out.append(f"## lessons 최근 {len(lessons)}건 (pointer)")
    for date, title in lessons:
        prefix = f"[{date}] " if date else ""
        out.append(f"- {prefix}{title}")
    out.append("")
    out.append("본문·추가 항목 필요 시 `tasks/lessons.md` Read.")
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "SessionStart",
            "additionalContext": "\n".join(out),
        }
    }))


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"[context-inject error] {e}", file=sys.stderr)
        sys.exit(0)
