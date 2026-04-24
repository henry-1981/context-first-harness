#!/usr/bin/env bash
# tools/slides-grab/stop.sh — slides-grab editor 서버 종료
# Usage: bash tools/slides-grab/stop.sh <port>
# SIGTERM → 3초 대기 → SIGKILL (Windows 3함정 대응, Spec §6.3)

set -eu

PORT="${1:?usage: stop.sh <port>}"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

PIDFILE="_workspace/slides-grab-$PORT.pid"

if [ ! -f "$PIDFILE" ]; then
  echo "[stop.sh] pidfile 없음: $PIDFILE (이미 종료 추정)" >&2
  exit 0
fi

PID="$(cat "$PIDFILE")"

if ! kill -0 "$PID" 2>/dev/null; then
  echo "[stop.sh] pid=$PID 프로세스 부재 (이미 종료 추정)" >&2
  rm -f "$PIDFILE"
  exit 0
fi

# SIGTERM
kill -TERM "$PID" 2>/dev/null || true
for i in 1 2 3; do
  sleep 1
  if ! kill -0 "$PID" 2>/dev/null; then
    break
  fi
done

# 여전히 살아 있으면 SIGKILL (Windows 3함정: SIGTERM 시뮬레이션 불완전)
if kill -0 "$PID" 2>/dev/null; then
  echo "[stop.sh] SIGTERM 3초 후 잔존. SIGKILL 강제 종료" >&2
  kill -KILL "$PID" 2>/dev/null || true
  sleep 0.5
fi

rm -f "$PIDFILE"
echo "[stop.sh] pid=$PID port=$PORT 종료 완료"
