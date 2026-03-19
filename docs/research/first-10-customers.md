# Research: First 10 Customers for a Bootstrapped Developer Tool SaaS

**Date:** 2026-03-19
**Status:** Draft — pending review

## Summary

Every successful bootstrapped dev tool follows the same zero-to-ten pattern: personal network first (users 1-3), direct outreach to people with the exact problem second (users 4-10), and public launch only after having real usage metrics to cite. The highest-priority activities at EmitHQ's current stage (live product, zero paying customers) are: (1) finding 5-10 companies already using Svix on GitHub and emailing founders directly, (2) offering free white-glove onboarding to the first 5, and (3) getting one person to pay even $10 before touching Show HN. Cross-referencing with open tickets, the warm-up phase (T-052, T-053, T-054) should execute before the launch phase (T-034, T-058), exactly as the existing GTM research recommended — but the ticket ordering underweights direct founder outreach and overweights content/blog work.

## Current State

**Product:** Fully built and deployed. API on Railway, dashboard on Vercel, landing on Vercel, Umami analytics on miniPC. 258+ tests. SDK published to npm. LLM-automatable signup endpoint live. OpenAPI spec, llm.txt, agents.json published.

**What's missing for first customers:**

- Zero real users, zero paying customers
- T-077 has 2 pending manual verification items (LLM signup returns 500, dashboard-after-signup untested)
- T-076 (Stripe Checkout E2E + live mode) not started — cannot accept real payments yet
- Show HN draft has [PLACEHOLDER] slots for real metrics
- No cold outreach has been executed
- No community presence established (X, Indie Hackers, Discord)

**Existing research coverage:** GTM execution (docs/research/gtm-execution.md), customer discovery (buyer personas), pricing model, content distribution strategy, and LLM-automatable onboarding are all complete. This research synthesizes the "how" of getting from zero to ten, not the "what to build."

## Adjacent Context

**Knowledge base:** Sales/GTM frameworks (`~/.claude/knowledge/sales-gtm/`), growth/retention patterns, marketing strategy/psychology — all informed the analysis below. Key transferable insight: speed-to-lead (contact within 5 minutes = 21x more likely to qualify) applies even at the zero-customer stage via founder-led response time.

## Findings

### 1. The Universal Pattern: How Dev Tools Get Users 1-10

Every company researched followed the same three-phase pattern:

| Phase                | Users   | Channel                                           | Examples                                                                                                                     |
| -------------------- | ------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Personal network** | 1-3     | Friends, former colleagues, Slack groups          | Svix (friend in Slack asked about webhooks), PostHog (friends manually added to DB), Resend ($10 payment link to a friend)   |
| **Direct outreach**  | 4-10    | Cold email, LinkedIn DMs, community participation | PostHog (2 meetings/day in Bay Area), Plausible (Indie Hackers posts), Convoy (Nigerian fintech companies)                   |
| **Public launch**    | 10-100+ | HN, Product Hunt, blog post going viral           | Plausible (blog post → 50K readers → 166 trials in one week), PostHog (HN → 300 deployments), Cal.com (HN → 5K GitHub stars) |

**The critical insight:** Phase 3 (public launch) works dramatically better when Phases 1-2 have produced real numbers. Plausible spent 14 months at $400 MRR before their viral moment. PostHog had real deployments before HN. Resend had 5K waitlist signups before public launch.

### 2. Specific Tactics That Worked for Each Company

**Svix (direct competitor):**

- Origin: Friend asked about webhooks in a Slack community. Tom Hacohen dug deeper and found the friend would pay him to build it. Several others in the same community validated demand.
- First customers: Nigerian fintech companies (Buycoins, Termii, GetWallets, Dojah) through co-founder Subomi's network, plus YC batch-mates.
- Key tactic: Validated willingness-to-pay before building the product.

**Resend:**

- Built react.email (open-source email components) first — 12K GitHub stars before the commercial product existed.
- First paying customer: sent a $10 payment link to a friend using the MVP. He paid. That gave them confidence to apply to YC.
- Waitlist: 5K+ signups during 6-month YC batch before public launch.
- Key tactic: Open-source project as lead generation for commercial product.

**Plausible:**

