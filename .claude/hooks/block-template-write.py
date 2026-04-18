#!/usr/bin/env python3
"""PreToolUse hook: block Write/Edit to templates/ directories.

Template files are immutable form masters. Only legitimate form revisions
(approved by HB, hook temporarily disabled) may modify them.
"""
import json
import sys


def main():
    try:
        data = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        sys.exit(0)

    tool_name = data.get("tool_name", "")
    if tool_name not in ("Write", "Edit"):
        sys.exit(0)

    tool_input = data.get("tool_input", {})
    file_path = tool_input.get("file_path", "").replace("\\", "/")

    if "/templates/" in file_path:
        print(json.dumps({
            "decision": "block",
            "reason": (
                f"[템플릿 보호] {file_path}\n"
                "templates/ 파일 직접 쓰기는 금지됩니다.\n"
                "양식 개정이라면 HB 승인 후 update-config 스킬로 이 hook을 임시 비활성화하세요."
            )
        }))
        sys.exit(2)

    sys.exit(0)


if __name__ == "__main__":
    main()
