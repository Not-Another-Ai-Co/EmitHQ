# Research: Social Media & Community Presence Strategy

**Date:** 2026-03-22
**Status:** Complete
**Linked to:** T-093, T-091, T-092, T-090

## Summary

For a solo developer with Claude driving execution, the highest-ROI social strategy is narrow and deep, not wide and shallow. Tier 1 platforms (Hacker News, Reddit, Dev.to) drive actual developer tool signups. Twitter/X and LinkedIn are credibility signals that support outreach but rarely drive direct conversions at zero-audience scale. Bluesky, Mastodon, and Threads are not worth the effort. The key insight: social media is a supporting actor for cold outreach (T-090), not the main acquisition channel. Build-in-public content should be repurposed across 3 platforms maximum, not custom-created for each.

## Platform-by-Platform Analysis

### Tier 1: Must-Have (Drive Signups)

#### Hacker News

- **Audience fit:** Perfect. HN readers are the exact buyer persona — senior developers and CTOs evaluating infrastructure tools. Show HN posts for developer tools routinely generate 50-300 signups.
- **Content type:** Show HN (one shot — covered by T-095), thoughtful comments on webhook/infrastructure discussions, Ask HN responses.
- **Automation potential:** None. HN has no API for posting. Manual only. Claude can draft comments but Julian must post them.
- **Effort:** Low ongoing (10 min/day reading + commenting to build karma). High one-time (Show HN execution).
- **Expected impact:** Highest single-day signup spike of any channel. Convoy got 88 points/53 comments on their Show HN. Plausible's viral moment came from HN-adjacent content. PostHog got 300 deployments from their HN launch.
- **Account setup:** Julian likely has an account. If not, create one now and start commenting to build karma before Show HN. Minimum 2-4 weeks of active commenting before launching.
- **Strategy:** Comment authentically on infrastructure, webhook, and developer tool threads 3-5x/week. Share interesting technical articles (not self-promotion). Build karma to 50+ before Show HN. The goal is that when Show HN launches, Julian's account looks like a real community member, not a drive-by promoter.

#### Reddit

- **Audience fit:** Strong for r/selfhosted (open-source angle), r/SaaS (pricing/business angle), r/webdev and r/node (technical angle). r/selfhosted is particularly high-value — the community actively seeks open-source infrastructure tools.
- **Content type:** "I built..." posts with technical transparency (stack, architecture, limitations), answering webhook-related questions, participating in "what tools do you use" threads.
- **Automation potential:** Very low. Reddit's culture is aggressively anti-bot. Must be manual. Claude can draft responses, but Julian posts them. The 9:1 rule (9 non-promotional interactions per 1 promotional) is enforced culturally and sometimes by moderators.
- **Effort:** Medium (20-30 min/day for authentic engagement). Must build comment history before any self-promotion.
- **Expected impact:** Medium-high for r/selfhosted specifically. Self-hosted tool announcements regularly hit 100+ upvotes and generate GitHub stars + signups. Lower for r/webdev (more noise, harder to stand out).
- **Account setup:** Julian needs a Reddit account with comment history. Start engaging 2+ weeks before any product mention.
- **Key subreddits:**
  - r/selfhosted (1.8M+ members) — AGPL open-source angle, "I self-host my webhook infrastructure"
  - r/webdev (2M+ members) — technical posts about webhook patterns
  - r/SaaS (~100K members) — build-in-public updates, pricing discussions
  - r/node (~200K members) — BullMQ patterns, Hono framework discussions
  - r/devops — infrastructure architecture posts
- **Risk:** Getting banned for self-promotion. Mitigate by genuinely participating for weeks before mentioning EmitHQ.

#### Dev.to

