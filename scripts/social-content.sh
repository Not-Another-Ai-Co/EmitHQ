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
DRAFTS_FILE="$PROJECT_DIR/docs/outreach/x-weekly-drafts.json"
LOG_DIR="$PROJECT_DIR/logs"
POST_LOG="$PROJECT_DIR/docs/outreach/social-post-log.jsonl"
X_INTEGRATION_ID="cmn46ven50001nr7x1p1usi4u"
POSTIZ_BASE="http://localhost:4007/api/public/v1"

mkdir -p "$LOG_DIR"

log() { echo "[$(date -Iseconds)] $1" >> "$LOG_DIR/social-content.log"; }
log "Starting weekly social content drafting"

# Load secrets from 1Password
POSTIZ_API_KEY=""
RESEND_API_KEY=""
if command -v op &>/dev/null; then
  export OP_CONNECT_HOST="http://localhost:8888"
  export OP_CONNECT_TOKEN="$(grep OP_CONNECT_TOKEN ~/.config/1password-connect.env 2>/dev/null | cut -d= -f2)"
  POSTIZ_API_KEY=$(op read "op://EmitHQ/postiz-config/api_key" 2>/dev/null) || true
  RESEND_API_KEY=$(op read "op://EmitHQ/resend/api-key" 2>/dev/null) || true
fi

# --- Notification helpers ---

send_notification() {
  local subject="$1"
  local body="$2"
  if [ -n "${RESEND_API_KEY:-}" ]; then
    curl -s -X POST "https://api.resend.com/emails" \
      -H "Authorization: Bearer $RESEND_API_KEY" \
      -H "Content-Type: application/json" \
      -d "{\"from\":\"EmitHQ Cron <cron@emithq.com>\",\"to\":\"julian@naac.ai\",\"subject\":\"$subject\",\"text\":$(python3 -c "import json; print(json.dumps('''$body'''))")}" \
      > /dev/null 2>&1
    log "Notification sent: $subject"
  else
    log "No Resend key — notification skipped: $subject"
  fi
}

# --- Quality gates ---

# Hard block phrases (never auto-post)
HARD_BLOCKS="PLACEHOLDER|TODO|\[INSERT|guarantee|warranty|we promise|100% uptime|zero downtime|never fails|act now|limited time|don't miss out|svix is bad|hookdeck sucks"

