#!/usr/bin/env bash
set -eu

PORT="${1:-${PPT_COPY_PORT:-3556}}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

PIDFILE="_workspace/slides-grab-copy-$PORT.pid"
if [ ! -f "$PIDFILE" ]; then
  echo "[copy-stop] pidfile 없음: $PIDFILE"
  exit 0
fi

PID="$(cat "$PIDFILE")"
kill -TERM "$PID" 2>/dev/null || true
sleep 1
if kill -0 "$PID" 2>/dev/null; then
  kill -KILL "$PID" 2>/dev/null || true
fi
rm -f "$PIDFILE"
echo "[copy-stop] pid=$PID port=$PORT 종료 완료"
