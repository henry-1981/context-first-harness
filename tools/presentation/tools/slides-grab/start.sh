#!/usr/bin/env bash
# tools/slides-grab/start.sh — slides-grab editor 서버 기동
# Usage: bash tools/slides-grab/start.sh <port> <slides-dir> [state-path]
#   port       필수, 정수. 예: 3456
#   slides-dir 필수, 슬라이드 HTML 디렉토리 절대/상대 경로. 예: draft/slides
#   state-path 선택, 프로젝트 state.json 절대 경로. 미지정 시 slides-dir에서 climb
# 환경변수:
#   PPT_EDIT_ENGINE  codex|claude (기본 codex, Layer 2)
#   PPT_STATE_PATH   state.json 절대 경로 (3번째 인자가 우선)

set -eu

PORT="${1:?usage: start.sh <port> <slides-dir> [state-path]}"
SLIDES_DIR="${2:?usage: start.sh <port> <slides-dir> [state-path]}"
STATE_PATH="${3:-}"

# presentation 프로젝트 루트(= tools/slides-grab의 2단계 상위) 기준 작업
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$PROJECT_ROOT"

# state-path climb heuristic
if [ -z "$STATE_PATH" ]; then
  PROJ_DIR="$(dirname "$SLIDES_DIR")"
  PROJ_NAME="$(basename "$PROJ_DIR")"
  CAND_STATE="$PROJ_DIR/state.json"
  CAND_LEGACY="$PROJ_DIR/$PROJ_NAME.state.json"
  if [ -f "$CAND_STATE" ]; then
    STATE_PATH="$(cd "$PROJ_DIR" && pwd)/state.json"
  elif [ -f "$CAND_LEGACY" ]; then
    STATE_PATH="$(cd "$PROJ_DIR" && pwd)/$PROJ_NAME.state.json"
  fi
fi

export PPT_STATE_PATH="$STATE_PATH"
export PPT_EDIT_ENGINE="${PPT_EDIT_ENGINE:-codex}"

# 포트 점유 확인
if command -v lsof >/dev/null 2>&1; then
  if lsof -i :"$PORT" >/dev/null 2>&1; then
    echo "[start.sh] port $PORT 점유됨. 먼저 stop.sh 실행 필요" >&2
    exit 1
  fi
fi

LOGFILE="_workspace/slides-grab-$PORT.log"
PIDFILE="_workspace/slides-grab-$PORT.pid"

# 백그라운드 기동
# 비대화형 셸 종료 시에도 서버가 유지되도록 nohup 사용
nohup node tools/slides-grab/scripts/editor-server.js \
  --port "$PORT" --slides-dir "$SLIDES_DIR" \
  > "$LOGFILE" 2>&1 </dev/null &
PID=$!
echo "$PID" > "$PIDFILE"

echo "[start.sh] pid=$PID port=$PORT slides-dir=$SLIDES_DIR state=$PPT_STATE_PATH engine=$PPT_EDIT_ENGINE"
echo "[start.sh] log: $LOGFILE pid: $PIDFILE"
