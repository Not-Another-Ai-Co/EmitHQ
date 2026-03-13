# Research: Content & Distribution Strategy
**Date:** 2026-03-13
**Status:** Complete
**Linked to:** T-006

## Summary

Content marketing is the primary growth engine — no paid acquisition. Three content pillars: (1) comparison/alternative pages targeting buyers actively evaluating solutions, (2) technical deep-dives establishing credibility, (3) "State of Webhooks" original research for backlinks and authority. Show HN launch coordinated with open-source repo release and 3 blog posts. Discord for community. SEO compounds over 12-18 months with 702% average ROI for B2B SaaS.

## SEO Keyword Strategy

### Target Keywords (Estimated Search Volume)

**Bottom-of-Funnel (Buyer Intent — Highest Priority):**

| Keyword | Intent | Difficulty | Content Type |
|---------|--------|------------|--------------|
| webhook service | Buying | Medium | Landing page |
| webhook platform | Buying | Medium | Landing page |
| webhook as a service | Buying | Low | Landing page |
| svix alternative | Comparison | Low | Comparison page |
| hookdeck alternative | Comparison | Low | Comparison page |
| svix vs hookdeck | Comparison | Low | Comparison page |
| webhook infrastructure | Buying/Research | Medium | Landing page + blog |
| managed webhook delivery | Buying | Low | Landing page |
| webhook management platform | Buying | Low | Landing page |
| open source webhook | Research/Buying | Medium | GitHub + blog |

**Mid-Funnel (Problem-Aware):**

| Keyword | Intent | Difficulty | Content Type |
|---------|--------|------------|--------------|
| webhook retry logic | Problem | Medium | Technical blog |
| webhook delivery reliability | Problem | Low | Technical blog |
| webhook dead letter queue | Problem | Low | Technical blog |
| webhook signature verification | Problem | Medium | Tutorial |
| webhook security best practices | Problem | Medium | Guide |
| how to send webhooks | Tutorial | High | Tutorial |
| webhook payload transformation | Problem | Low | Technical blog |
| webhook monitoring dashboard | Problem | Low | Product-led blog |

**Top-of-Funnel (Awareness):**

| Keyword | Intent | Difficulty | Content Type |
|---------|--------|------------|--------------|
| what are webhooks | Education | High | Guide (competitive, but drives traffic) |
| webhooks vs polling | Education | Medium | Blog |
| webhooks vs websockets | Education | Medium | Blog |
| build vs buy webhook | Decision | Low | Blog (product-led) |
| webhook best practices | Education | Medium | Guide |
| event-driven architecture | Education | High | Blog |

### SEO Strategy Principles

1. **Bottom-of-funnel first** — comparison and alternative pages convert the highest (43.8% of ChatGPT-cited pages are "Best X" listicles)
2. **Product-led content** — every blog post naturally demonstrates the product solving the problem
3. **Original research** — B2B SaaS sites with original research have 29.7% organic traffic vs 9.3% without
4. **Technical depth** — developer audience values substance over marketing fluff
5. **SEO ROI:** 702% average for B2B SaaS with 7-month break-even (First Page Sage 2026)

## Content Calendar — First 3 Months

### Pre-Launch (Before Show HN)

| # | Title | Type | Funnel | SEO Target |
|---|-------|------|--------|------------|
| 1 | "Why We Built [Product Name]: The $49-$490 Webhook Pricing Gap" | Origin story | Top | webhook service, webhook platform |
| 2 | "Webhook Delivery Architecture: How We Achieve 99.99% Reliability" | Technical deep-dive | Mid | webhook delivery reliability |
| 3 | "Svix vs Hookdeck vs [Us]: Webhook Platform Comparison 2026" | Comparison | Bottom | svix alternative, hookdeck alternative |

### Month 1 (Launch Month)

| # | Title | Type | Funnel | SEO Target |
|---|-------|------|--------|------------|
| 4 | "The Complete Guide to Webhook Retry Logic" | Tutorial | Mid | webhook retry logic |
| 5 | "How to Add Webhooks to Your SaaS in 5 Minutes" | Tutorial | Mid | how to send webhooks |
| 6 | "Build vs Buy: The Webhook Infrastructure Decision in 2026" | Decision guide | Bottom | build vs buy webhook |
| 7 | "Webhook Security: HMAC Signatures, SSRF Protection, and Standard Webhooks" | Guide | Mid | webhook security best practices |

### Month 2

| # | Title | Type | Funnel | SEO Target |
|---|-------|------|--------|------------|
| 8 | "State of Webhooks 2026" (original research) | Research | Top | webhooks, webhook best practices |
| 9 | "Why Your Webhook System Will Break at 1M Events/Month" | Problem-aware | Mid | webhook infrastructure |
| 10 | "Webhook Payload Transformations Without Code" | Product-led | Mid | webhook payload transformation |
| 11 | "From Stripe Webhooks to Your Backend: A Reliability Guide" | Tutorial | Mid | webhook delivery reliability |

### Month 3

| # | Title | Type | Funnel | SEO Target |
|---|-------|------|--------|------------|
| 12 | "How [Customer Name] Replaced Their DIY Webhook System" | Case study | Bottom | webhook management platform |
| 13 | "Webhooks vs Polling vs WebSockets: When to Use Each" | Education | Top | webhooks vs polling |
| 14 | "The Hidden Costs of Self-Hosted Webhook Infrastructure" | Decision | Bottom | managed webhook delivery |
| 15 | "Monitoring Webhook Delivery: Metrics That Matter" | Technical | Mid | webhook monitoring dashboard |

## Show HN Launch Plan

