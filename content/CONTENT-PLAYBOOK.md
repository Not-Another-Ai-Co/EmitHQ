# Content Playbook — EmitHQ

## Pre-Launch: Competitive Outlier Research

Before publishing any content, study what already works in the dev tools niche.

### Step 1: Identify 5-10 Target Accounts

Find accounts in the webhook/dev-tools/infrastructure space that post regularly. Include:

- Svix, Hookdeck, Convoy founders/accounts (direct competitors)
- Developer infrastructure founders (Resend, Neon, Upstash, Railway)
- Technical bloggers who cover webhooks/APIs/infrastructure
- HN accounts that consistently reach the front page with dev tool content

### Step 2: Calculate Their Baselines

For each account, pull their last 50-100 posts. Calculate mean engagement (likes, retweets, comments). This is their baseline.

### Step 3: Identify Outliers

Sort by engagement descending. Flag anything at 3x+ above baseline. For each outlier, record:

| Field             | What to capture                                                                            |
| ----------------- | ------------------------------------------------------------------------------------------ |
| **Hook**          | First line or title — what pattern? (question, bold claim, number, story, contrarian take) |
| **Format**        | Thread vs single, long vs short, text vs image/code                                        |
| **Topic**         | Which content pillar? What specific angle?                                                 |
| **Timing**        | Day, time, news context                                                                    |
| **Why it worked** | Your hypothesis — what need did it satisfy?                                                |

### Step 4: Build Content Matrix

Topics on one axis, formats on the other. Mark where outliers cluster. Those cells are validated opportunities — write content for those cells first.

---

## Attribution Setup

Every piece of content must be trackable to signup conversions.

### UTM Parameters

All links in content use UTMs:

```
https://emithq.com/?utm_source=twitter&utm_medium=social&utm_content=launch-thread
https://emithq.com/?utm_source=hackernews&utm_medium=social&utm_content=show-hn
https://emithq.com/?utm_source=devto&utm_medium=blog&utm_content=why-we-built
https://emithq.com/docs?utm_source=twitter&utm_medium=social&utm_content=architecture-thread
```

### Conversion Goals (Plausible)

Set up in Plausible dashboard:

- **Signup** — user creates account (free tier)
- **First event** — user sends their first webhook
- **Upgrade** — user subscribes to a paid tier

### Tracking Spreadsheet

Maintain a simple tracking sheet (or use `content/metrics.md`):

| Date | Platform | Content | UTM slug | Views | Clicks | Signups | Conv Rate |
| ---- | -------- | ------- | -------- | ----- | ------ | ------- | --------- |
|      |          |         |          |       |        |         |           |

Update weekly.

---

## Content Feedback Loop

### Weekly (15 min)

1. Check impressions/engagement on all posts from the past week
2. Flag anything at 3x+ your baseline as an outlier
3. Check Plausible for content-attributed signups (Campaigns report)

### Monthly (30 min)

1. Analyze top 5 posts by engagement — extract hook/format patterns
2. Analyze top 3 posts by conversion (signups attributed via UTM)
3. Compare: do high-engagement posts = high-conversion posts? (Often they don't)
4. Update content template with winning patterns
5. Kill content types that consistently get zero conversions

### Quarterly (1 hour)

1. Full review: which content pillars drive signups vs which drive only traffic?
2. Re-run competitive outlier research (accounts may have shifted)
3. Adjust content pillar weights based on conversion data
4. Document findings in `content/iteration-notes.md`

---

## Content Pillars for EmitHQ

Based on dev-tools outlier research, these pillars tend to perform:

| Pillar                      | Example                                           | Funnel Stage | Measure By             |
| --------------------------- | ------------------------------------------------- | ------------ | ---------------------- |
| **Technical deep-dives**    | Architecture post, retry strategy                 | Mid          | Engagement + authority |
| **"I built this" launches** | Show HN, launch threads                           | Top          | Volume + signups       |
| **Contrarian/educational**  | "Why your webhook system will break at 1M events" | Mid          | Engagement             |
| **Comparison/positioning**  | EmitHQ vs Svix vs Hookdeck                        | Bottom       | Conversion rate        |
| **Specific numbers**        | "We deliver 99.9% of webhooks in <200ms"          | Bottom       | Conversion rate        |

**Key principle:** Top-funnel content (awareness) measured by volume. Bottom-funnel content (comparison, pricing) measured by conversion rate. Don't mix the metrics.

---

## Rules

1. Never publish without UTM links — unattributed content is unmeasurable
2. Study competitors' outliers before writing new content
3. Views are vanity — conversions are the metric
4. Consistency enables measurement — need 20-30 posts to calculate a meaningful baseline
5. Low-cost validation first: tweet the idea → if it gets traction → write the blog post → if it converts → make the video
6. Update this playbook quarterly with what you've learned