- First 14 months: $400 MRR, ~100 subscribers. Co-founder Uku tried to do dev + marketing alone — didn't work.
- Inflection: Marko Saric joined as marketing co-founder. Changed positioning to "privacy-friendly Google Analytics alternative." Started publishing 90% of time.
- Blog post "Why you should stop using Google Analytics" → 50K readers → 166 trials in one week (more than 4 months of prior acquisition combined).
- Key tactic: Content-driven growth with crystal-clear positioning against a dominant incumbent.

**PostHog:**

- Users 1-10: Friends, manually edited database to create accounts. Onboarded via Slack and WhatsApp.
- Users 10-50: James Hawkins set goal of 2 meetings/day. Mined LinkedIn contacts. Attended meetups, conferences, pitch days.
- First 1K: HN launch → 300 deployments. Then GitHub trending (spent ~$2K on Twitter promotion to get there).
- Key tactic: In-person relationship building before any public launch.

**Cal.com:**

- Started as side project (Calendso). Co-founder Bailey was one of the first subscribers.
- "Open source Calendly alternative" positioning was the hook.
- HN launch → 5K GitHub stars in weeks.
- Key tactic: Clear "open-source X" positioning against a well-known incumbent.

**Convoy:**

- First customers from founder's local fintech network in Nigeria (Buycoins, Termii, GetWallets, Dojah).
- HN launch: 88 points, 53 comments.
- Key tactic: Solved a real problem for people the founder already knew.

### 3. What This Means for EmitHQ

EmitHQ's situation is closest to **Svix pre-YC** or **Plausible pre-Marko**: a complete product with zero users and no public presence. The difference is EmitHQ has better infrastructure research and a validated pricing gap.

**Highest-priority activities, ranked:**

| Priority | Activity                             | Why                                                                        | Time to First Result         |
| -------- | ------------------------------------ | -------------------------------------------------------------------------- | ---------------------------- |
| **1**    | Fix T-076 (Stripe live mode)         | Cannot accept payment without this                                         | 1-2 days                     |
| **2**    | Fix T-077 remaining items            | Signup flow must work end-to-end                                           | 1 day                        |
| **3**    | Personal outreach to 5-10 people     | Every founder started here. Julian's network first.                        | 1 week                       |
| **4**    | GitHub code search for Svix users    | 50+ companies using `@svix/svix` = warm leads who already pay for webhooks | 1-2 weeks                    |
| **5**    | White-glove onboarding for first 3-5 | Concierge support, 1:1 calls, same-hour response time                      | Ongoing                      |
| **6**    | Get 1 person to pay (even $10)       | Validates willingness-to-pay before public launch                          | 2-3 weeks                    |
| **7**    | Build-in-public on X/Indie Hackers   | Compounds over weeks; seeds the audience that upvotes Show HN              | Start immediately, compounds |
| **8**    | Origin story blog post (T-055)       | Content that supports outreach ("here's why I built this")                 | 1 week                       |
| **9**    | Show HN (T-034)                      | Only after having real metrics to cite                                     | 4-6 weeks from now           |

### 4. The Anti-Pattern to Avoid

The biggest risk for EmitHQ right now is **premature public launch**. The research is unambiguous:

- Plausible launched publicly after 14 months of slow grind and it worked because they had metrics.
- Resend waited 6 months behind a waitlist.
- PostHog had real deployments before HN.
- The "is anyone using this?" comment on HN kills developer tools. You get one shot.

**EmitHQ's Show HN draft currently has [PLACEHOLDER] slots.** Those must be filled with real numbers before launch.

### 5. The Outreach Playbook (Specific to EmitHQ)

**Step 1: Julian's network (Users 1-3)**

- Who in Julian's professional network runs a SaaS that sends webhooks?
- Direct message: "I built an open-source webhook infrastructure tool. Would you try it and give me feedback? Free forever for early users."
- Offer to do the integration for them (white-glove).

**Step 2: GitHub code search (Users 4-10)**

- Search GitHub for `@svix/svix` in package.json files: `https://github.com/search?q=%22%40svix%2Fsvix%22+filename%3Apackage.json&type=code`
- For each result: identify the company, find the CTO/Staff Engineer on LinkedIn, send personalized email.
- Template: "Saw you're using Svix in [repo]. We built EmitHQ — open-source (AGPL), $49/mo vs $490. Happy to share a comparison. No pressure — curious if the pricing gap affects you."
- Volume: 20 emails/week. Expect 10-15% reply rate → 2-3 conversations/week.

