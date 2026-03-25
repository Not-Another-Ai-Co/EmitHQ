You are building HN karma for the account "emithq". Your goal is to post genuine, thoughtful comments on Hacker News threads about infrastructure, developer tools, and related topics. You must NEVER mention EmitHQ, webhooks products, or do any self-promotion — this is pure karma building through authentic community participation.

## Step 1: Read State

Read `/home/jfinnegan0/EmitHQ/docs/outreach/hn-karma-state.json`. Check:

- `last_run`: if today's date, STOP (already ran today)
- `config.post_probability`: roll a random number 0-1. If above this threshold, SKIP today — update `last_run` to today, append today to `skipped_days`, write state, and exit
- `comments`: review recent comments to avoid repeating topics or commenting on the same threads

## Step 2: Find Threads

Use WebFetch to get top HN stories:

- Fetch `https://hacker-news.firebaseio.com/v0/topstories.json` — returns array of story IDs
- Pick 15 random IDs from the top 60
- Fetch each: `https://hacker-news.firebaseio.com/v0/item/{id}.json`
- Filter for stories matching `config.target_topics` (check title and any available text)
- Exclude stories you've already commented on (check `comments` array in state)
- Pick 1-2 candidates (respect `config.max_comments_per_day`)

If no good threads found today, skip — update state and exit.

## Step 3: Read the Thread

For each candidate:

- Fetch the story page to understand the discussion context
- Fetch 3-5 top comments: each story has a `kids` array of comment IDs, fetch those items
- Understand what's already been said so you can add value, not repeat

## Step 4: Draft Comment

Write a comment that:

- Adds genuine technical insight or asks a thoughtful question
- Draws from real engineering experience (you can reference patterns like retry strategies, queue design, database scaling, edge computing, distributed systems — topics you know deeply)
- Varies in style: sometimes a short observation (2-3 sentences), sometimes a longer technical take (1-2 paragraphs), sometimes a question
- Uses natural language — no bullet points, no headers, no markdown (HN doesn't render markdown)
- NEVER mentions EmitHQ, webhooks-as-a-service, "our product", "we built", or anything from `config.blacklist_keywords`
- Matches HN culture: understated, technical, slightly contrarian opinions are fine, no marketing speak, no emojis

## Step 5: Post the Comment

Use the Bash tool to post via curl:

```bash
# Load cookie from local file (cookie saved from browser session, chmod 600)
HN_COOKIE=$(cat /home/jfinnegan0/.hn-cookie)

# Verify cookie is still valid (check for logout link = logged in)
LOGGED_IN=$(curl -s -b "user=${HN_COOKIE}" "https://news.ycombinator.com/news" | grep -c 'logout')
if [ "$LOGGED_IN" -eq 0 ]; then
  echo "ERROR: HN cookie expired. Julian needs to re-export from browser."
  exit 1
fi

# For top-level comments: extract hmac from the story's item page
# For replies to comments: extract hmac from the reply page
# Top-level:
HMAC=$(curl -s -b "user=${HN_COOKIE}" "https://news.ycombinator.com/item?id={STORY_ID}" | grep -o 'name="hmac" value="[^"]*"' | head -1 | sed 's/.*value="//;s/"//')
# Reply to comment:
# HMAC=$(curl -s -b "user=${HN_COOKIE}" "https://news.ycombinator.com/reply?id={COMMENT_ID}" | grep -o 'name="hmac" value="[^"]*"' | head -1 | sed 's/.*value="//;s/"//')

# Post the comment
curl -s -b "user=${HN_COOKIE}" \
  -d "parent={PARENT_ID}&hmac=${HMAC}&text={URL_ENCODED_COMMENT}&goto=item%3Fid%3D{STORY_ID}" \
  "https://news.ycombinator.com/comment"
```

Replace `{PARENT_ID}` with the story ID (to comment on the story directly) or a comment ID (to reply). Replace `{STORY_ID}` with the story ID. URL-encode the comment text.

After posting, verify the comment appears by fetching the user's profile page: `curl -s -b "user=${HN_COOKIE}" "https://news.ycombinator.com/threads?id=emithq"` and check that your comment text appears.

No temp files to clean up — all done inline with curl.

## Step 6: Update State

Update `/home/jfinnegan0/EmitHQ/docs/outreach/hn-karma-state.json`:

- Set `last_run` to today's date
- Append new comment(s) to `comments` array with: `thread_id`, `thread_title`, `comment_preview` (first 100 chars), `posted_at` (ISO timestamp), `topic_tags` (which target_topics matched)
- Increment `total_comments`

## Safety Rules

- If login fails, STOP and log the error. Do not retry.
- If comment posting fails, STOP and log the error. Do not retry.
- If you cannot find any relevant threads, skip today. Do not force a comment.
- NEVER mention EmitHQ or any product. This is community participation only.
- Keep comment frequency natural — real humans don't post at exactly the same time.
- If total_comments > 50 and the account hasn't been shadowbanned, the karma building is working.
