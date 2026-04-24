#!/bin/bash
# presentation workspace bootstrap
# Usage: bash archive-workspace.sh <project> [workspace-root]

set -eu

PROJECT="${1:?Usage: archive-workspace.sh <project-name> [workspace-root]}"
ROOT="${2:-tools/presentation/_workspace}"

mkdir -p "$ROOT/${PROJECT}/input/images"
mkdir -p "$ROOT/${PROJECT}/input/references"
mkdir -p "$ROOT/${PROJECT}/draft/slides"
mkdir -p "$ROOT/${PROJECT}/checkpoints"
mkdir -p "$ROOT/${PROJECT}/samples/a/slides"
mkdir -p "$ROOT/${PROJECT}/samples/b/slides"
mkdir -p "$ROOT/${PROJECT}/export"
mkdir -p "$ROOT/${PROJECT}/verify"
mkdir -p "$ROOT/${PROJECT}/logs"
echo "✓ 프로젝트 폴더 생성: $ROOT/${PROJECT}/"