- **Audience fit:** Good. Developer audience that reads technical content. Posts get indexed by Google (SEO value) and cited by LLMs. Lower buying intent than HN but higher volume.
- **Content type:** Cross-posted blog articles (origin story from T-091, technical deep-dive from T-092), tutorials, "Today I Learned" posts about webhook patterns.
- **Automation potential:** High. Dev.to has a full REST API for creating and updating articles. Claude can programmatically cross-post from emithq.com/blog with canonical URL pointing back to the original. API key available in account settings.
- **Effort:** Very low after initial setup. Write once on emithq.com, auto-cross-post to Dev.to.
- **Expected impact:** Medium. Dev.to posts rarely drive immediate signups, but they build SEO authority, create LLM-citable content, and provide shareable links for outreach emails.
- **Account setup:** Create account at dev.to. Can be "EmitHQ" organization account or Julian's personal. Generate API key. Tags to use: #webhooks, #opensource, #typescript, #devtools.
- **API details:** `POST https://dev.to/api/articles` with `api-key` header. Fields: `title`, `body_markdown`, `published`, `canonical_url`, `tags`. Set `canonical_url` to emithq.com/blog/... to avoid duplicate content penalties.

### Tier 2: Nice-to-Have (Credibility Signals)

#### Twitter/X

- **Audience fit:** Moderate. Developer tool founders and DevRel people are active. But organic reach for zero-follower accounts is near zero. Twitter is a credibility signal (outreach recipients will check your Twitter), not a discovery channel at this stage.
- **Content type:** Build-in-public updates, technical insights, launch announcements, engaging with webhook/API discussions.
- **Automation potential:** Expensive. X API Basic tier is $100/month for programmatic posting. Third-party tools (Buffer at $5/channel/month, Typefully at $8/month) offer scheduling at lower cost. For a zero-follower account, $100/month for API access is not justified.
- **Effort:** Low (5-10 min/day if manual, near-zero if scheduled).
- **Expected impact:** Low for direct signups. High for credibility — cold outreach recipients will Google "EmitHQ" and check Twitter. An active account with technical posts looks legitimate. An empty or nonexistent account looks suspect.
- **Account setup:** Create @EmitHQ account (or use Julian's personal account with EmitHQ content). Manual posting is fine at this volume. Consider Buffer free tier (3 channels, 10 scheduled posts per channel) for basic scheduling.
- **Recommended cadence:** 2-3 posts/week. Technical insights, architecture decisions, pricing research snippets. Not promotional — share knowledge.
- **Key insight:** At zero followers, Twitter posts get zero impressions unless they're replies to popular threads. The value is the profile existing and looking active, not the posts themselves driving traffic.

#### LinkedIn

- **Audience fit:** Moderate. Engineering managers and CTOs (our buyer persona) are on LinkedIn, but company page organic reach has dropped to 1.6% of followers in 2026. Personal profile posts get 561% more reach than company page posts.
- **Content type:** Origin story, milestone posts, architecture decisions. More narrative/business-oriented than Twitter.
- **Automation potential:** LinkedIn API requires app approval and is restricted. Manual posting is the realistic path. Buffer supports LinkedIn scheduling.
- **Effort:** Low (1-2 posts/week, 10 min each).
- **Expected impact:** Low for direct signups. Medium for outreach credibility — cold email recipients often check LinkedIn. A company page with a few posts looks more legitimate than nothing.
- **Account setup:** Create EmitHQ LinkedIn company page. Julian's personal profile is more effective for reach but mixes personal and product branding. Recommendation: company page for credibility, Julian's personal profile for high-value posts.
- **Key insight:** LinkedIn's algorithm in 2026 heavily favors personal profiles over company pages. The 1.6% reach means a company page with 100 followers reaches ~2 people per post. Not worth optimizing for — just maintain a presence.

#### Indie Hackers

- **Audience fit:** Good for the build-in-public narrative. Community of solo founders building profitable products. Appreciates transparency about revenue, metrics, decisions.
- **Content type:** Milestone posts ("first customer," "first $100 MRR"), build-in-public updates, pricing decisions, lessons learned.
- **Automation potential:** None. No API. Manual posting only.
- **Effort:** Low (1 post/week, 15-20 min).
- **Expected impact:** Low for direct signups (most IH members are builders, not buyers of webhook infrastructure). Medium for community support, accountability, and cross-pollination with HN audience.
- **Account setup:** Create account or use Julian's existing account. Create a product page for EmitHQ.
- **Key insight:** IH is most valuable after you have metrics to share. "I built a webhook platform" gets little engagement. "How I got my first 10 customers for an open-source webhook platform" gets significant engagement.

### Tier 3: Skip (Low ROI for Developer Tools)

#### Bluesky

- **Why skip:** 1.5M daily active users (down from 2.5M peak), heavily skewed toward journalists and politics. Developer tool audience is minimal. Free API is nice but audience doesn't justify the effort.
- **Revisit when:** Bluesky's developer community grows significantly.

#### Mastodon

- **Why skip:** Fragmented across instances, small developer tool audience, no discovery algorithm. Posts only reach followers — no viral potential.
- **Revisit when:** Never for EmitHQ's use case.

#### Threads

- **Why skip:** 300M MAU but audience skews consumer/casual. Developer tools get zero traction. 2-3x the organic reach of X means nothing if the audience isn't developers.
- **Revisit when:** Meta adds developer-focused features or communities.

#### Discord (own server)

- **Why skip for now:** Creating a Discord server at zero customers means an empty server, which looks worse than no server. Discord is valuable at 50+ active users. Premature at 0.
- **Revisit when:** 10+ active users who need a support channel. Until then, GitHub Discussions or email support is sufficient.
- **Exception:** Joining existing Discord communities (developer tool communities, self-hosted communities) to participate in discussions is Tier 1 activity. Creating your own server is Tier 3.

#### Product Hunt

- **Why skip for now:** Covered by T-095 (Show HN first, PH second). PH audience skews more consumer/SaaS than developer infrastructure. Time it 1-2 weeks after Show HN.
- **Revisit when:** Show HN is complete and metrics exist.

#### YouTube / Video Content

- **Why skip:** Video production is high-effort for a solo developer. Short-form video dominates social (1200% more shares), but developer tool buyers don't discover infrastructure tools via TikTok or YouTube Shorts.
- **Revisit when:** EmitHQ has enough users to justify tutorial videos or has a marketing hire.

## Content Calendar Framework

### Content Pillars (3 pillars, not 5)

1. **Technical depth** (50%) — Architecture decisions, webhook patterns, retry logic, signing, reliability
2. **Build-in-public** (30%) — Metrics, milestones, decisions, pricing research, lessons learned
3. **Industry insight** (20%) — Webhook ecosystem trends, competitor analysis, pricing gap commentary

### Repurposing Strategy: Write Once, Distribute Three Times

Every piece of content starts as one artifact and gets repurposed:

```
Blog post on emithq.com/blog
    ├── Cross-post to Dev.to (API, automatic, canonical URL)
    ├── Extract 3-5 key insights → Twitter/X thread or posts
    ├── Summarize as build-in-public update → Indie Hackers
    └── If r/selfhosted relevant → Reddit post (rewritten, not cross-posted)
```

### Weekly Cadence (Minimum Viable)

| Day       | Platform      | Content Type               | Time   | Who                                    |
| --------- | ------------- | -------------------------- | ------ | -------------------------------------- |
| Monday    | Twitter/X     | Technical insight (1 post) | 5 min  | Claude drafts, Julian reviews/posts    |
| Tuesday   | HN            | Comment on 1-2 threads     | 10 min | Claude finds threads, Julian comments  |
| Wednesday | Twitter/X     | Build-in-public update     | 5 min  | Claude drafts, Julian posts            |
| Thursday  | Reddit        | Answer a webhook question  | 15 min | Claude finds questions, Julian answers |
| Friday    | Dev.to        | Cross-post blog (if new)   | 0 min  | Automated via API                      |
| Weekend   | Indie Hackers | Weekly milestone update    | 15 min | Julian posts                           |

**Total time commitment:** ~50 min/week for Julian. Claude handles drafting and thread discovery.

### Monthly Content Production

| Content Piece               | Platform            | Effort    | Who Writes                    |
| --------------------------- | ------------------- | --------- | ----------------------------- |
| 1 blog post (technical)     | emithq.com → Dev.to | 2-3 hours | Claude drafts, Julian reviews |
| 4-8 Twitter posts           | Twitter/X           | 30 min    | Claude drafts                 |
| 2-4 Reddit comments/answers | Reddit              | 1 hour    | Claude finds, Julian posts    |
| 2-4 HN comments             | Hacker News         | 40 min    | Claude finds, Julian comments |
| 2-4 IH milestone updates    | Indie Hackers       | 1 hour    | Julian writes                 |

**Total monthly effort for Julian:** ~5-6 hours. Sustainable for a solo developer.

## Automation Architecture

### What Claude Can Automate

1. **Dev.to cross-posting** — Full API automation. Claude writes the blog post, publishes to emithq.com, then POSTs to Dev.to API with canonical URL. Zero Julian involvement after initial API key setup.
2. **Content drafting** — Claude drafts all Twitter posts, Reddit comments, HN comment suggestions, blog posts. Julian reviews and posts.
3. **Thread/question discovery** — Claude can search Reddit, HN, and Twitter for webhook-related questions, compile a daily/weekly list of threads worth engaging with.
4. **Mention monitoring alerts** — Claude can process F5Bot emails or equivalent alerts, classify mentions, and draft responses.
5. **Content calendar management** — Claude tracks what was posted where, when the next post is due, what topics have been covered.

### What Needs Manual Tools

| Tool               | Purpose                                                       | Cost                           | Recommendation                   |
| ------------------ | ------------------------------------------------------------- | ------------------------------ | -------------------------------- |
| F5Bot              | Monitor Reddit/HN for "webhook", "svix", "hookdeck", "emithq" | Free                           | Use immediately                  |
| Google Alerts      | Monitor web for brand mentions                                | Free                           | Use immediately                  |
| Talkwalker Alerts  | Monitor web + Twitter for brand mentions                      | Free                           | Use as Google Alerts supplement  |
| Buffer (free tier) | Schedule Twitter/LinkedIn posts                               | $0 (3 channels, 10 posts each) | Use if scheduling becomes needed |

**Skip for now:** CatchIntent, Syften, Awario, Brand24 — all paid, not justified at zero audience. F5Bot + Google Alerts covers 80% of monitoring needs for free.

### What Julian Must Do Manually

1. **Post to Hacker News** — No API. Must be manual.
2. **Post to Reddit** — Must be manual (anti-bot culture). Claude drafts, Julian posts from his account.
3. **Post to Indie Hackers** — No API. Manual.
4. **Post to LinkedIn** — API restricted. Manual or Buffer.
5. **Post to Twitter/X** — Manual or Buffer free tier. API is $100/month (not justified).
6. **Create accounts** — All platforms require human account creation.
7. **Respond to DMs/replies** — Especially on Reddit and HN where authenticity matters.

### Account Creation Checklist

| Platform      | Account Type                       | Manual?                             | Priority                              |
| ------------- | ---------------------------------- | ----------------------------------- | ------------------------------------- |
| Hacker News   | Julian's personal                  | Yes                                 | Immediate — needs karma building time |
| Reddit        | Julian's personal                  | Yes                                 | Immediate — needs comment history     |
| Dev.to        | EmitHQ org or Julian               | Yes (account), No (posting via API) | Before first blog post                |
| Twitter/X     | @EmitHQ                            | Yes                                 | Before cold outreach starts           |
| LinkedIn      | EmitHQ company page                | Yes                                 | Before cold outreach starts           |
| Indie Hackers | Julian's personal + EmitHQ product | Yes                                 | Week 2-3                              |
| F5Bot         | Email-based (Julian's email)       | Yes (2 min setup)                   | Immediate                             |
| Google Alerts | Julian's Google account            | Yes (2 min setup)                   | Immediate                             |

## Competitive Analysis: Svix/Hookdeck/Convoy Social Presence

### Svix

- **Twitter/X:** @SvixHQ — active, technical content, product updates. Moderate following (thousands, not tens of thousands). Regular posting cadence.
- **Blog:** svix.com/blog — active, technical deep-dives, Standard Webhooks spec advocacy. Strong SEO presence.
- **GitHub:** 2.5K+ stars on svix-webhooks. Active community.
- **Crunchbase:** Full profile with funding data ($10.5M raised).
- **G2:** Enterprise category listing.
- **LinkedIn:** Company page, moderate activity.
- **Content strategy:** Heavy on technical authority (they created Standard Webhooks spec). Blog posts about webhook patterns, security, scaling. Less build-in-public, more enterprise positioning.
- **What EmitHQ can learn:** Svix's authority comes from the Standard Webhooks spec, not social media volume. EmitHQ can't replicate this but can differentiate on pricing narrative and open-source transparency.

### Hookdeck

- **Twitter/X:** Active, product updates and technical content.
- **Blog:** Extensive content hub — "Webhooks Platform Guides," "Webhooks at Scale" guide. Monthly product updates.
- **G2:** Active reviews.
- **Stripe partnership:** Co-authored content on Stripe Developer Blog — high-authority backlink and credibility signal.
- **Unique tactic:** They track AI agent traffic to their docs and publicize it. Sophisticated content marketing.
- **Social proof:** "100B+ webhooks processed" — massive credibility metric.
- **What EmitHQ can learn:** Hookdeck's content hub strategy is excellent but requires sustained investment (they have a team). EmitHQ should focus on 2-3 high-quality blog posts rather than trying to match Hookdeck's volume. The Stripe partnership is not replicable at this stage.

### Convoy

- **Twitter/X:** Less active than Svix/Hookdeck.
- **GitHub:** MIT licensed, community-driven. Active issues/PRs.
- **Blog:** Occasional posts, less frequent than competitors.
- **Social strategy:** Community-driven, open-source-first. Less marketing polish.
- **What EmitHQ can learn:** Convoy's lower social presence hasn't killed them — they grew through direct network (Nigerian fintech ecosystem) and HN launch (88 pts, 53 comments). Social is supporting, not primary.

### Key Competitive Insight

None of the competitors have massive social media followings. Svix's advantage is the Standard Webhooks spec (authority), Hookdeck's is content volume + Stripe partnership, Convoy's is community + network. EmitHQ's differentiator is the pricing narrative ($49 vs $490) and AGPL open-source. The social strategy should amplify this differentiator, not try to compete on content volume.

## Integration with Existing Tickets

### T-091 (Origin Story Blog Post) — How It Feeds Social

The blog post is the foundational content piece. Distribution plan:

1. Publish on emithq.com/blog/why-we-built-emithq
2. Cross-post to Dev.to via API (with canonical URL)
3. Extract 5 key insights → 5 Twitter posts over 1 week
4. Post link + summary to r/SaaS and r/webdev (if Julian has enough comment history)
5. Share on Indie Hackers as first milestone post
6. Include link in cold outreach emails (T-090, touch #5 "resource share")
7. LinkedIn post on Julian's profile (narrative format, not link-dump)

### T-092 (Technical Deep-Dive Blog Post) — How It Feeds Social

1. Publish on emithq.com/blog/webhook-delivery-architecture
2. Cross-post to Dev.to via API
3. Extract architecture diagram + key decisions → Twitter thread
4. Post to r/node and r/devops (technical audience)
5. Include link in cold outreach emails (T-090, touch #2 "architecture story")
6. This is the Show HN supporting content — reference it in Show HN post

### T-093 (Community Presence) — Replanning Recommendations

Current T-093 acceptance criteria need updating based on this research:

**Keep:**

- Set up F5Bot or similar alert service for mentions of "webhook service", "svix", "hookdeck"
- Post first update on each platform

**Modify:**

- "Create EmitHQ accounts on: Dev.to, Indie Hackers" → Add: Twitter/X, LinkedIn company page, Reddit (Julian's personal), Hacker News (verify Julian has account)
- "Draft first 5 build-in-public posts" → Reduce to: Draft first 3 posts (1 origin story extract for Twitter, 1 "I'm building..." for IH, 1 technical insight for Dev.to)

**Add:**

- Set up Google Alerts for "emithq", "webhook platform", "svix alternative"
- Set up Talkwalker Alerts as supplement
- Configure Dev.to API for automated cross-posting
- Julian: start commenting on HN and Reddit immediately (karma/history building)

**Remove:**

- No Discord server (premature at 0 users)
- No Mastodon/Bluesky/Threads

### T-090 (Cold Outreach) — How Social Profiles Support Credibility

When a cold email recipient Googles "EmitHQ," they should find:

- emithq.com (landing site) — already live
- GitHub repo — already live
- npm package — already published
- Twitter/X profile — needs to exist and look active (5+ posts)
- LinkedIn company page — needs to exist with basic info
- Dev.to articles — needs 1-2 cross-posted blog posts
- Directory listings (T-106) — in progress

The social presence doesn't drive the outreach — it validates it. A founder who receives a cold email and finds an active web presence is more likely to respond than one who finds nothing.

## Risk Analysis

### Scenario 1: Skip Social Entirely

**Impact:** Cold outreach still works (email + landing site + GitHub is sufficient for credibility). Show HN still works (it's about the product, not the social presence). But:

- LLM discovery is reduced (fewer entity mentions across sources)
- Cold email recipients who Google "EmitHQ" find less validation
- No compounding content (blog posts don't get distributed)
- No mention monitoring means missed opportunities to join conversations

**Verdict:** Moderate risk. Social is not the primary channel, but skipping it entirely weakens every other channel slightly.

### Scenario 2: Minimum Viable Presence (Recommended)

**What this means:**

- Accounts exist on Twitter, LinkedIn, Dev.to, HN, Reddit
- 2-3 posts/week on Twitter (Claude-drafted)
- Blog posts auto-cross-posted to Dev.to
- Julian comments on HN/Reddit 2-3x/week
- F5Bot + Google Alerts for monitoring
- Total: ~50 min/week for Julian

**Impact:** Credibility signals in place for outreach. Content compounds via SEO. Mention monitoring catches opportunities. HN karma builds toward Show HN. Very sustainable.

**Verdict:** Best trade-off. High credibility impact, low time investment.

### Scenario 3: Full Presence (Not Recommended at This Stage)

**What this means:** Active posting on 6+ platforms, custom content per platform, Discord server, video content, daily engagement.

**Impact:** Spreads Julian too thin. Content quality drops. Most platforms have zero audience at start, so effort is wasted. Risk of looking like a marketing operation rather than a developer building something useful.

**Verdict:** Premature. Revisit after 50+ users and first revenue.

## Build-in-Public Content Guide

### What Makes Good Build-in-Public Content for Developer Tools

1. **Decisions, not just announcements** — "We chose BullMQ over QStash for outbound delivery because..." is more engaging than "We launched feature X"
2. **Numbers and metrics** — Revenue, users, events processed, uptime. Developers respect transparency with data.
3. **Failures and pivots** — "We thought X would work but it didn't because Y" gets more engagement than success posts
4. **Architecture and technical choices** — "Here's why we persist before enqueue" resonates with the developer audience
5. **Pricing research** — The $49 vs $490 pricing gap is inherently shareable content
6. **Comparisons done honestly** — Acknowledge what competitors do better. Developers smell bias.

### What to Share vs Keep Private

**Share freely:**

- Architecture decisions and trade-offs
- Pricing research and reasoning
- Feature roadmap and priorities
- Technology stack choices
- Growth metrics (users, events, revenue) once they exist
- Lessons learned and mistakes

**Keep private:**

- Customer names (without permission)
- Security implementation details (signing key generation, rate limit thresholds)
- Specific cold outreach tactics (recipients can Google you)
- Revenue numbers before they're impressive (wait until $1K+ MRR)
- Internal disagreements or frustrations

### Successful Build-in-Public Examples (Developer Tools)

- **PostHog:** Transparent about everything — revenue, hiring, product decisions. Their blog is a masterclass in build-in-public for developer tools.
- **Plausible:** Shared exact MRR numbers monthly. Their "road to $500K ARR" post drove massive engagement.
- **Cal.com:** Open-source + build-in-public. Shared GitHub stars, contributor counts, pricing evolution.
- **Resend:** Built react.email (OSS) publicly before the commercial product. Shared waitlist numbers.
- **Common pattern:** All shared metrics only after they had something worth sharing. "Zero users" is not a compelling build-in-public post. "How we got our first 10 users" is.

## Mention Monitoring Setup

### Free Tier Stack (Recommended)

| Tool              | Monitors             | Keywords                                                                                    | Setup Time |
| ----------------- | -------------------- | ------------------------------------------------------------------------------------------- | ---------- |
| F5Bot             | Reddit, HN, Lobsters | "emithq", "webhook platform", "svix alternative", "hookdeck alternative", "webhook service" | 5 min      |
| Google Alerts     | Web (blogs, news)    | "emithq", "webhook infrastructure", "svix vs hookdeck"                                      | 5 min      |
| Talkwalker Alerts | Web + Twitter        | Same as Google Alerts (wider coverage)                                                      | 5 min      |

**Total cost:** $0
**Coverage gaps:** No real-time social media monitoring. Mentions on Twitter/LinkedIn not captured until indexed. Acceptable at zero-audience stage.

### Upgrade Path (After First Revenue)

When monthly revenue justifies $20-40/month:

- **Syften** ($20/month) — Reddit + HN + forums with AI filtering, significantly less noise than F5Bot
- **Or** keep free stack and spend the money on Buffer Essentials ($5/channel) for scheduling

### How to Respond to Mentions

**Someone mentions webhooks/webhook infrastructure:**

- Join the conversation with genuine help. Share what you've learned, not what you've built.
- Only mention EmitHQ if directly relevant and after providing value.

**Someone asks about Svix/Hookdeck alternatives:**

- This is a buying signal. Respond with honest comparison. Acknowledge what competitors do well. Mention EmitHQ's pricing and open-source differentiator.
- Template: "I built EmitHQ as an open-source alternative (AGPL). $49/mo vs $490. It uses Standard Webhooks spec, BullMQ for delivery, and PostgreSQL RLS for tenant isolation. Happy to share more details if it's relevant to your use case."

**Someone mentions EmitHQ directly:**

- Respond within 4 hours. Thank them. Ask what they're building. Offer help.

## Recommendation

### Immediate Actions (This Week)

1. **Julian creates accounts:** HN (verify existing), Reddit, Twitter/X (@EmitHQ), LinkedIn (company page)
2. **Set up monitoring:** F5Bot (5 keywords), Google Alerts (3 keywords), Talkwalker Alerts (3 keywords)
3. **Start karma building:** Julian comments on 1-2 HN threads and 1-2 Reddit threads per day. No self-promotion yet.
4. **Claude sets up Dev.to API:** Generate API key, test cross-posting script

### Before Cold Outreach Starts (T-090)

1. Twitter/X has 5+ posts (technical insights, not promotional)
2. LinkedIn company page exists with description, logo, website link
3. Dev.to has at least 1 cross-posted article (from T-091 origin story)
4. HN account has 2+ weeks of comment history
5. Reddit account has 2+ weeks of comment history in relevant subreddits

### After First Blog Posts (T-091, T-092)

1. Auto-cross-post to Dev.to
2. Extract key insights for Twitter threads
3. Post to relevant Reddit subreddits (if enough comment history)
4. Share on Indie Hackers as build-in-public update

### After First Customers

1. Start sharing metrics on Indie Hackers
2. Post build-in-public updates with real numbers
3. Consider Indie Hackers product page
4. Reassess whether Discord server is warranted

## Sources

### Web Research (2026-03-22)

- [Social Media Strategy Blueprint for 2026 — Mixpost](https://mixpost.app/blog/the-strategic-blueprint-for-social-media-management-navigating-2025-and-beyond)
- [Emerging Social Media Platforms to Watch in 2026 — Conbersa](https://www.conbersa.ai/learn/emerging-social-platforms-2026)
- [Cross-Posting Automation: Publish Once, Syndicate Everywhere — DEV](https://dev.to/ryancwynar/cross-posting-automation-publish-once-syndicate-everywhere-32h2)
- [Blog Syndication: Cross-Publishing to Dev.to, Hashnode, and Medium](https://www.nvarma.com/blog/2026-02-10-cross-publishing-blog-posts-devto-hashnode-medium/)
- [Doing Self-Promotion on Reddit the Right Way — Vadim Kravcenko](https://vadimkravcenko.com/qa/self-promotion-on-reddit-the-right-way/)
- [4 Steps to Promote Your Side Project on Reddit Without Getting Banned](https://shipwithai.substack.com/p/4-steps-to-promote-your-side-project)
- [11 Proven Subreddits to Promote Tech (2026) — SubredditSignals](https://www.subredditsignals.com/blog/best-subreddits-to-promote-a-tech-product-in-2026-rules-real-examples-and-outreach-tips-that-don-t-get-you-banned)
- [Reddit Marketing for Indie Hackers Without Getting Banned — Calmops](https://calmops.com/indie-hackers/reddit-marketing-without-getting-banned/)
- [X (Twitter) API Pricing 2026: All Tiers Compared — Zernio](https://zernio.com/blog/twitter-api-pricing)
- [X API Pricing 2026: Free, Basic, Pro, and Pay-Per-Use — Postproxy](https://postproxy.dev/blog/x-api-pricing-2026/)
- [LinkedIn Company Page Reach in January 2026 — Ordinal](https://www.tryordinal.com/blog/the-declining-reach-of-linkedin-company-pages)
- [LinkedIn Algorithm 2026: How Reach, Engagement, and Visibility Work Now — DesignACE](https://www.designace.ca/blog/linkedin-algorithm-2026-how-it-actually-works)
- [LinkedIn's Organic Reach Crisis: 7 Tactics That Still Work — Athenic](https://getathenic.com/blog/linkedin-organic-reach-crisis-tactics-2026)
- [Bluesky API: Posting via the Bluesky API — Bluesky Docs](https://docs.bsky.app/blog/create-post)
- [Bluesky Playbook 2026: Automate, Moderate & Integrate — Blabla](https://blabla.ai/blog/bluesky)
- [2025 Developer Tool Trends: What Marketers Need to Know — Daily.dev](https://business.daily.dev/resources/2025-developer-tool-trends-what-marketers-need-to-know/)
- [10 Developer Marketing Best Practices for 2026 — Strategic Nerds](https://www.strategicnerds.com/blog/developer-marketing-best-practices-2026)
- [Developer Marketing in 2025: What Works, What's Changing — Carilu](https://www.carilu.com/p/developer-marketing-in-2025-what)
- [Best F5Bot Alternative for Real-Time Reddit Monitoring — CatchIntent](https://catchintent.com/blog/f5bot-alternative/)
- [10 Best F5Bot Alternatives with AI Filtering (2026) — Relato](https://www.relato.com/blog/f5bot-alternatives)
- [14 Best Free and Paid Google Alerts Alternatives in 2026 — Awario](https://awario.com/blog/best-google-alerts-alternatives/)
- [Buffer Pricing in 2026 — SocialChamp](https://www.socialchamp.com/blog/buffer-pricing/)
- [Buffer vs Typefully 2026 — SocialRails](https://socialrails.com/blog/buffer-vs-typefully)
- [Open Source Marketing Playbook for Indie Hackers (2026) — IndieRadar](https://indieradar.app/blog/open-source-marketing-playbook-indie-hackers)
- [Product Hunt Launch Guide 2026 for Indie Hackers — Calmops](https://calmops.com/indie-hackers/product-hunt-launch-guide/)

### Existing Project Research (Built Upon)

- `docs/research/content-distribution-strategy.md` — SEO keywords, Show HN plan, content calendar
- `docs/research/first-10-customers.md` — outreach playbook, community presence tactics
- `docs/research/llm-seo-discovery.md` — directory listings, LLM entity authority
- `~/.claude/knowledge/content-copywriting/research.md` — social content pillars, platform cadence
- `~/.claude/knowledge/sales-gtm/research.md` — speed-to-lead, lead lifecycle
- `~/.claude/knowledge/marketing-strategy/research.md` — buyer psychology, positioning
