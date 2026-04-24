#!/usr/bin/env bash
set -eu

PORT="${1:-${PPT_COPY_PORT:-3556}}"
SLIDES_DIR="${2:?usage: start.sh [port] <slides-dir> [state-path]}"
STATE_PATH="${3:-}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

export PPT_STATE_PATH="$STATE_PATH"
export PPT_EDIT_ENGINE="${PPT_EDIT_ENGINE:-codex}"

LOGFILE="_workspace/slides-grab-copy-$PORT.log"
PIDFILE="_workspace/slides-grab-copy-$PORT.pid"

nohup node tools/slides-grab-copy/scripts/copy-server.js \
  --port "$PORT" --slides-dir "$SLIDES_DIR" \
  > "$LOGFILE" 2>&1 </dev/null &

PID=$!
echo "$PID" > "$PIDFILE"
echo "[copy-start] pid=$PID port=$PORT slides-dir=$SLIDES_DIR"
