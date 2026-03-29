# Content Calendar — EmitHQ

> Last updated: 2026-03-29

## Weekly Cadence

| Day | Channel | Content Type                                            | Notes                                              |
| --- | ------- | ------------------------------------------------------- | -------------------------------------------------- |
| Mon | X       | Technical insight (architecture, patterns)              | Non-promotional. Share knowledge.                  |
| Wed | X       | Build-in-public update OR industry observation          | Pricing research, competitor moves, webhook trends |
| Fri | X       | Link share — blog post, HN thread, or external resource | Can link to own content with commentary            |
| Sat | HN      | 0-2 comments on infra/devtools threads                  | Automated via `scripts/hn-karma.sh` cron           |

## Content Pillars

1. **Webhook architecture patterns** — persist-before-enqueue, jitter, circuit breakers, SSRF, signing
2. **Pricing transparency** — infrastructure costs, margin analysis, VC-backed pricing dynamics
3. **Open-source infrastructure** — AGPL vs MIT vs ELv2, self-hosting, trust decisions
4. **TypeScript infrastructure** — Hono, BullMQ, Drizzle ORM, Node.js for infra tools

## Content Rules

- No self-promotion in the first 3 words. Lead with the insight, not the product.
- Never disparage competitors by name in social posts. Blog posts can compare factually.
- Every post should be useful even if the reader never visits emithq.com.
- Code snippets > generic statements. Show the actual TypeScript.
- No fabricated metrics. Only use real production numbers once they exist.

## Platform-Specific Formats

### X (Twitter)

- Max 280 chars. Thread format (2-4 tweets) for deeper topics.
- Use code screenshots sparingly — they don't get indexed.
- Hashtags: use 0-1 per post. #webhooks only when directly relevant.
- Engage with replies. Quote-tweet interesting webhook/API discussions.

### Dev.to

- Cross-post from emithq.com/blog with canonical_url pointing back.
- Tags: max 4. Primary: `webhooks`. Rotate: `opensource`, `typescript`, `architecture`, `saas`, `security`.
- Cross-post within 24h of publishing on emithq.com.

### HN

- Comments only (no submissions) until karma >= 50 for Show HN.
- Topics: infrastructure, webhooks, API design, developer tools, TypeScript, open source.
- No self-promotion keywords. Automated safety blacklist enforced by cron.

### LinkedIn (when API approved)

- 1-2 posts/week. More narrative/business-oriented than X.
- Company page posts. Julian's personal profile for high-reach posts.

### Reddit (when API approved + 2 weeks karma)

- r/selfhosted: "I built..." post with full technical transparency.
- 9:1 ratio: 9 non-promotional comments per 1 promotional post.
- Julian posts manually. Claude drafts only.

## Automation

| Script                      | Schedule                | What it does                                        |
| --------------------------- | ----------------------- | --------------------------------------------------- |
| `scripts/hn-karma.sh`       | Daily 10:00 AM ET       | Drafts + posts 0-2 HN comments via `claude -p`      |
| `scripts/social-content.sh` | Weekly (Mon 9:00 AM ET) | Drafts 3 X posts for the week, schedules via Postiz |

## Seeding Tracker

Initial content to establish active profiles:

### X (@EmitHQ)

- [x] Post 1: Persist-before-enqueue pattern (2026-03-29)
- [x] Post 2: Why we chose AGPL over MIT (2026-03-29)
- [x] Post 3: Full-jitter vs decorrelated jitter (2026-03-29)
- [x] Post 4: SSRF protection in webhook delivery (2026-03-29)
- [x] Post 5: The $49-$490 pricing gap observation (2026-03-29)

### Dev.to

- [x] "Why We Built EmitHQ" cross-post (2026-03-29)
- [x] "Webhook Delivery Architecture" cross-post (2026-03-29)

### LinkedIn (blocked — API approval pending)

- [ ] Company page description + logo + website
- [ ] Post 1: Origin story (adapt from blog)
- [ ] Post 2: Architecture overview (adapt from blog)

### Reddit (blocked — API approval + karma window)

- [ ] r/selfhosted post: "I built an open-source webhook platform"
