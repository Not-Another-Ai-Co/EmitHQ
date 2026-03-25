#!/bin/bash
# HN Karma Building — automated via claude -p
# Cron fires daily; script adds random delay + decides whether to post.
#
# Usage: cron runs this daily at 10:00 AM ET
#   3 10 * * * /home/jfinnegan0/EmitHQ/scripts/hn-karma.sh >> /home/jfinnegan0/EmitHQ/logs/hn-karma.log 2>&1

set -euo pipefail

PROJECT_DIR="/home/jfinnegan0/EmitHQ"
STATE_FILE="$PROJECT_DIR/docs/outreach/hn-karma-state.json"
LOG_DIR="$PROJECT_DIR/logs"
PROMPT_FILE="$PROJECT_DIR/scripts/hn-karma-prompt.md"
CLAUDE="/home/jfinnegan0/.local/bin/claude"

mkdir -p "$LOG_DIR"

echo "$(date -Iseconds) | hn-karma | starting"

# Random delay: 0-4 hours (0-14400 seconds) to vary posting time
DELAY=$((RANDOM % 14400))
echo "$(date -Iseconds) | hn-karma | sleeping ${DELAY}s ($(( DELAY / 60 ))m)"
sleep "$DELAY"

echo "$(date -Iseconds) | hn-karma | woke up, calling claude -p"

# Export 1Password token for the claude -p subprocess
export OP_SERVICE_ACCOUNT_TOKEN="$(grep OP_SERVICE_ACCOUNT_TOKEN ~/.bashrc | cut -d'"' -f2)"

# Full PATH for claude subprocess tools (node, curl, python3, op)
export PATH="/home/jfinnegan0/.local/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

# Call claude with the karma prompt — sonnet is cheaper
# --allowed-tools: grant the tools the prompt needs (non-interactive = no approval UI)
# WebFetch: HN API calls
# Bash: curl for posting, op for credentials
# Read/Write: state file
"$CLAUDE" -p --model sonnet \
  --allowed-tools "Bash,WebFetch,Read,Write,Skill" \
  "$(cat "$PROMPT_FILE")"

echo "$(date -Iseconds) | hn-karma | done"
