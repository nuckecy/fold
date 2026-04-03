# Fold - Project Setup Guide

**Run this guide once before starting any development work.**
**Every step must complete successfully before writing code.**

---

## Prerequisites

Before starting, ensure you have:

- Node.js 20+ installed (`node --version`)
- npm 10+ installed (`npm --version`)
- Git configured with SSH key for GitHub (`git remote -v`)
- Claude Code installed (`claude --version`)
- A Linear account (free at https://linear.app)
- A GitHub repository created for Fold

---

## Step 1: Clone and Initialize

```bash
# Clone the repo
git clone git@github.com:nuckecy/fold.git
cd fold

# Verify you are in the project root
pwd
# Should output: /path/to/fold
```

---

## Step 2: Configure Claude Code Permissions

Claude Code must run with bypass permissions and a deny list for dangerous commands. This avoids permission prompts on every file operation while blocking destructive actions.

```bash
# The .claude/settings.json file is already included in this setup.
# Verify it exists:
cat .claude/settings.json

# You should see:
# - defaultMode: "bypassPermissions"
# - deny list with rm -rf, sudo, force push, etc.
# - Stop hook for auto-memory
# - Notification hook for idle snapshots
```

**What this does:**
- Claude Code can create, edit, delete files, run builds, tests, and git operations without asking
- Destructive commands (rm -rf /, sudo, force push, drop database) are blocked
- After every Claude Code response, CLAUDE.md is auto-committed and pushed if changed
- When you go idle (5+ minutes), all uncommitted work is snapshotted and pushed

**To verify permissions are active:**
```bash
claude
# Inside Claude Code, run:
# /permissions
# Should show: bypassPermissions mode with deny list
```

---

## Step 3: Make Hook Scripts Executable

```bash
chmod +x .claude/hooks/update-memory.sh
chmod +x .claude/hooks/idle-snapshot.sh
```

**Test the hooks:**
```bash
# Test update-memory hook (should exit silently with no changes)
bash .claude/hooks/update-memory.sh
echo $?  # Should output: 0

# Test idle-snapshot hook (should exit silently with no changes)
bash .claude/hooks/idle-snapshot.sh
echo $?  # Should output: 0
```

---

## Step 4: Set Up Linear MCP

Linear MCP allows Claude Code to create, update, and manage issues directly from the terminal.

```bash
# Add Linear MCP server to Claude Code
claude mcp add --transport sse linear-server https://mcp.linear.app/sse

# Verify it was added
claude mcp list
# Should show: linear-server (sse) https://mcp.linear.app/sse
```

**Authenticate with Linear:**
```bash
# Open Claude Code
claude

# Inside Claude Code, run:
/mcp

# This opens a browser window for Linear OAuth
# Log in with your Linear account and authorize
# Return to the terminal, connection should be confirmed
```

**Verify Linear MCP works:**
```
# Inside Claude Code, ask:
"List my Linear teams"

# You should see your Linear workspace and teams
```

**If authentication fails:**
```bash
# Clear saved auth and retry
rm -rf ~/.mcp-auth
claude mcp remove linear-server
claude mcp add --transport sse linear-server https://mcp.linear.app/sse

# Re-authenticate via /mcp inside Claude Code
```

---

## Step 5: Verify CLAUDE.md and DECISIONS.md

These files are the project's persistent memory. Claude Code reads CLAUDE.md at the start of every session to restore full context.

```bash
# Verify both files exist
ls -la CLAUDE.md DECISIONS.md

# CLAUDE.md should contain:
# - Project status
# - Session history
# - Architecture decisions summary
# - Tech stack (locked)
# - Feature tracker
# - Environment variables reference

# DECISIONS.md should contain:
# - ADR-001 through ADR-006 (initial decisions)
# - Format template for future decisions
```

**Important:** These files are auto-committed by the Stop hook. Do not manually edit them unless you need to correct something. Claude Code manages these files during development.

---

## Step 6: Initial Git Commit

```bash
# Stage all setup files
git add -A

# Commit the project scaffolding
git commit -m "chore: initial project setup with Claude Code hooks, memory, and Linear MCP"

# Push to GitHub
git push origin main
```

---

## Step 7: Verify Everything Works End-to-End

Run this checklist before starting development:

```
[ ] Node.js 20+ installed
[ ] Git configured with SSH key
[ ] GitHub repo created and cloned
[ ] .claude/settings.json has bypass permissions + hooks
[ ] .claude/hooks/update-memory.sh is executable
[ ] .claude/hooks/idle-snapshot.sh is executable
[ ] Linear MCP added and authenticated
[ ] CLAUDE.md exists in project root
[ ] DECISIONS.md exists in project root
[ ] Initial commit pushed to GitHub
[ ] Claude Code opens without errors in the project directory
```

**Quick verification command:**
```bash
# Run inside the fold project directory
echo "=== Node ===" && node --version && \
echo "=== Git ===" && git remote -v && \
echo "=== Claude Code ===" && claude --version && \
echo "=== Hooks ===" && ls -la .claude/hooks/ && \
echo "=== Memory ===" && ls -la CLAUDE.md DECISIONS.md && \
echo "=== Linear MCP ===" && claude mcp list && \
echo "=== All checks passed ==="
```

---

## Step 8: Start Development

```bash
# Open Claude Code in the project
cd fold
claude

# Claude Code will automatically read CLAUDE.md
# It knows: project status, tech stack, decisions, and what to do next
# First task: "Start Phase 1 - set up Hetzner VPS and Coolify"
```

---

## Troubleshooting

**Claude Code hooks not firing:**
- Verify `.claude/settings.json` is valid JSON: `python3 -c "import json; json.load(open('.claude/settings.json'))"`
- Check hooks are listed: run `/hooks` inside Claude Code
- Ensure scripts are executable: `chmod +x .claude/hooks/*.sh`

**Linear MCP connection issues:**
- Clear auth cache: `rm -rf ~/.mcp-auth`
- Remove and re-add: `claude mcp remove linear-server && claude mcp add --transport sse linear-server https://mcp.linear.app/sse`
- Re-authenticate: `/mcp` inside Claude Code

**Git push failures from hooks:**
- Verify SSH key: `ssh -T git@github.com`
- Check remote: `git remote -v`
- Hooks push in background (`&`), check for errors: `git push origin main` manually

**CLAUDE.md not updating:**
- The Stop hook only commits if CLAUDE.md was actually modified
- Verify git status: `git status` (should show CLAUDE.md as modified after Claude Code works on it)
- Check hook script: `bash -x .claude/hooks/update-memory.sh` (shows execution trace)

---

**This setup guide is version 1.0. It will be updated as new tools or configurations are added.**