**Step 3: Community presence (Compounds over time)**

- Post on Indie Hackers: "I'm building an open-source webhook platform. Here's what I learned about [topic]."
- Reply to webhook-related threads on HN, Reddit (r/node, r/SaaS, r/selfhosted), Twitter.
- F5Bot alerts for "webhook", "svix", "hookdeck" mentions.
- 2-4 posts/week on X. Don't self-promote — share technical decisions, pricing research, architecture choices.

**Step 4: Convert to paid (Users 1-10)**

- After 2-3 weeks of free usage, ask: "Would you be willing to pay $49/mo for this?"
- If yes: T-076 must be done (Stripe live mode). Process real payment.
- If no: ask why. This is pricing validation data for T-053.

### 6. Cross-Reference with Open Tickets

| Ticket                                          | Status                        | Recommendation                                                                                                    |
| ----------------------------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **T-076** (Stripe Checkout E2E + Live Mode)     | Open                          | **Do first.** Cannot accept real payments without this. Blocker for converting free users to paid.                |
| **T-077** (Dashboard Polish)                    | Verified with 2 pending items | **Fix the 2 pending items.** LLM signup 500 error and dashboard-after-signup must work for outreach.              |
| **T-052** (Cold Outreach — First 10 Beta Users) | Open, depends on T-046        | **Start immediately** (skip T-046 template prep — just do it). This is the #1 revenue-generating activity.        |
| **T-053** (Pricing Validation Interviews)       | Open, depends on T-052        | **Sequence correctly.** Do after getting 5+ beta users, not before.                                               |
| **T-054** (Collect Beta Metrics & Testimonials) | Open, depends on T-052        | **Do after 2-3 weeks of real usage.** Fills Show HN [PLACEHOLDER] slots.                                          |
| **T-055** (Origin Story Blog Post)              | Open                          | **Write early** — supports outreach emails ("here's the story behind what I built").                              |
| **T-057** (Build-in-Public Cadence)             | Open                          | **Start now.** Costs nothing. Compounds. Seeds Show HN audience.                                                  |
| **T-034** (Show HN Launch)                      | Open, depends on T-058        | **Do last.** Only after T-054 fills real metrics. Target: 4-6 weeks from today.                                   |
| **T-058** (Show HN Readiness Gate)              | Open                          | Checklist ticket — validates all prerequisites before T-034.                                                      |
| **T-046** (Cold Outreach Campaign)              | Open                          | **Merge into T-052.** Don't prep templates separately — just start emailing. Iterate templates based on replies.  |
| **T-044** (Automated Social Media Posting)      | Open                          | **Defer.** Manual posting is fine for first 10 customers. Automation adds complexity without value at this stage. |
| **T-065** (Payment-Gated Abuse Prevention)      | Open                          | **Defer.** Abuse prevention is irrelevant with zero users.                                                        |
| **T-066** (API Key Scoping + Audit Trail)       | Open                          | **Defer.** Nice-to-have, not needed for first 10 customers.                                                       |
| **T-067** (EmitHQ MCP Server)                   | Open                          | **Defer.** Build after having users who would use it.                                                             |

### 7. Recommended Execution Order

```
Week 1: Fix blockers
  - T-076: Stripe live mode (Julian creates live products, Claude updates env vars)
  - T-077: Fix LLM signup 500 error, verify dashboard-after-signup
  - Julian: Identify 3-5 people in personal network who run SaaS with webhooks

Week 2: First outreach
  - Julian: Message 3-5 personal contacts, offer free access + white-glove setup
  - Claude: GitHub code search for @svix/svix users, prepare 20 personalized emails
  - Claude: Set up F5Bot alerts for webhook/svix/hookdeck mentions
  - Start posting on X (Julian's account or EmitHQ account)

Week 3-4: Cold outreach + community
  - Julian: Send 20 personalized cold emails (from Claude's list)
  - Julian: Post on Indie Hackers (build-in-public update)
  - Claude: Write origin story blog post (T-055) — supports outreach
  - White-glove onboarding for anyone who signs up
  - Follow up on cold emails (Day 3, Day 10)

Week 4-5: First payment + metrics
  - Ask engaged beta users: "Would you pay $49/mo?"
  - Process first real payment via Stripe live mode
  - Collect usage metrics (total events, success rate, active endpoints)
  - Ask for testimonials / willingness to comment on Show HN

Week 6: Show HN readiness
  - Fill [PLACEHOLDER] slots in Show HN draft with real numbers
  - T-054: Publish metrics and testimonials
  - T-058: Run readiness gate checklist
  - T-034: Execute Show HN launch
```

