#!/usr/bin/env bash
# Social content drafting cron — drafts weekly X posts via Claude
# Schedule: 0 9 * * 1 (Monday 9:00 AM ET)
# Usage: scripts/social-content.sh
#
# NOTE: Postiz API auth is currently broken (401 on all auth headers).
# Until fixed, this script drafts posts to docs/outreach/x-weekly-drafts.md
# for manual posting via Postiz UI. When Postiz API works, add scheduling.

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

# TODO: When Postiz API auth is fixed, add scheduling:
# 1. Read Postiz API key from 1Password
# 2. POST /api/public/v1/posts with { content, scheduledAt, integrationIds }
# 3. Log scheduled post IDs
