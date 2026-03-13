# Research: Open-Source Strategy
**Date:** 2026-03-13
**Status:** Complete
**Linked to:** T-005

## Summary

Recommend **AGPL-3.0 for the core engine** with **proprietary cloud features** (the Plausible model). AGPL prevents cloud providers from offering our code as a competing SaaS without contributing back, while still being a true open-source license recognized by OSI. The cloud gates should be: white-label portal, advanced transformations, SSO/SAML, audit logs, and managed infrastructure (uptime, scaling, support). MIT is too permissive for a solo founder (AWS could clone it); BSL/ELv2 aren't truly open-source and limit community trust.

## License Comparison for Webhook SaaS

| License | Type | Can self-host? | Can offer as SaaS? | Community trust | Used by |
|---------|------|---------------|--------------------|-----------------|---------|
| **MIT** | Permissive | Yes | Yes (anyone) | Highest | Svix |
| **Apache 2.0** | Permissive | Yes | Yes (anyone) | High | Outpost (Hookdeck) |
| **AGPL-3.0** | Copyleft | Yes | Yes, but must share modifications | High (OSI-approved) | Plausible, Grafana |
| **BSL 1.1** | Source-available | Yes (non-production) | No (until conversion date) | Medium | MariaDB, CockroachDB, Sentry |
| **ELv2** | Source-available | Yes (internal) | No (never for competing SaaS) | Low-Medium | Convoy, Elastic |

### Why NOT MIT (Svix's approach)

Svix uses MIT, which is maximally permissive. For a VC-backed company with $13M and a16z behind them, this makes sense — they can outspend competitors and the open-source goodwill drives enterprise adoption.

**For a solo bootstrapped founder, MIT is risky:**
- AWS, Cloudflare, or any cloud provider can take the code, host it, and compete directly
- No obligation to contribute improvements back
- You're competing against your own code with zero protection
- Works for Svix because they have VC backing to sustain the race; we don't

### Why NOT BSL/ELv2 (Convoy's approach)

Convoy uses ELv2, which prevents anyone from offering it as a SaaS. Source-available, not open-source.

**Problems:**
- Not OSI-approved — many developers and companies won't use it on principle
- "Source-available" ≠ "open-source" in the developer community's mind
- Limits adoption among companies with strict open-source-only policies
- Convoy's GitHub stars (2,800) lag behind Svix (3,100) despite being older — licensing may be a factor

### Why AGPL-3.0 (Recommended — Plausible's approach)

AGPL is copyleft: anyone can use, modify, and self-host the software, but if they offer it as a network service (SaaS), they must share their modifications under AGPL.

**Advantages for our use case:**
- **True open-source** — OSI-approved, community-trusted
- **SaaS protection** — cloud providers can't clone without contributing back (the copyleft "network use" clause is the key protection)
- **Self-hosting allowed** — companies can self-host for internal use (builds adoption)
- **Proven model** — Plausible ($3.1M ARR), Grafana, Mattermost all use AGPL successfully
- **Community contributions flow back** — modifications must be shared, improving the core

**The AGPL deterrent effect:**
Most companies won't self-host AGPL software because their legal teams flag the copyleft obligations. This naturally drives them to the managed cloud offering. Plausible's experience: the vast majority of their 7,000+ subscribers use cloud, not self-hosted.

## What to Open-Source vs. What to Keep Proprietary

### Open (AGPL-3.0)

| Component | Rationale |
|-----------|-----------|
| **Core delivery engine** | The webhook ingestion, queuing, delivery, retry logic | Trust and transparency — customers can audit reliability |
| **API server** | REST API for event sending, endpoint management | Developer adoption — SDKs wrap this API |
| **Basic dashboard** | Event log, endpoint management, delivery status | Minimum viable self-hosted experience |
| **CLI** | Command-line tool for local development | Developer experience |
| **SDKs** (MIT) | Client libraries in TypeScript, Python, Go | Maximum adoption — SDKs should be MIT regardless of server license |
| **Standard Webhooks support** | Signing, verification | Ecosystem compatibility |
| **Basic retry logic** | Fixed schedule, configurable max attempts | Core value prop must be open |
| **Dead-letter queue** | Failed event storage and replay | Core reliability feature |

### Proprietary (Cloud-Only)

| Feature | Rationale | Tier |
|---------|-----------|------|
| **White-label customer portal** | High-value, complex to build, strong retention driver | Growth+ |
| **JavaScript transformations** | Requires sandboxed execution environment — complex to self-host securely | Growth+ |
| **SSO/SAML** | Enterprise feature, complex to implement, strong upgrade trigger | Scale+ |
| **Audit logs** | Compliance feature, high storage cost | Scale+ |
| **Static IPs** | Infrastructure feature, impossible to self-host equivalently | Scale+ |
| **Advanced analytics** | Event trends, endpoint health scoring, anomaly detection | Growth+ |
| **Team management** | Multi-user with roles and permissions | Starter+ |
| **Managed infrastructure** | Uptime, scaling, backups, monitoring | All paid tiers |
| **Priority support** | SLA-backed response times | Growth+ |
| **Inbound provider verification** | Pre-built verification for 15+ providers (Stripe, GitHub, etc.) | Starter+ |

### SDKs: Always MIT

SDKs (TypeScript, Python, Go, etc.) should be MIT-licensed regardless of the server license. Rationale:
- SDKs are integration code that runs in the customer's application
- AGPL on SDKs would require customers to AGPL their own code — unacceptable
- MIT SDKs maximize adoption and reduce friction
- This is the universal pattern: Svix, Plausible, PostHog all use permissive SDK licenses