## Recommendation

**Do not write blog posts or build features. Start emailing people today.**

The research is clear: every successful bootstrapped dev tool got its first customers through direct, personal outreach — not content, not launches, not features. EmitHQ has a complete product. The bottleneck is not the product; it's that zero humans have been asked to try it.

The critical path is:

1. Fix the two remaining blockers (T-076 Stripe live, T-077 signup flow)
2. Julian messages 5 people he knows personally
3. Claude prepares 20 cold emails to companies using Svix on GitHub
4. Julian sends those emails
5. White-glove the first 3-5 users
6. Get 1 person to pay
7. Then — and only then — Show HN

**Alternatives considered:**

- Show HN immediately → Rejected. Zero metrics = weak launch. Every data point says wait.
- Content-first (blog posts before outreach) → Rejected. Blog posts take 3-6 months to compound via SEO. Direct outreach produces results in 1-2 weeks.
- Feature-first (build more features before seeking users) → Rejected. The product is complete. Building more features is procrastination.
- Paid acquisition → Rejected. $0 budget is correct at this stage. Cold outreach is free and produces higher-quality leads.

## Sources

### Online Research

- [PostHog: How to get the first 10 paying customers](https://posthog.com/blog/first-10-paying-customers)
- [PostHog: How we got our first 1,000 users](https://newsletter.posthog.com/p/how-we-got-our-first-1000-users)
- [Plausible: How we bootstrapped to $500K ARR](https://plausible.io/blog/bootstrapping-saas)
- [Plausible: What we learned on our journey to $10K MRR](https://plausible.io/blog/growing-saas-mrr)
- [Resend: How Zeno Rocha built a 20,000-user platform in 9 months](https://ownerpreneur.com/case-studies/resend-com-how-zeno-rocha-built-a-20000-user-email-platform-in-9-months/)
- [Svix: Twilio Startup Labs Founder Spotlight](https://www.twilio.com/en-us/blog/twilio-startup-labs-founder-spotlight-tom-hacohen-svix)
- [Svix: $10.5M raised — Frontlines interview](https://www.frontlines.io/podcasts/tom-hacohen/)
- [Convoy: YC Launch](https://www.ycombinator.com/launches/H77-convoy-open-source-webhooks-proxy)
- [Cal.com: Building an open-source rocketship in public](https://kp.substack.com/p/how-cal-is-building-an-open-source)
- [Indie Hackers: How I got my first 33 paying customers](https://www.indiehackers.com/post/how-i-got-my-first-33-paying-customers-for-my-saas-513361a1b2)
- [7 Bootstrapped SaaS Success Stories & Playbooks 2025](https://saasoperations.com/bootstrapped-saas-success-stories/)
- [How PostHog Grows — How They Grow](https://www.howtheygrow.co/p/how-posthog-grows-the-power-of-being)

### Project Research (built upon)

- `docs/research/gtm-execution.md` — launch sequencing, sustained acquisition channels
- `docs/research/customer-discovery.md` — buyer personas, verticals, buying triggers
- `docs/research/pricing-model.md` — tier structure, unit economics
- `docs/research/content-distribution-strategy.md` — SEO keywords, Show HN plan
- `docs/research/llm-automatable-onboarding.md` — API-only signup flow

### Knowledge Base

- `~/.claude/knowledge/sales-gtm/research.md` — launch strategy, lead lifecycle, speed-to-lead
- `~/.claude/knowledge/growth-retention/research.md` — churn, free tier design
- `~/.claude/knowledge/marketing-strategy/research.md` — positioning psychology, buyer models
