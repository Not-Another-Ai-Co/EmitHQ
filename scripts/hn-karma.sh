#!/bin/bash
# HN Karma Building — automated via claude -p
# Cron fires daily; script adds random delay + decides whether to post.
#
# Usage: cron runs this daily at 10:00 AM ET
#   3 10 * * * /home/jfinnegan0/EmitHQ/scripts/hn-karma.sh >> /home/jfinnegan0/EmitHQ/logs/hn-karma.log 2>&1

PROJECT_DIR="/home/jfinnegan0/EmitHQ"
STATE_FILE="$PROJECT_DIR/docs/outreach/hn-karma-state.json"
LOG_DIR="$PROJECT_DIR/logs"
PROMPT_FILE="$PROJECT_DIR/scripts/hn-karma-prompt.md"
CLAUDE="/home/jfinnegan0/.local/bin/claude"

mkdir -p "$LOG_DIR"

# Export 1Password token for the claude -p subprocess
export OP_CONNECT_HOST="http://localhost:8888"
export OP_CONNECT_TOKEN="$(grep OP_CONNECT_TOKEN ~/.bashrc | cut -d'"' -f2)"

# Full PATH for claude subprocess tools (node, curl, python3, op)
export PATH="/home/jfinnegan0/.local/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

notify_failure() {
  local msg="$1"
  echo "$(date -Iseconds) | hn-karma | FAILED: $msg"
  RESEND_KEY=$(op read "op://EmitHQ/resend/api-key" 2>/dev/null)
  if [ -n "$RESEND_KEY" ]; then
    curl -s -X POST "https://api.resend.com/emails" \
      -H "Authorization: Bearer ${RESEND_KEY}" \
      -H "Content-Type: application/json" \
      -d "{\"from\":\"EmitHQ Cron <cron@emithq.com>\",\"to\":\"julian@naac.ai\",\"subject\":\"[HN Karma] Cron failed\",\"text\":\"${msg}\nTimestamp: $(date -Iseconds)\nLog: ${LOG_DIR}/hn-karma.log\"}" \
      > /dev/null 2>&1
  fi
}

echo "$(date -Iseconds) | hn-karma | starting"

# Random delay: 0-4 hours (0-14400 seconds) to vary posting time
DELAY=$((RANDOM % 14400))
echo "$(date -Iseconds) | hn-karma | sleeping ${DELAY}s ($(( DELAY / 60 ))m)"
sleep "$DELAY"

echo "$(date -Iseconds) | hn-karma | woke up, calling claude -p"

# Call claude with the karma prompt — sonnet is cheaper
# --allowed-tools: grant the tools the prompt needs (non-interactive = no approval UI)
OUTPUT=$("$CLAUDE" -p --model sonnet \
  --allowed-tools "Bash,WebFetch,Read,Write,Skill" \
  "$(cat "$PROMPT_FILE")" 2>&1) || {
  notify_failure "claude -p exited with error. Output: ${OUTPUT:0:500}"
  exit 1
}

# Check for known failure patterns in output
if echo "$OUTPUT" | grep -qi "ERROR: HN cookie expired"; then
  notify_failure "HN cookie expired. Re-export from browser to ~/.hn-cookie"
  exit 1
fi

if echo "$OUTPUT" | grep -qi "ERROR:"; then
  notify_failure "claude -p reported error. Output: ${OUTPUT:0:500}"
  exit 1
fi

echo "$OUTPUT"
echo "$(date -Iseconds) | hn-karma | done"
