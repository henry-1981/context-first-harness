#!/usr/bin/env bash
# wiki-check.sh — Session start hook: detect un-ingested wiki sources
# Called by Claude Code SessionStart hook

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
WIKI_DIR="$REPO_ROOT/wiki"
SOURCES_DIR="$WIKI_DIR/sources"
PAGES_DIR="$WIKI_DIR/pages"
IGNORE_FILE="$WIKI_DIR/.wiki-ignore"

# Collect all source .md files (relative to wiki/sources/)
all_sources=()
while IFS= read -r -d '' f; do
  rel="${f#$SOURCES_DIR/}"
  all_sources+=("$rel")
done < <(find "$SOURCES_DIR" -name '*.md' -not -name '.gitkeep' -print0 2>/dev/null)

# Collect referenced sources from pages frontmatter
referenced=()
for page in "$PAGES_DIR"/*.md; do
  [ -f "$page" ] || continue
  in_frontmatter=false
  in_sources=false
  while IFS= read -r line; do
    if [[ "$line" == "---" ]]; then
      if $in_frontmatter; then break; fi
      in_frontmatter=true
      continue
    fi
    $in_frontmatter || continue
    # Start of sources field
    if [[ "$line" =~ ^sources: ]]; then
      # Inline empty: "sources: []"
      if [[ "$line" =~ \[\] ]]; then
        in_sources=false
        continue
      fi
      in_sources=true
      continue
    fi
    if $in_sources; then
      # End of sources list (next field or end of frontmatter)
      if [[ "$line" =~ ^[a-zA-Z_] ]] || [[ "$line" == "---" ]]; then
        break
      fi
      # Extract path from "  - path/to/file.md"
      if [[ "$line" =~ ^[[:space:]]*-[[:space:]]+(.*) ]]; then
        referenced+=("${BASH_REMATCH[1]}")
      fi
    fi
  done < "$page"
done

# Load ignore patterns
ignore_patterns=()
if [ -f "$IGNORE_FILE" ]; then
  while IFS= read -r pat; do
    [[ -z "$pat" || "$pat" == \#* ]] && continue
    ignore_patterns+=("$pat")
  done < "$IGNORE_FILE"
else
  ignore_patterns=("example-com")
fi

# Compute difference: sources not referenced by any page
missing=()
for src in "${all_sources[@]}"; do
  found=false
  for ref in "${referenced[@]}"; do
    if [[ "$src" == "$ref" ]]; then
      found=true
      break
    fi
  done
  if ! $found; then
    # Check ignore patterns
    ignored=false
    for pat in "${ignore_patterns[@]}"; do
      if [[ "$src" == *"$pat"* ]]; then
        ignored=true
        break
      fi
    done
    $ignored || missing+=("$src")
  fi
done

# Output
if [ ${#missing[@]} -gt 0 ]; then
  echo "[wiki] 미인제스트 소스 ${#missing[@]}건:"
  for m in "${missing[@]}"; do
    echo "  - $m"
  done
fi
