#!/usr/bin/env bash
# Social content drafting cron — drafts weekly X posts via Claude
# Schedule: 0 9 * * 1 (Monday 9:00 AM ET)
# Usage: scripts/social-content.sh
#
# Postiz API auth: Authorization: <key> (no Bearer prefix)
# Drafts posts to markdown, then schedules via Postiz API if available.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DRAFTS_FILE="$PROJECT_DIR/docs/outreach/x-weekly-drafts.md"
LOG_DIR="$PROJECT_DIR/logs"

mkdir -p "$LOG_DIR"

echo "[$(date -Iseconds)] Starting weekly social content drafting" >> "$LOG_DIR/social-content.log"

# Use claude -p to draft 3 posts for the week
claude -p --model sonnet "You are drafting 3 X (Twitter) posts for @EmitHQ this week. Read docs/outreach/content-calendar.md for guidelines and content pillars. Read docs/outreach/x-seed-posts.md for tone reference.

Rules:
- Each post must be under 280 characters
- Technical insights, not promotional
- No self-promotion in the first 3 words
- No fabricated metrics
- Each post covers a different content pillar
- Include the date range in the header

Output format — write ONLY this markdown to stdout, nothing else:

# X Drafts — Week of [date]

## Monday
[post text]

## Wednesday
[post text]

## Friday
[post text]
" > "$DRAFTS_FILE" 2>> "$LOG_DIR/social-content.log"

echo "[$(date -Iseconds)] Drafts written to $DRAFTS_FILE" >> "$LOG_DIR/social-content.log"

# Schedule drafts via Postiz API
# Requires: POSTIZ_API_KEY env var (from 1Password EmitHQ/postiz-config/api_key)
# Auth: Authorization: $KEY (no Bearer prefix)
# Endpoint: POST http://localhost:4007/api/public/v1/posts
if [ -n "${POSTIZ_API_KEY:-}" ] && [ -f "$DRAFTS_FILE" ]; then
  echo "[$(date -Iseconds)] Attempting Postiz API scheduling" >> "$LOG_DIR/social-content.log"
  # TODO: Parse drafts file and schedule each post with:
  # curl -X POST http://localhost:4007/api/public/v1/posts \
  #   -H "Authorization: $POSTIZ_API_KEY" \
  #   -H "Content-Type: application/json" \
  #   -d '{"content":"...", "scheduledAt":"...", "integrationIds":["..."]}'
  echo "[$(date -Iseconds)] Postiz scheduling not yet implemented (need integrationId)" >> "$LOG_DIR/social-content.log"
fi