## Self-Hosting Cannibalization Strategy

### How Plausible prevents cannibalization

1. **AGPL deters corporate self-hosting** — legal teams flag copyleft obligations
2. **Community Edition has fewer features** — no advanced bot detection, no funnels, no ecommerce revenue metrics
3. **Cloud is just easier** — one-click signup vs. Docker/Kubernetes deployment
4. **Support is cloud-only** — self-hosters rely on community; cloud gets official support
5. **Brand trust** — "Hosted by Plausible" is a trust signal for privacy-conscious users

### Our anti-cannibalization design

1. **AGPL on server** — corporate legal teams will prefer paying $49-349/mo over accepting copyleft risk
2. **Portal, transformations, SSO are cloud-only** — the features that make the product production-ready for B2B SaaS (T-002 persona needs) are proprietary
3. **Free tier is generous** — why self-host when the free tier gives you 100K events with zero ops burden?
4. **Self-hosted = you own reliability** — we position self-hosting as "for teams who want full control" while cloud is "for teams who want guaranteed delivery." The whole point of buying webhook infrastructure is NOT maintaining infrastructure.
5. **Managed-only features that CAN'T be self-hosted** — static IPs, multi-region delivery, managed scaling. These are infrastructure moats.

### Expected distribution (based on Plausible/PostHog patterns)

| Channel | Estimated % of users | Revenue contribution |
|---------|---------------------|---------------------|
| Cloud (paid) | 70-80% | 100% of revenue |
| Cloud (free tier) | 15-25% | $0 (conversion funnel) |
| Self-hosted | 5-10% | $0 (brand/community building) |

## Community Contribution Strategy

### How to attract contributors

1. **Good first issues** — maintain a curated list of beginner-friendly issues
2. **Clear contribution guide** — CONTRIBUTING.md with setup instructions, code style, PR process
3. **Fast PR review** — respond to PRs within 48 hours (AI-assisted review)
4. **Public roadmap** — let the community see what's planned and suggest features
5. **Discord community** — real-time discussion, support, and feature requests

### Contributor License Agreement (CLA)

**Recommended: CLA with dual-licensing rights**
- Contributors grant us the right to use their contributions under AGPL AND our proprietary license
- This allows us to include community contributions in the cloud offering without AGPL complications
- Standard practice for AGPL open-core companies (GitLab, Grafana, Plausible)
- Use a lightweight CLA bot (e.g., CLA Assistant) that contributors sign once via GitHub

### What contributions we want

- Bug fixes to core engine
- New SDK language implementations
- Performance improvements
- Documentation improvements
- Standard Webhooks spec improvements

### What contributions we DON'T want in the OSS repo

- Features that would compete with our paid cloud offering
- Major architectural changes without prior discussion
- Enterprise features (SSO, audit logs, etc.)

## Open-Source Launch Strategy

### Phase 1: Private development (before launch)
- Build the core engine and basic dashboard
- Don't open-source until the product is stable and usable
- Avoids the "vaporware open-source repo" problem

### Phase 2: Open-source launch (coordinated with product launch)
- Release the AGPL-licensed server, CLI, and MIT-licensed SDKs simultaneously
- Write a "Why we chose AGPL" blog post (content for T-006)
- Submit to Hacker News as "Show HN"
- Announce on GitHub, Twitter, Dev.to

### Phase 3: Community building (post-launch)
- Respond to every GitHub issue within 24 hours
- Merge contributor PRs quickly
- Write "How to self-host" documentation
- List on awesome-selfhosted, AlternativeTo, etc.

## Recommendation

**License: AGPL-3.0 (server) + MIT (SDKs)**

This gives us:
- True open-source credibility (OSI-approved)
- SaaS protection against cloud providers (copyleft network clause)
- Self-hosting option that builds community and trust
- Natural cannibalization prevention (AGPL deters corporate self-hosting)
- Community contribution path with CLA for dual-licensing

**The test:** If Svix is MIT and we're AGPL, will developers choose them over us?
**Answer:** Developers choose based on product quality, pricing, and DX — not license. Plausible (AGPL) has 21K GitHub stars vs. competitors with more permissive licenses. Our $49 Starter tier vs. Svix's $490 Pro tier is a far bigger differentiator than license choice.

## Sources

- [AGPL vs MIT for SaaS — Monetizely](https://www.getmonetizely.com/articles/should-you-license-your-open-source-saas-under-agpl-or-mit-a-decision-guide-for-founders)
- [Open Source License Guide 2026 — Dev.to](https://dev.to/juanisidoro/open-source-licenses-which-one-should-you-pick-mit-gpl-apache-agpl-and-more-2026-guide-p90)
- [How Plausible built a $1M ARR open source SaaS](https://plausible.io/blog/open-source-saas)
- [Plausible Community Edition](https://plausible.io/blog/community-edition)
- [PostHog open source vs paid](https://posthog.com/questions/open-source-vs-paid)
- [How PostHog monetizes open source](https://posthog.com/blog/open-source-business-models)
- [Svix open source strategy](https://www.svix.com/open-source-webhook-service/)
- [Moving away from open source — Goodwin Law](https://www.goodwinlaw.com/en/insights/publications/2024/09/insights-practices-moving-away-from-open-source-trends-in-licensing)
- T-001: `docs/research/competitive-landscape.md` (Svix MIT, Convoy ELv2, Outpost Apache)
