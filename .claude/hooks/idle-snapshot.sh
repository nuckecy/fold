#!/usr/bin/env bash
# Idle hook: snapshot all uncommitted work when user goes idle
# Runs after 5+ minutes of inactivity

set -euo pipefail

cd "$(git rev-parse --show-toplevel 2>/dev/null || exit 0)"

# Only proceed if we are in a git repo
if ! git rev-parse --is-inside-work-tree &>/dev/null; then
  exit 0
fi

# Check for any uncommitted changes
if git diff --quiet HEAD 2>/dev/null && git diff --cached --quiet 2>/dev/null; then
  # No staged or unstaged changes
  UNTRACKED=$(git ls-files --others --exclude-standard 2>/dev/null || true)
  if [ -z "$UNTRACKED" ]; then
    exit 0
  fi
fi

# Stage everything and commit as snapshot
git add -A 2>/dev/null || true
git commit -m "chore: idle snapshot - work in progress" --no-verify 2>/dev/null || true

# Push in background (non-blocking)
git push origin main &>/dev/null &

exit 0
