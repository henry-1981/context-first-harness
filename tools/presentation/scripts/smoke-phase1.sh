#!/usr/bin/env bash
set -eu

cd "$(dirname "$0")/.."

node --test \
  .claude/lib/reference-import.test.js \
  .claude/lib/skeleton-transform.test.js \
  .claude/lib/e2e/scenario-1.test.js \
  .claude/lib/e2e/scenario-2.test.js \
  .claude/lib/e2e/scenario-3.test.js \
  .claude/lib/e2e/template-copy-ingest.test.js

npm run test:template-copy-smoke
