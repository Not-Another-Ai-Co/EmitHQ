# EmitHQ Launch Day Plan

## Pre-Launch Checklist (Before Posting)

- [ ] Product is running and accepting signups (free tier accessible)
- [ ] Landing page live at emithq.com
- [ ] Documentation site live with quickstart
- [ ] GitHub repo is public with clean README, CONTRIBUTING.md, LICENSE
- [ ] Blog posts #1-3 published on the blog
- [ ] SDK published to npm (`@emithq/sdk`)
- [ ] Free tier works without credit card or approval
- [ ] Test the full signup → first event flow yourself
- [ ] Better Stack uptime monitor active on /health
- [ ] Status page live

## Launch Day Timeline

### Morning (9-10am ET, Tuesday-Thursday)

**9:00 AM ET** — Post Show HN

- Use the draft from `content/show-hn-draft.md`
- Title: `Show HN: EmitHQ – Open-source webhook infrastructure (AGPL) with a $49/mo cloud`
- Post from your HN account

**9:05 AM** — Post Twitter thread

- Use `content/twitter-launch-thread.md`
- Update [HN link] placeholder with actual URL
- Pin the thread to your profile

**9:10 AM** — Post Dev.to article

- Use `content/devto-crosspost.md`
- Set canonical URL to the blog post on emithq.com
- Add a note at the bottom: "Also discussed on [Hacker News](link)"

**9:15 AM** — Cross-post to relevant subreddits

- r/SaaS — "I built an open-source webhook platform"
- r/webdev — "Show r/webdev: webhook infrastructure for SaaS"
- r/node — if reception is positive on HN
- Be authentic, not promotional. Link to the HN discussion.

### First 6 Hours (9am - 3pm ET) — CRITICAL WINDOW

**Respond to every HN comment within 30 minutes.** This is non-negotiable. HN rewards engaged founders. Tips:

- Be technical and specific in responses
- Share architecture decisions when asked — transparency builds trust
- Acknowledge competitors fairly: "Svix is great, we just think there should be a $49 option"
- If someone points out a bug or weakness, acknowledge it honestly
- Don't get defensive. Ever.
- If someone asks about a missing feature, say "not yet — here's what's on the roadmap"

**Monitor:**

- HN comments (keep the tab open, refresh every 5 minutes)
- Twitter mentions and replies
- GitHub issues and stars
- Signup emails (if you have welcome emails configured)
- Dev.to comments

### Afternoon (3-6pm ET)

- Continue responding to HN (can slow to hourly checks)
- Respond to any Twitter replies
- Post a follow-up tweet with interesting stats: "X signups in the first 6 hours" or "Favorite HN comment: [quote]"
- Check GitHub for any issues opened

### Evening

- Write a brief internal recap: signups, stars, comments, feedback themes
- Respond to any remaining HN comments
- Thank people who shared or starred

## Response Templates

**"How is this different from Svix?"**

> Svix is excellent — they invented the Standard Webhooks spec and we implement it. The main difference is pricing. Svix goes from free to $490/mo. EmitHQ fills that gap with tiers at $49, $149, and $349. We also handle both inbound and outbound webhooks. If you can afford $490/mo, Svix is a great choice. If you can't, that's why EmitHQ exists.

**"Why AGPL and not MIT?"**

> The server is AGPL so that cloud providers can't take the code and offer it as a competing service without contributing back. SDKs are MIT — no licensing concerns for your application code. It's the same model Plausible uses. If you self-host for your own company, AGPL doesn't restrict you at all.

**"Why should I trust a solo developer with my webhook infrastructure?"**

> Fair question. The code is open source — you can audit every line. The architecture is designed so that even if the queue goes down, your messages are safe in PostgreSQL. And the free tier lets you evaluate thoroughly before committing. If reliability is your top concern and budget isn't, Svix has a larger team.

**"Can I self-host this?"**

> Yes — `docker compose up` gets you running. The self-hosting docs are still thin (it's early), but the architecture is straightforward: a Node.js API server, PostgreSQL, and Redis. I'm working on more comprehensive self-hosting docs and Helm charts.

## Post-Launch (Days 2-7)

- Respond to any remaining comments across all platforms
- Write a "Launch retrospective" internal note: what worked, what didn't, traffic/signup numbers
- Address any bugs or issues that came up during launch
- Follow up with anyone who offered feedback or suggestions
- Cross-post blog post #2 (architecture deep-dive) to Dev.to on day 3-4
- Share any interesting metrics on Twitter (day 3): "Xth star, Y signups, Z events processed"

## Metrics to Track

- HN: points, comments, front page duration
- GitHub: stars, forks, issues opened
- Signups: free tier registrations
- Twitter: impressions, followers gained, engagement
- Dev.to: views, reactions, comments
- Blog: page views (Plausible)
- First event sent: how many signups actually try the product
