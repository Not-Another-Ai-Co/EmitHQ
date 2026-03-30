#!/usr/bin/env bash
# Social content drafting + scheduling cron — drafts weekly X posts via Claude, schedules via Postiz API
# Schedule: 0 9 * * 1 (Monday 9:00 AM ET)
# Usage: scripts/social-content.sh
#
# Postiz API auth: Authorization: <key> (no Bearer prefix)
# Postiz POST /api/public/v1/posts — see docs/outreach/social-setup-checklist.md for full API reference
# X integration ID: cmn46ven50001nr7x1p1usi4u

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DRAFTS_FILE="$PROJECT_DIR/docs/outreach/x-weekly-drafts.md"
LOG_DIR="$PROJECT_DIR/logs"
X_INTEGRATION_ID="cmn46ven50001nr7x1p1usi4u"
POSTIZ_BASE="http://localhost:4007/api/public/v1"

mkdir -p "$LOG_DIR"

log() { echo "[$(date -Iseconds)] $1" >> "$LOG_DIR/social-content.log"; }
log "Starting weekly social content drafting"

# Load Postiz API key from 1Password
if command -v op &>/dev/null; then
  POSTIZ_API_KEY=$(set -a && source ~/.config/1password-connect.env && set +a && op read "op://EmitHQ/postiz-config/api_key" 2>/dev/null) || true
fi

# Calculate schedule dates (Mon 2pm UTC, Wed 2pm UTC, Fri 2pm UTC)
# Script runs on Monday — "today" for Mon, "next Wednesday/Friday" for mid/end of week
MON_DATE=$(date -u -d "today 14:00" +%Y-%m-%dT%H:%M:%S.000Z)
WED_DATE=$(date -u -d "next Wednesday 14:00" +%Y-%m-%dT%H:%M:%S.000Z)
FRI_DATE=$(date -u -d "next Friday 14:00" +%Y-%m-%dT%H:%M:%S.000Z)

# Use claude -p to draft 3 posts for the week
# Uses /content skill conventions: voice rules, anti-slop, audience-appropriate language
claude -p --model sonnet "You are drafting 3 X (Twitter) posts for @EmitHQ this week.

Read these files for context:
- docs/outreach/content-calendar.md (content pillars and weekly cadence)
- docs/outreach/x-seed-posts.md (tone reference)
- docs/outreach/drafts/ (past drafts — avoid repeating topics)

Audience: SaaS developers (Series A-C, 10-50 engineers) deciding whether to build webhooks in-house or buy a service. They care about reliability, dev time, and pricing — not cryptographic implementation details.

Voice rules:
- Lead with the insight, not the product
- No self-promotion in the first 3 words
- Opinionated and direct — take a position
- Specific examples over generic statements
- Vary sentence length — fragments are fine
- No fabricated metrics
- Each post covers a different content pillar

Banned: delve, robust, seamless, comprehensive, leverage, utilize, navigate, landscape, journey, game-changing, cutting-edge. No 'In today'\''s world' openers. No 'It'\''s worth noting' filler.

Format:
- Single tweets: max 280 characters
- Threads (2-4 tweets): use when the idea needs setup + payoff
- End with something that invites replies — a question, a contrarian claim, or a relatable pain point
- No hashtags. No links in the body (put links in replies).

Output format — write ONLY this JSON to stdout, nothing else:
[
  {\"day\": \"monday\", \"type\": \"single\", \"tweets\": [\"tweet text here\"]},
  {\"day\": \"wednesday\", \"type\": \"thread\", \"tweets\": [\"tweet 1\", \"tweet 2\", \"tweet 3\"]},
  {\"day\": \"friday\", \"type\": \"single\", \"tweets\": [\"tweet text here\"]}
]
" > "$DRAFTS_FILE" 2>> "$LOG_DIR/social-content.log"

log "Drafts written to $DRAFTS_FILE"

# Schedule drafts via Postiz API if key is available
if [ -n "${POSTIZ_API_KEY:-}" ]; then
  log "Scheduling posts via Postiz API"

  DATES=("$MON_DATE" "$WED_DATE" "$FRI_DATE")
  DAYS=("monday" "wednesday" "friday")

  for i in 0 1 2; do
    DAY="${DAYS[$i]}"
    DATE="${DATES[$i]}"

    # Extract tweets for this day from JSON drafts
    TWEETS=$(python3 -c "
import json, sys
data = json.load(open('$DRAFTS_FILE'))
for post in data:
    if post['day'] == '$DAY':
        tweets = post['tweets']
        values = []
        for t in tweets:
            values.append(json.dumps({'content': t, 'image': []}))
        print('[' + ','.join(values) + ']')
        break
" 2>&1) || { log "Failed to parse JSON for $DAY — check $DRAFTS_FILE"; continue; }

    if [ -z "$TWEETS" ]; then
      log "No tweets found for $DAY, skipping"
      continue
    fi

    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$POSTIZ_BASE/posts" \
      -H "Authorization: $POSTIZ_API_KEY" \
      -H "Content-Type: application/json" \
      -d "{
        \"type\": \"schedule\",
        \"date\": \"$DATE\",
        \"shortLink\": false,
        \"tags\": [],
        \"posts\": [{
          \"integration\": { \"id\": \"$X_INTEGRATION_ID\" },
          \"value\": $TWEETS,
          \"settings\": { \"__type\": \"x\", \"who_can_reply_post\": \"everyone\" }
        }]
      }" 2>&1)

    HTTP_CODE=$(echo "$RESPONSE" | tail -1)
    BODY=$(echo "$RESPONSE" | head -n -1)

    if [ "$HTTP_CODE" = "201" ]; then
      log "Scheduled $DAY post for $DATE — $BODY"
    else
      log "Failed to schedule $DAY post (HTTP $HTTP_CODE): $BODY"
    fi
  done

  log "Scheduling complete"
else
  log "POSTIZ_API_KEY not available — drafts saved to markdown only"
fi