### Pre-Launch Checklist
- [ ] Product is stable and usable (not perfect, but functional)
- [ ] Open-source repo is clean with good README
- [ ] Documentation site is live with quickstart guide
- [ ] Landing page is live with pricing
- [ ] Blog posts #1-3 are published
- [ ] GitHub repo has CI/CD badges, license, contributing guide
- [ ] Demo environment or free tier is accessible without approval

### Show HN Post Format

**Title:** `Show HN: [Product Name] – Open-source webhook infrastructure with a $49/mo cloud`

**Post body (guidelines from successful launches):**
- Talk as a fellow builder, not a marketer
- Explain the problem (the $49-$490 pricing gap)
- Show what you built and why
- Link to GitHub repo (HN overindexes on open-source)
- Be honest about what's missing and what's next
- Use modest language — no "fastest" or "best"

**Engagement plan:**
- Post on a weekday (Tuesday-Thursday), morning US time (9-10am ET)
- Respond to EVERY comment within 30 minutes for the first 6 hours
- Be genuine, technical, and helpful in responses
- Share architecture decisions when asked — developers appreciate transparency
- Don't get defensive about competition — acknowledge Svix/Hookdeck and explain differentiation

### Expected outcomes (based on comparable launches)
- Outpost (webhook OSS): 67 pts, 8 comments
- Svix Show HN: moderate reception
- Plausible adblocker study: 100%+ signup spike
- Realistic target: 50-150 pts, 20-50 comments, 50-200 signups

## Developer Community Platform

### Decision: Discord

**Why Discord over Slack/GitHub Discussions:**
- Discord is where developers hang out in 2026 (shifted from Slack)
- Real-time conversation + async threads
- Free (no message history limits like Slack free tier)
- Integrations: GitHub bots, webhook notifications (meta — we use our own product)
- Channels: #general, #help, #feature-requests, #show-and-tell, #bugs, #announcements

**GitHub Discussions for:**
- Feature request voting (public roadmap)
- Long-form technical discussions
- Community-generated examples and tutorials

### Community engagement cadence
- Respond to Discord questions within 4 hours during business hours
- Weekly "What are you building?" thread
- Monthly community call or AMA (optional, once community is >100 members)
- Highlight community projects in blog posts

## Social Media Strategy

### Twitter/X (Primary)
- **Frequency:** 3-5 posts/week
- **Content mix:**
  - 40% technical tips and webhook insights
  - 30% product updates and milestones
  - 20% engagement (responding to webhook/developer tool discussions)
  - 10% behind-the-scenes (building in public)
- **Tone:** Technical, helpful, modest. Not salesy.
- **Key follows/engagements:** Developer tool founders, API/platform engineers, webhook-related discussions

### Dev.to
- Cross-post every technical blog post
- Engage in comments
- Tag appropriately (#webhooks, #devtools, #opensource, #typescript)

### LinkedIn
- Cross-post origin story and milestone posts
- Target engineering managers and CTOs (persona from T-002)
- Less frequent (1-2/week)

### Reddit
- r/SaaS, r/webdev, r/devops, r/node — participate authentically
- Don't self-promote — answer webhook questions and mention the product naturally
- Post significant milestones (open-source launch, $10K MRR, etc.)

## Integration Marketplace Strategy

### Platforms to list on (post-launch)
- **Vercel Integration Marketplace** — webhook delivery for Vercel-deployed apps
- **Railway Templates** — self-hosted deployment template
- **Cloudflare Workers Examples** — webhook handling examples
- **awesome-selfhosted** — GitHub list (high-value for open-source)
- **AlternativeTo** — listed as alternative to Svix, Hookdeck
- **G2/Capterra** — create free profiles for review collection
- **Product Hunt** — secondary launch (not primary — HN is better for dev tools)

## Distribution Funnel

```
GitHub repo (stars, contributors) ←→ Blog (SEO traffic)
         ↓                                    ↓
    Show HN / Reddit / Twitter         Comparison pages
         ↓                                    ↓
    Landing page (pricing, signup CTA)
         ↓
    Free tier (100K events)
         ↓
    Activation (first event sent)
         ↓
    Upgrade to Starter ($49/mo)
         ↓
    Expansion to Growth/Scale
```

### Conversion targets
- Blog → signup: 2-5% of visitors
- GitHub → signup: 1-3% of visitors
- Free → paid: 5-8% within 60 days
- Starter → Growth: 20-30% within 12 months

## Budget

| Item | Monthly Cost | Notes |
|------|-------------|-------|
| Domain + DNS | ~$1/mo (amortized) | Cloudflare |
| Blog hosting | $0 | Static site on Cloudflare Pages |
| Email (Resend/Postmark) | ~$10/mo | Lifecycle + transactional emails |
| Discord | $0 | Free |
| SEO tools | $0 | Google Search Console, free tier Ubersuggest |
| Total | **~$11/mo** | |

**$0 paid acquisition.** All growth is organic: SEO + open-source + community + Show HN.

## Sources

- [How to Launch a Dev Tool on Hacker News — Markepear](https://www.markepear.dev/blog/dev-tool-hacker-news-launch)
- [Beyond the Blog: 2026 SEO Playbook for SaaS — Cato Marketing](https://www.catomarketing.com/post/beyond-the-blog-a-2026-seo-playbook-for-saas-businesses)
- [SaaS Content Marketing Strategy 2025 — Growth Minded](https://growthmindedmarketing.com/blog/saas-content-strategy/)
- [B2B SaaS SEO Guide 2026 — Marketer Milk](https://www.marketermilk.com/blog/saas-seo)
- T-002: `docs/research/customer-discovery.md` (buyer personas)
- T-005: `docs/research/open-source-strategy.md` (open-source launch strategy)
- Knowledge base: `~/.claude/knowledge/seo-llm-visibility/` and `content-copywriting/`
