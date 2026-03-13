# Research: Legal & Business Structure
**Date:** 2026-03-13
**Status:** Complete
**Linked to:** T-004

## Summary

For a bootstrapped solo-dev SaaS targeting $1M ARR, a **Nevada LLC** is the recommended starting entity — simplest formation, pass-through taxation, no state income tax, and convertible to C-Corp if/when VC becomes relevant. Webhook infrastructure has specific liability considerations around lost/delayed events; industry-standard ToS caps liability at 12 months of fees paid. DPA is mandatory for EU customers under GDPR Article 28.

## Entity Type: Nevada LLC (Recommended)

### Why LLC over C-Corp for bootstrapped SaaS

**LLC advantages:**
- **Pass-through taxation** — profits taxed once on personal return, not double-taxed (corporate + personal)
- **Simplicity** — no board of directors, no annual shareholder meetings, no stock certificates
- **Flexibility** — operating agreement is fully customizable
- **Lower formation and maintenance costs** — $425 formation, $350/year ongoing vs. Delaware C-Corp ($90 formation + $400+ franchise tax + registered agent)
- **Single-member LLC** — treated as disregarded entity for tax purposes (simplest filing)

**When to convert to C-Corp:**
- If raising institutional VC (VCs require C-Corp for preferred stock)
- If issuing employee stock options (LLCs can't do ISOs)
- If planning acquisition by a public company

**For this project:** Start as LLC. Revenue-first, no VC planned. Convert later if needed — conversion is straightforward and common.

### Why Nevada (home state) over Delaware

**For a bootstrapped solo-dev SaaS, Nevada wins:**
- No state income tax (personal or corporate)
- No franchise tax (Delaware charges $400+ minimum annually)
- No need for a registered agent in a second state
- No foreign qualification fees (would need to register in NV anyway if incorporated in DE)
- Privacy protections (no public disclosure of member names)
- Commerce Tax only applies at $4M+ gross revenue — irrelevant until well past $1M ARR

**Delaware is better if:** Raising VC (investors expect Delaware C-Corp), planning IPO, or need Delaware Chancery Court for corporate disputes. None of these apply here.

### Formation Costs

| Item | Cost | Frequency |
|------|------|-----------|
| Articles of Organization | $75 | One-time |
| Initial List of Managers | $150 | One-time |
| State Business License | $200 | One-time |
| **Total Formation** | **$425** | **One-time** |
| Annual List Renewal | $150 | Annual |
| Business License Renewal | $200 | Annual |
| **Total Annual** | **$350** | **Annual** |

## Terms of Service — Key Clauses for Webhook Infrastructure

### Liability Limitation (Industry Standard — Based on Svix ToS)

**Cap:** Total aggregate liability limited to **amounts paid in the 12 months prior** to the event giving rise to liability.

**Excluded claims (uncapped or higher cap):**
- Breach of confidentiality obligations
- Indemnification obligations (typically capped at 3x annual fees)
- Gross negligence or willful misconduct

**Consequential damages waiver:** Neither party liable for lost profits, lost data, business interruption, or indirect/consequential damages. This is critical for webhook infrastructure — if a customer loses revenue because a webhook was delayed, the ToS must disclaim liability for that downstream impact.

### Key ToS Sections for Webhook SaaS

1. **Service Description** — Define what "webhook delivery" means, including delivery guarantees (at-least-once, not exactly-once), retry policies, and what constitutes "delivery" (2xx HTTP response from endpoint)
2. **SLA** — Uptime commitment (99.9% standard, 99.99% premium). Define measurement period (monthly), excluded downtime (maintenance windows, force majeure), and remedy (service credits, not refunds)
3. **Service Credits** — Industry standard: 10% credit for <99.9%, 25% for <99.0%, capped at 30% of monthly fees
4. **Acceptable Use** — Prohibit using the service for spam, DDoS, illegal content, exceeding rate limits
5. **Data Handling** — Clarify that webhook payloads transit through our infrastructure but we don't inspect, store long-term, or use payload content. Retention period for delivery logs.
6. **Customer Responsibilities** — Customer must maintain endpoint availability, implement signature verification, handle idempotency
7. **Termination** — Either party can terminate with 30 days notice. Data export/deletion within 30 days of termination.
8. **IP Ownership** — We own the service. Customer owns their data (event payloads, endpoint configurations).

### Liability Analysis — Lost/Delayed Webhooks

**Can a customer sue if a missed webhook caused financial damage?**
- Theoretically yes, but practically limited by:
  - Liability cap in ToS (12 months fees)
  - Consequential damages waiver (lost profits disclaimed)
  - "As is" warranty disclaimer
  - Shared responsibility model (customer must maintain endpoint availability)
- **Industry precedent:** Svix, Hookdeck, and all major webhook platforms use identical limitation language. No known successful lawsuits for webhook delivery failure.
- **Risk mitigation:** Design the product with replay capability, dead-letter queues, and delivery attempt logging — these provide an audit trail showing the platform attempted delivery.

**Insurance considerations:**
- **E&O (Errors & Omissions):** Covers claims that your service failed to perform as promised. Recommended once revenue exceeds $50K ARR. ~$500-2,000/year for small SaaS.
- **Cyber Liability:** Covers data breach costs. Recommended if handling sensitive webhook payloads. ~$500-1,500/year.
- **Not needed at launch** — address when revenue is material.

## Privacy Policy Requirements

### Data We Collect

| Category | Data | Legal Basis (GDPR) |
|----------|------|-------------------|
| Account data | Name, email, company, password hash | Contract performance |
| Billing data | Payment method (via Stripe — we don't store card numbers) | Contract performance |
| API keys | Hashed keys for authentication | Contract performance |
| Webhook payloads | Event data transiting through our system | Legitimate interest / contract |
| Delivery metadata | Timestamps, status codes, response times, endpoint URLs | Legitimate interest |
| Usage data | Event counts, API calls, dashboard interactions | Legitimate interest |
| Analytics | Page views, feature usage (via Plausible/PostHog) | Legitimate interest |

### GDPR Requirements (for EU customers)
- **DPA is mandatory** under Article 28 if we process personal data on behalf of customers
- Webhook payloads MAY contain personal data (e.g., customer emails in Stripe webhook payloads) — we are a data processor
- Must document: lawful basis, data retention periods, subprocessors (Cloudflare, Neon, Railway, Stripe), data subject rights
- Must support: right to access, right to deletion, right to data portability
- Breach notification: 72 hours to controller (our customer), who then notifies their users

### DPA Key Clauses (Required by GDPR Article 28)
1. Process data only on documented controller instructions
2. Ensure confidentiality of personnel processing data
3. Implement appropriate security measures (encryption in transit + at rest)
4. Obtain controller approval before engaging subprocessors
5. Assist controller with data subject rights requests
6. Notify controller of data breaches without undue delay
7. Delete or return data upon contract termination
8. Make available all information necessary to demonstrate compliance

### CCPA/CPRA Requirements (California customers)
- Disclose categories of personal information collected
- Right to know, delete, correct, and opt-out of sale/sharing
- "Do Not Sell or Share" link if applicable
- CCPA applies to businesses with >$25M revenue, >50K consumers' data, or >50% revenue from selling data — may not apply at launch but plan for it

### Subprocessors to Declare
| Service | Purpose | Data Accessed |
|---------|---------|---------------|
| Cloudflare | CDN, edge delivery | Request metadata, webhook payloads in transit |
| Neon (PostgreSQL) | Database | All stored data |
| Railway/Fly.io | App hosting | All processed data |
| Upstash (Redis) | Queue/cache | Webhook payloads in transit |
| Stripe | Billing | Customer billing data |
| Clerk | Authentication | User account data |
| Plausible/PostHog | Analytics | Usage analytics (anonymized) |

## Accounts & Registrations — Julian Action Items

### Formation (Do First)
- [ ] Form Nevada LLC via Nevada Secretary of State ($425) or use Stripe Atlas ($500, includes EIN + bank account)
- [ ] Obtain EIN from IRS (free, online at irs.gov — instant with SSN)
- [ ] Open business bank account (Mercury or Brex recommended — free, startup-friendly)
- [ ] Create Stripe account for payment processing

### Product Infrastructure
- [ ] Register domain name (after T-009 brand decision)
- [ ] Create GitHub organization
- [ ] Create npm organization
- [ ] Set up Cloudflare account
- [ ] Set up Railway or Fly.io account
- [ ] Set up Neon (PostgreSQL) account
- [ ] Set up Upstash (Redis) account
- [ ] Set up Clerk account (auth)

### Legal Documents (Generate in T-021)
- [ ] Terms of Service
- [ ] Privacy Policy
- [ ] Data Processing Agreement (DPA) template
- [ ] Acceptable Use Policy
- [ ] SLA document

### Optional / Later
- [ ] E&O insurance (when revenue > $50K ARR)
- [ ] Cyber liability insurance (when handling sensitive payloads at scale)
- [ ] Trademark registration (when brand is established)
- [ ] CCPA compliance (when approaching thresholds)

## Recommendation

**Start simple:**
1. Nevada LLC ($425 one-time, $350/year)
2. EIN + Mercury bank account (free)
3. Stripe for billing (no upfront cost)
4. Generate ToS/Privacy/DPA from templates, then customize for webhook-specific clauses
5. Add insurance and compliance layers as revenue grows

**Don't over-invest in legal at launch.** The ToS liability cap and consequential damages waiver are the critical protections. Everything else can be iteratively improved as the business scales.

## Sources

- [LLC vs C-Corp for Bootstrapped Startups — StartSmart Counsel](https://www.startsmartcounsel.com/resource-center/llc-vs-c-corp-for-bootstrapped-startups-whats-best-when-youre-not-raising-vc)
- [LLC vs C-Corp for SaaS Startups — TechX Strategies](https://www.techxstrategies.com/post/llc-or-c-corp-choosing-the-right-u-s-structure-for-saas-startups)
- [Nevada LLC Costs 2026 — BoostSuite](https://boostsuite.com/how-to-start-an-llc/cost/nevada/)
- [Svix Terms of Service](https://www.svix.com/legal/tos/)
- [SaaS Agreements: Key Provisions — ABA](https://www.americanbar.org/groups/business_law/resources/business-law-today/2021-november/saas-agreements-key-contractual-provisions/)
- [Limitation of Liability for SaaS — TermsFeed](https://www.termsfeed.com/blog/saas-limitation-liability/)
- [DPA Guide for SaaS — SecurePrivacy](https://secureprivacy.ai/blog/data-processing-agreements-dpas-for-saas)
- [SaaS Privacy Compliance 2025 — SecurePrivacy](https://secureprivacy.ai/blog/saas-privacy-compliance-requirements-2025-guide)
- [Stripe Atlas](https://stripe.com/atlas)
- [Startup Business Checklist — Stripe](https://stripe.com/resources/more/checklist-for-business-startups-what-founding-teams-need-to-do-first)