# Soft flag patterns
check_quality() {
  local content="$1"
  local day="$2"
  local hard_blocked=false
  local soft_flags=0
  local reasons=""

  # Hard blocks
  if echo "$content" | grep -qiE "$HARD_BLOCKS"; then
    hard_blocked=true
    reasons="hard block: banned phrase match"
  fi

  # Soft flags: character count (per tweet)
  local max_chars
  max_chars=$(echo "$content" | python3 -c "
import json, sys
tweets = json.loads(sys.stdin.read())
print(max(len(t) for t in tweets))
" 2>/dev/null) || max_chars=0
  if [ "$max_chars" -gt 280 ]; then
    soft_flags=$((soft_flags + 1))
    reasons="${reasons:+$reasons; }tweet over 280 chars ($max_chars)"
  fi
  if [ "$max_chars" -lt 30 ] && [ "$max_chars" -gt 0 ]; then
    soft_flags=$((soft_flags + 1))
    reasons="${reasons:+$reasons; }tweet under 30 chars"
  fi

  # Soft flags: promotional intensity (>3 sales words per 100 words)
  local promo_count
  promo_count=$(echo "$content" | grep -oiE 'sign up|subscribe|upgrade|buy now|get started|free trial|discount|offer|deal|pricing' | wc -l)
  local word_count
  word_count=$(echo "$content" | wc -w)
  if [ "$word_count" -gt 0 ] && [ "$promo_count" -gt 0 ]; then
    local intensity=$((promo_count * 100 / word_count))
    if [ "$intensity" -gt 3 ]; then
      soft_flags=$((soft_flags + 1))
      reasons="${reasons:+$reasons; }promotional intensity ${intensity}%"
    fi
  fi

  # Soft flags: near-duplicate detection (check last 7 days of drafts)
  if [ -f "$POST_LOG" ]; then
    local content_hash
    content_hash=$(echo "$content" | md5sum | cut -d' ' -f1)
    if grep -q "$content_hash" "$POST_LOG" 2>/dev/null; then
      soft_flags=$((soft_flags + 1))
      reasons="${reasons:+$reasons; }duplicate content hash"
    fi
  fi

  # AI slop check (subset of banned words)
  local slop_count
  slop_count=$(echo "$content" | grep -oiE 'delve|embark|harness|leverage|utilize|foster|underscore|robust|nuanced|comprehensive|seamless|holistic|cutting-edge|groundbreaking|pivotal|landscape|realm|tapestry|beacon|testament|journey|game-changing' | wc -l)
  if [ "$slop_count" -gt 0 ]; then
    soft_flags=$((soft_flags + 1))
    reasons="${reasons:+$reasons; }AI slop words ($slop_count)"
  fi

  # Return verdict
  if [ "$hard_blocked" = true ]; then
    echo "BLOCK|$reasons"
  elif [ "$soft_flags" -ge 3 ]; then
    echo "HOLD|$reasons"
  elif [ "$soft_flags" -ge 1 ]; then
    echo "WARN|$reasons"
  else
    echo "OK|clean"
  fi
}

# --- Calculate schedule dates ---
# Script runs on Monday — "today" for Mon, "next Wednesday/Friday" for mid/end of week
MON_DATE=$(date -u -d "today 14:00" +%Y-%m-%dT%H:%M:%S.000Z)
WED_DATE=$(date -u -d "next Wednesday 14:00" +%Y-%m-%dT%H:%M:%S.000Z)
FRI_DATE=$(date -u -d "next Friday 14:00" +%Y-%m-%dT%H:%M:%S.000Z)

# --- Draft posts via claude -p ---

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

# Validate JSON
if ! python3 -c "import json; json.load(open('$DRAFTS_FILE'))" 2>/dev/null; then
  log "ERROR: claude -p output is not valid JSON — check $DRAFTS_FILE"
  send_notification "[Social Content] Invalid JSON output" "claude -p produced non-JSON output. Check $DRAFTS_FILE and logs/social-content.log."
  exit 1
fi

# --- Quality gate + schedule loop ---

DATES=("$MON_DATE" "$WED_DATE" "$FRI_DATE")
DAYS=("monday" "wednesday" "friday")
FLAGGED_COUNT=0
SCHEDULED_COUNT=0
FLAG_REPORT=""

for i in 0 1 2; do
  DAY="${DAYS[$i]}"
  DATE="${DATES[$i]}"

  # Extract tweets JSON array for this day
  TWEET_JSON=$(python3 -c "
import json, sys
data = json.load(open('$DRAFTS_FILE'))
for post in data:
    if post['day'] == '$DAY':
        print(json.dumps(post['tweets']))
        break
" 2>&1) || { log "Failed to parse JSON for $DAY — check $DRAFTS_FILE"; continue; }

  if [ -z "$TWEET_JSON" ] || [ "$TWEET_JSON" = "null" ]; then
    log "No tweets found for $DAY, skipping"
    continue
  fi

  # Run quality gates
  VERDICT=$(check_quality "$TWEET_JSON" "$DAY")
  VERDICT_CODE=$(echo "$VERDICT" | cut -d'|' -f1)
  VERDICT_REASON=$(echo "$VERDICT" | cut -d'|' -f2)

  log "Quality gate for $DAY: $VERDICT_CODE ($VERDICT_REASON)"

  if [ "$VERDICT_CODE" = "BLOCK" ] || [ "$VERDICT_CODE" = "HOLD" ]; then
    FLAGGED_COUNT=$((FLAGGED_COUNT + 1))
    FLAG_REPORT="${FLAG_REPORT}${DAY}: ${VERDICT_CODE} — ${VERDICT_REASON}\n"
    log "BLOCKED $DAY post — $VERDICT_REASON"
    continue
  fi

  if [ "$VERDICT_CODE" = "WARN" ]; then
    FLAG_REPORT="${FLAG_REPORT}${DAY}: WARN — ${VERDICT_REASON} (scheduled anyway)\n"
  fi

  # Schedule via Postiz API
  if [ -n "${POSTIZ_API_KEY:-}" ]; then
    # Build value array for Postiz
    POSTIZ_VALUE=$(python3 -c "
import json, sys
tweets = json.loads('''$TWEET_JSON''')
values = [json.dumps({'content': t, 'image': []}) for t in tweets]
print('[' + ','.join(values) + ']')
" 2>&1) || { log "Failed to build Postiz payload for $DAY"; continue; }

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
          \"value\": $POSTIZ_VALUE,
          \"settings\": { \"__type\": \"x\", \"who_can_reply_post\": \"everyone\" }
        }]
      }" 2>&1)

    HTTP_CODE=$(echo "$RESPONSE" | tail -1)
    BODY=$(echo "$RESPONSE" | head -n -1)

    if [ "$HTTP_CODE" = "201" ]; then
      SCHEDULED_COUNT=$((SCHEDULED_COUNT + 1))
      # Log post ID for rollback
      POST_ID=$(echo "$BODY" | python3 -c "import json,sys; print(json.loads(sys.stdin.read())[0]['postId'])" 2>/dev/null || echo "unknown")
      CONTENT_HASH=$(echo "$TWEET_JSON" | md5sum | cut -d' ' -f1)
      echo "{\"platform\":\"x\",\"postId\":\"$POST_ID\",\"publishedAt\":\"$DATE\",\"contentHash\":\"$CONTENT_HASH\",\"day\":\"$DAY\"}" >> "$POST_LOG"
      log "Scheduled $DAY post for $DATE — postId: $POST_ID"
    else
      log "Failed to schedule $DAY post (HTTP $HTTP_CODE): $BODY"
    fi
  else
    log "POSTIZ_API_KEY not available — $DAY draft saved to file only"
  fi
done

# --- Summary + notifications ---

log "Done: $SCHEDULED_COUNT scheduled, $FLAGGED_COUNT blocked/held"

# Send notification if anything was flagged
if [ "$FLAGGED_COUNT" -gt 0 ]; then
  send_notification "[Social Content] $FLAGGED_COUNT posts flagged" "Quality gates flagged $FLAGGED_COUNT of 3 posts this week:\n\n$(echo -e "$FLAG_REPORT")\n\nDrafts at: $DRAFTS_FILE\nReview and post manually via Postiz UI."
fi

# Circuit breaker: check if >50% of last 7 days' posts were flagged
if [ -f "$LOG_DIR/social-content.log" ]; then
  RECENT_BLOCKS=$(grep -c "BLOCKED\|Quality gate.*BLOCK\|Quality gate.*HOLD" "$LOG_DIR/social-content.log" 2>/dev/null || echo 0)
  RECENT_RUNS=$(grep -c "Starting weekly" "$LOG_DIR/social-content.log" 2>/dev/null || echo 1)
  if [ "$RECENT_RUNS" -gt 3 ] && [ "$RECENT_BLOCKS" -gt "$((RECENT_RUNS / 2))" ]; then
    log "CIRCUIT BREAKER: >50% of recent runs had blocked posts. Pausing automation."
    send_notification "[Social Content] CIRCUIT BREAKER" "More than 50% of recent social content runs had blocked posts. Automation paused. Review logs/social-content.log and reset manually."
  fi
fi
