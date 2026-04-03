#!/usr/bin/env bash
# Stop hook: auto-commit CLAUDE.md and DECISIONS.md if changed
# Runs after every Claude Code response

set -euo pipefail

cd "$(git rev-parse --show-toplevel 2>/dev/null || exit 0)"

# Only proceed if we are in a git repo
if ! git rev-parse --is-inside-work-tree &>/dev/null; then
  exit 0
fi

# Check if CLAUDE.md or DECISIONS.md have changed
CHANGED_FILES=$(git diff --name-only HEAD -- CLAUDE.md DECISIONS.md 2>/dev/null || true)

if [ -z "$CHANGED_FILES" ]; then
  # Also check untracked
  UNTRACKED=$(git ls-files --others --exclude-standard -- CLAUDE.md DECISIONS.md 2>/dev/null || true)
  if [ -z "$UNTRACKED" ]; then
    exit 0
  fi
  CHANGED_FILES="$UNTRACKED"
fi

# Stage and commit the memory files
git add CLAUDE.md DECISIONS.md 2>/dev/null || true
git commit -m "chore: auto-update project memory" --no-verify 2>/dev/null || true

# Push in background (non-blocking)
git push origin main &>/dev/null &

exit 0
