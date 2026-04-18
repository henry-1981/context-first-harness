#!/usr/bin/env bash
# wrap cleanup — deterministic actions only, zero LLM tokens
# Usage: bash cleanup.sh [--skip-commit] [--skip-backup]
# Output: JSON to stdout

set -euo pipefail

SKIP_COMMIT=false
SKIP_BACKUP=false
for arg in "$@"; do
  case "$arg" in
    --skip-commit) SKIP_COMMIT=true ;;
    --skip-backup) SKIP_BACKUP=true ;;
  esac
done

REPO_ROOT="$(git rev-parse --show-toplevel)"
MEMORY_SRC="$HOME/.claude/projects/<project-id>/memory"
MEMORY_DST="$REPO_ROOT/docs/claude-memory-backup"
STATE_FILE="$REPO_ROOT/tasks/wrap-state.json"
TODAY=$(date +%Y-%m-%d)

# --- Phase 0: Data Collection ---

GIT_STATUS=$(git status --short 2>/dev/null || echo "")
GIT_DIFF_STAT=$(git diff --stat 2>/dev/null || echo "")
CHANGED_FILES=$(git diff --name-only 2>/dev/null || echo "")
WRAP_ANCHOR_COMMIT=""
if [ -f "$STATE_FILE" ]; then
  WRAP_ANCHOR_COMMIT=$(python -c "import json; print(json.load(open('$STATE_FILE'))['anchorCommit'])" 2>/dev/null || echo "")
fi

if [ -n "$WRAP_ANCHOR_COMMIT" ]; then
  GIT_LOG_SINCE=$(git log --oneline "$WRAP_ANCHOR_COMMIT..HEAD" 2>/dev/null || echo "")
  INFRA_CHANGES=$(git diff --name-only "$WRAP_ANCHOR_COMMIT..HEAD" -- CLAUDE.md "*/CLAUDE.md" "rules/" ".claude/agents/" ".claude/skills/" ".claude/hooks/" ".claude/commands/" ".claude/scripts/" 2>/dev/null || echo "")
else
  GIT_LOG_SINCE=$(git log --oneline -10 2>/dev/null || echo "")
  INFRA_CHANGES=""
fi

# --- Phase 0b: Handoff enumeration (SSOT 진입 후보 입력) ---
# Collect all handoffs with frontmatter metadata. LLM Phase 2-3 uses this to
# decide touch/create/delete/status-transition without additional file reads.

HANDOFFS=$(REPO_ROOT="$REPO_ROOT" PYTHONIOENCODING=utf-8 python - <<'PYEOF' 2>/dev/null || echo "[]"
import json, os, re, glob
from pathlib import Path

REPO = Path(os.environ["REPO_ROOT"])

FM_LINE = re.compile(r"^([A-Za-z_][A-Za-z0-9_]*):\s*(.*?)\s*$")
LIST_ITEM = re.compile(r"^\s+-\s+(.*?)\s*$")


def parse_fm(text):
    if not text.startswith("---\n"):
        return None
    end = text.find("\n---\n", 4)
    if end < 0:
        return None
    fm, current = {}, None
    for line in text[4:end].splitlines():
        if not line.strip():
            current = None
            continue
        if current:
            m = LIST_ITEM.match(line)
            if m:
                fm[current].append(m.group(1).strip().strip('"').strip("'"))
                continue
            current = None
        m = FM_LINE.match(line)
        if not m:
            return None
        k, v = m.group(1), m.group(2).strip().strip('"').strip("'")
        if v == "":
            fm[k] = []
            current = k
        else:
            fm[k] = v
    return fm


targets = sorted(glob.glob(str(REPO / "drafts" / "handoffs" / "*.md")))
for sub in sorted(REPO.iterdir()):
    if sub.is_dir() and not sub.name.startswith("."):
        for entry in sub.iterdir():
            if entry.is_file() and entry.name == "HANDOFF.md":
                targets.append(str(entry))
                break

handoffs = []
for p in targets:
    try:
        text = Path(p).read_text(encoding="utf-8", errors="replace")
    except Exception:
        continue
    rel = str(Path(p).relative_to(REPO)).replace("\\", "/")
    fm = parse_fm(text)
    if fm is None:
        handoffs.append({"path": rel, "parse_error": True})
        continue
    body_preview = text.split("\n---\n", 1)[-1].strip()[:400] if "\n---\n" in text else ""
    handoffs.append({
        "path": rel,
        "handoff": fm.get("handoff", Path(p).stem),
        "status": fm.get("status", ""),
        "last_touched": fm.get("last_touched", ""),
        "wake_date": fm.get("wake_date", ""),
        "unblock_when": fm.get("unblock_when", ""),
        "resumed_count": fm.get("resumed_count", "0"),
        "related_paths": fm.get("related_paths") or [],
        "body_preview": body_preview,
    })

print(json.dumps(handoffs, ensure_ascii=False))
PYEOF
)
[ -z "$HANDOFFS" ] && HANDOFFS="[]"

# --- Phase 1a: Git Commit ---

COMMITS="[]"
if [ "$SKIP_COMMIT" = false ] && [ -n "$GIT_STATUS" ]; then
  # Auto-commit all changes
  git add -A >/dev/null 2>&1
  COMMIT_MSG="환경 백업: wrap 세션 정리 ($TODAY)"
  git commit -m "$COMMIT_MSG" >/dev/null 2>&1 || true
  COMMIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
  COMMITS="[\"$COMMIT_MSG ($COMMIT_SHA)\"]"
fi

# --- Phase 1b: Backup ---
# Delegates to shared script .claude/scripts/backup-env.sh (single source of truth).
# Same script powers /backup-env slash command. Do NOT duplicate logic here.

BACKUP_STATUS="스킵"
if [ "$SKIP_BACKUP" = false ]; then
  bash "$REPO_ROOT/.claude/scripts/backup-env.sh" >/dev/null 2>&1 || true

  # Check if backup has changes (메모리만 — 스킬·에이전트는 모노레포 .claude/에 직접 체크인)
  BACKUP_DIFF=$(git diff --stat docs/claude-memory-backup/ 2>/dev/null || echo "")
  if [ -n "$BACKUP_DIFF" ]; then
    git add docs/claude-memory-backup/ >/dev/null 2>&1
    git commit -m "환경 백업: 메모리 동기화 ($TODAY)" >/dev/null 2>&1 || true
    BACKUP_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    BACKUP_STATUS="완료 ($BACKUP_SHA)"
  else
    BACKUP_STATUS="변경 없음"
  fi
fi

# --- Output JSON ---

# Escape special chars for JSON
escape_json() {
  echo "$1" | python -c "import sys,json; print(json.dumps(sys.stdin.read().strip()))" 2>/dev/null || echo '""'
}

cat <<JSONEOF
{
  "phase0": {
    "git_status": $(escape_json "$GIT_STATUS"),
    "git_diff_stat": $(escape_json "$GIT_DIFF_STAT"),
    "changed_files": $(escape_json "$CHANGED_FILES"),
    "git_log_since_sync": $(escape_json "$GIT_LOG_SINCE"),
    "infra_changes": $(escape_json "$INFRA_CHANGES"),
    "anchor_commit": "$WRAP_ANCHOR_COMMIT",
    "handoffs": $HANDOFFS
  },
  "phase1": {
    "commits": $COMMITS,
    "backup": "$BACKUP_STATUS"
  }
}
JSONEOF
