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

You MUST use the Skill tool to invoke the "content" skill for drafting. This produces higher quality, more natural writing.

Call it like this:

```
Skill(skill="content", args="Write a single Hacker News comment about this thread: '[TITLE]' — [BRIEF DESCRIPTION OF THE THREAD AND EXISTING DISCUSSION]. Requirements: 2-4 sentences of genuine technical insight. Draw from real infrastructure engineering experience. HN culture: understated, technical, slightly contrarian is fine, no marketing speak, no emojis, no bullet points, no markdown (HN uses plain text). NEVER mention EmitHQ, webhooks, or any product. Vary style: sometimes a short observation, sometimes a longer technical take, sometimes a question. Output ONLY the raw comment text — no preamble, no metadata, no skill status lines.")
```

After the skill returns, extract ONLY the comment text — strip any skill metadata lines (like "Skipping the approval gate..." or "The brief is fully specified..."). The comment should be plain text ready to post.

## Step 5: Post the Comment

Use the Bash tool to run a Python script that handles cookie auth, HMAC extraction, URL encoding, and posting. Python avoids all shell escaping issues with special characters in comment text.

For each comment you want to post, run this via the Bash tool — replacing STORY_ID_HERE with the actual story ID and COMMENT_TEXT_HERE with the drafted comment text (triple-quoted, so quotes/apostrophes are safe):

```bash
python3 << 'PYEOF'
import urllib.request
import urllib.parse
import re
import sys

COOKIE = open("/home/jfinnegan0/.hn-cookie").read().strip()
STORY_ID = "STORY_ID_HERE"
COMMENT = """COMMENT_TEXT_HERE"""

headers = {"Cookie": f"user={COOKIE}"}

# Verify cookie is still valid
req = urllib.request.Request("https://news.ycombinator.com/news", headers=headers)
page = urllib.request.urlopen(req).read().decode()
if "logout" not in page:
    print("ERROR: HN cookie expired. Julian needs to re-export from browser.")
    sys.exit(1)

# Get hmac from story page
req = urllib.request.Request(f"https://news.ycombinator.com/item?id={STORY_ID}", headers=headers)
page = urllib.request.urlopen(req).read().decode()
match = re.search(r'name="hmac" value="([^"]+)"', page)
if not match:
    print("ERROR: Could not extract hmac token from story page.")
    sys.exit(1)
hmac_val = match.group(1)

# Post the comment
data = urllib.parse.urlencode({
    "parent": STORY_ID,
    "hmac": hmac_val,
    "text": COMMENT,
    "goto": f"item?id={STORY_ID}"
}).encode()
req = urllib.request.Request("https://news.ycombinator.com/comment", data=data, headers=headers)
try:
    resp = urllib.request.urlopen(req)
    print(f"SUCCESS: Posted to story {STORY_ID} (HTTP {resp.status})")
except urllib.error.HTTPError as e:
    if e.code == 302:
        print(f"SUCCESS: Posted to story {STORY_ID} (HTTP 302 redirect)")
    else:
        print(f"ERROR: HTTP {e.code} — {e.reason}")
        sys.exit(1)

# Verify comment appears on profile
req = urllib.request.Request("https://news.ycombinator.com/threads?id=emithq", headers=headers)
threads = urllib.request.urlopen(req).read().decode()
preview = COMMENT[:50].replace("'", "&#x27;")
if preview in threads or COMMENT[:30] in threads:
    print("VERIFIED: Comment appears on profile.")
else:
    print("WARNING: Could not verify comment on profile (may take a moment to appear).")
PYEOF
```

Replace `STORY_ID_HERE` and `COMMENT_TEXT_HERE` with the actual values. The heredoc with `'PYEOF'` (quoted) prevents bash from interpolating anything — the Python script handles all encoding safely.

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
