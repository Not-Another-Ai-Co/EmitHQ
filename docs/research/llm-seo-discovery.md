# Research: LLM & SEO Discovery Optimization

**Date:** 2026-03-21
**Status:** Draft — pending review
**Linked to:** T-096

## Summary

EmitHQ has solid machine-readable foundations (llm.txt, agents.json, OpenAPI spec) but significant gaps in traditional SEO signals, structured data markup, AI bot management, and third-party presence. LLMs decide which products to recommend based on entity authority (mentions across trusted sources), structured data clarity, content depth/freshness, and third-party validation (G2, Crunchbase, AlternativeTo). EmitHQ currently has zero presence on these platforms. The biggest wins are: (1) adding JSON-LD schema markup, (2) differentiated robots.txt for AI bots, (3) llms-full.txt with complete docs, (4) third-party directory listings, and (5) content that builds entity authority.

## Current State

### What EmitHQ Has (Good)

- **llm.txt** at `/llm.txt` — well-structured, includes quick start, API key management, error codes, retry strategy, pricing, SDK install. Follows the spirit of the llms.txt spec.
- **agents.json** at `/.well-known/agents.json` — capability manifest with auth, endpoints, SDK, pricing. Good for agent discovery.
- **OpenAPI spec** at `/openapi.json` — 23 public paths, CI drift check exists.
- **Meta tags** — title, description, keywords, OpenGraph, Twitter card on root layout. Per-page metadata on docs, compare, pricing pages.
- **Sitemap** — 13 URLs with priority weighting (homepage 1.0, core pages 0.8-0.9, legal 0.2-0.3).
- **Umami analytics** — self-hosted, ad-blocker resistant (renamed script + Vercel proxy).
- **Comparison pages** — `/compare/svix`, `/compare/hookdeck`, `/compare/build-vs-buy` — bottom-of-funnel SEO pages.
- **Static export** — Next.js static export means all content is server-rendered HTML, fully crawlable by AI bots without JavaScript execution.

### What EmitHQ Is Missing (Gaps)

1. **No JSON-LD structured data** — Zero schema markup on any page. No Organization, SoftwareApplication, FAQPage, or Article schemas. This is the single highest-impact gap for both Google rich results and LLM content parsing.

2. **No AI bot differentiation in robots.txt** — Current `robots.txt` is a blanket `Allow: /` for all user agents. No distinction between training bots (GPTBot, ClaudeBot — should block) and retrieval/search bots (ChatGPT-User, Claude-SearchBot, PerplexityBot — should allow). The knowledge base has a complete template that hasn't been applied.

3. **No llms-full.txt** — EmitHQ has `llm.txt` (navigation/summary) but not `llms-full.txt` (complete documentation content). LLMs access `llms-full.txt` even more frequently than `llms.txt` according to usage data from platforms that track both. The full-text version allows LLMs to answer detailed questions about EmitHQ without needing to crawl individual pages.

4. **No third-party presence** — EmitHQ is not listed on G2, Capterra, Crunchbase, AlternativeTo, SaaSHub, StackShare, Product Hunt, or awesome-selfhosted. These platforms are heavily weighted by LLMs when making product recommendations. Svix has Crunchbase and G2 profiles. Hookdeck has G2 reviews and PitchBook.

5. **No Google Search Console** — No verification, no indexing requests, no search performance data.

6. **No blog/content** — No `/blog` route exists. The content calendar from T-006 research has 15 planned posts but none published. Blog content is the primary vehicle for building topical authority, earning backlinks, and creating citable content for LLMs.

7. **Missing canonical URLs** — No `<link rel="canonical">` tags on pages.

8. **No llms.txt at spec path** — EmitHQ's file is at `/llm.txt` (singular). The spec defines the path as `/llms.txt` (plural). Both should exist, but the spec path should be canonical.

## Findings

### How LLMs Decide Which Products to Recommend

LLMs use Retrieval-Augmented Generation (RAG) during inference. They don't read product pages like humans — they break content into vector embeddings and match against query semantics. The key ranking signals:

1. **Entity authority** — mentions across diverse, trusted sources (Wikipedia, Crunchbase, G2, technical blogs, GitHub discussions, Stack Overflow). LLMs build "entity confidence scores" from corroborative mentions. A minimum of 15 high-authority external mentions per quarter is recommended.

2. **Structured data** — JSON-LD schema markup gives LLMs explicit entity definitions (what the product is, what it costs, what category it belongs to). GPT-4's accuracy improves from 16% to 54% with structured content.

3. **Content depth and freshness** — Content under 3 months old gets 30-40% more AI citations. LLMs favor content with statistics, cited sources, named frameworks, and clear entity definitions.

4. **Backlinks and mentions** — In the LLM era, text mentions matter even without links. LLMs extract entities from text, not just hyperlinks. Being mentioned in "best X" listicles, comparison articles, and review sites directly influences recommendations. 43.8% of ChatGPT-cited pages are "Best X" listicles.

5. **Third-party validation** — G2, Capterra, TrustRadius profiles are heavily weighted. Crunchbase is the default reference for company information. AlternativeTo drives comparison-shopping discovery.

### The 12 Core LLM Ranking Factors (2026)

Roughly 80% of LLM visibility comes from classic SEO. The remaining 20% is LLM-specific:

1. Structured data (JSON-LD)
2. Direct answer presence (answer-first format)
3. Heading hierarchy (H1 > H2 > H3 structure)
4. Entity clarity (unambiguous product/company definitions)
5. Content freshness (< 3 months ideal)
6. Topical authority (depth of coverage on a topic cluster)
7. Table and list usage (LLMs extract structured formats preferentially)
8. FAQ sections (directly citable Q&A pairs)
9. Internal link density (descriptive anchor text)
10. Meta description quality (150-160 chars, unique per page)
11. Domain authority (backlink profile)
12. Content depth (comprehensive treatment > thin pages)

### Structured Data: What to Implement

**Organization schema** (homepage):

- Name, URL, logo, legal name (NotAnotherAiCo LLC), address, sameAs links (GitHub, npm)
- This establishes the entity in Google's Knowledge Graph and LLM entity databases

**SoftwareApplication/WebApplication schema** (homepage + pricing):

- applicationCategory: "DeveloperApplication"
- operatingSystem: "Web"
- AggregateOffer with lowPrice: 0 (free tier), highPrice: 349 (Scale tier)
- Per-tier Offer objects with names and prices

**FAQPage schema** (pricing page FAQ section):

- Question/Answer pairs for common queries ("What happens when I exceed my event limit?", "Do retries count against my quota?", etc.)
- FAQPage schemas are directly citable by AI and can trigger rich results in Google

**Article/BlogPosting schema** (future blog posts):

- Author, datePublished, dateModified, headline, description
- Critical for E-E-A-T signals and AI citation

### robots.txt: AI Bot Differentiation

The current blanket `Allow: /` wastes crawl budget on training bots that won't drive discovery. The knowledge base already has the template. Implementation should:

- **Allow** retrieval/search bots: ChatGPT-User, OAI-SearchBot, Claude-SearchBot, Claude-User, PerplexityBot, Applebot-Extended
- **Block** training bots: GPTBot, ClaudeBot, Google-Extended, CCBot, Bytespider
- Keep the default `Allow: /` for Googlebot and other search engine bots
- Note: ChatGPT-User and Perplexity-User may not fully honor robots.txt, but having the directives is still best practice

### llms.txt Spec Compliance

EmitHQ's current `/llm.txt` is good content but needs adjustments:

1. **Rename/copy to `/llms.txt`** — the spec path is plural. Keep `/llm.txt` as a redirect or duplicate for backward compatibility.
2. **Add `/llms-full.txt`** — complete documentation content in a single Markdown file. Include: product overview, full API reference, SDK guide, pricing details, error codes, retry strategy, comparison with alternatives. This is what LLMs access most frequently.
3. **Follow spec structure** — H1 with project name, blockquote summary, then sections. The current file is close but doesn't use the blockquote format.

### Competitor Discoverability Audit

**Svix:**

- Crunchbase profile (founded 2021, NYC, funding data)
- G2 presence (enterprise category)
- docs.svix.com with comprehensive API docs
- Active blog (svix.com/blog)
- GitHub: 2.5K+ stars on svix-webhooks
- Listed on CBInsights, multiple "alternatives" pages
- Standard Webhooks spec creator (gives them authority positioning)
- Heavy content marketing: technical blogs, open-source positioning

**Hookdeck:**

- G2 reviews (active, multiple reviews)
- PitchBook/Crunchbase profiles
- Extensive content: "Webhooks Platform Guides" hub page, "Webhooks at Scale" guide
- Stripe partnership (co-authored content on Stripe Developer Blog)
- Blog with monthly product updates
- Track AI agent traffic to docs (sophisticated — they're monitoring LLM access)
- 100B+ webhooks processed (social proof metric)

**Convoy:**

- GitHub: MIT licensed, PostgreSQL-based
- Less commercial SEO presence than Svix/Hookdeck
- Open-source community-driven

**EmitHQ gaps vs competitors:**

- No Crunchbase, G2, or directory listings
- No blog content published
- No partnership/co-marketing content
- No "webhooks processed" metric to cite (zero customers)
- GitHub stars are likely low (new repo)

### Third-Party Listing Priority

Based on LLM weighting and effort-to-impact ratio:

| Priority | Platform           | Why                                                                 | Effort                              |
| -------- | ------------------ | ------------------------------------------------------------------- | ----------------------------------- |
| 1        | AlternativeTo      | Listed as alternative to Svix/Hookdeck; drives comparison discovery | Low (free, 1-2 day approval)        |
| 2        | G2                 | Heavily cited by LLMs; free profile creation                        | Low (free listing, needs 1+ review) |
| 3        | Crunchbase         | Default company reference for LLMs; entity establishment            | Low (free basic profile)            |
| 4        | SaaSHub            | Svix alternatives already listed there                              | Low (free)                          |
| 5        | Product Hunt       | Developer audience; launches get indexed by LLMs                    | Medium (timing-dependent)           |
| 6        | awesome-selfhosted | GitHub list; backlink + discovery for open-source                   | Low (PR to existing repo)           |
| 7        | StackShare         | Developer tool stacks; API integration context                      | Low (free)                          |
| 8        | Capterra           | Enterprise discovery; Google Ads integration                        | Low (free listing)                  |

### Google Search Console

Must be configured immediately. It provides:

- Indexing status (are pages actually in Google's index?)
- Search performance data (what queries lead to EmitHQ?)
- Structured data validation (are schemas error-free?)
- Core Web Vitals monitoring
- Manual action notifications

Verification method: DNS TXT record via Cloudflare (EmitHQ already manages DNS there).

## Recommendation

Implement in three phases, ordered by impact-to-effort ratio:

### Phase 1: Technical Foundation (1 ticket, low effort)

1. **JSON-LD schema markup** on homepage (Organization + SoftwareApplication), pricing page (SoftwareApplication with Offers + FAQPage), and compare pages (FAQPage where applicable).
2. **robots.txt AI bot differentiation** — apply the knowledge base template to `packages/landing/src/app/robots.ts`.
3. **Canonical URLs** — add `metadataBase` to root layout and ensure `alternates.canonical` is set per page.
4. **/llms.txt** (plural) — copy/redirect from current `/llm.txt`.
5. **/llms-full.txt** — auto-generated from docs content at build time.
6. **Google Search Console** — DNS verification via Cloudflare.

### Phase 2: Third-Party Presence (1 ticket, medium effort, partially manual)

1. Create profiles on AlternativeTo, G2, Crunchbase, SaaSHub, StackShare, Capterra.
2. Submit to awesome-selfhosted GitHub list.
3. Julian manually claims/verifies profiles where needed.
4. Each listing should use consistent messaging: "Open-source webhook infrastructure for SaaS teams. $49/mo — not $490."

### Phase 3: Content Authority (covered by T-091, T-092, T-093)

1. Origin story blog post (T-091) — establishes entity narrative for LLMs.
2. Technical deep-dive (T-092) — builds topical authority on webhook delivery.
3. Community presence (T-093) — creates the distributed mentions LLMs need for entity confidence.
4. Future: hub-and-spoke content architecture around "webhook infrastructure" as the pillar topic.

### Alternatives Considered

- **Paid SEO tools (Ahrefs, Semrush)** — premature at zero customers. Google Search Console + free tier tools are sufficient for now.
- **AI visibility monitoring (Otterly AI, Peec AI)** — $29-489/mo. Worth it after establishing baseline presence, not before.
- **Wikipedia page** — requires notability criteria (press coverage, third-party sources). Not achievable at current stage. Revisit after Show HN and press coverage.
- **Schema Pro/Yoast equivalent for Next.js** — unnecessary. JSON-LD can be added directly in layout/page components with zero dependencies.

## Sources

- [How LLMs Decide What Product and Content to Recommend](https://prerender.io/blog/llm-product-discovery/)
- [How LLMs Decide Which Brands to Recommend — GeoVector](https://www.geovector.ai/articles/how-llms-decide-which-brands-to-recommend)
- [LLM Ranking Factors: AI Optimization Guide (2026 Update)](https://brandonleuangpaseuth.com/blog/llm-ranking-factors/)
- [The 12 Signals That Determine AI Visibility — Rankio](https://www.rankio.studio/learn/llm-ranking-factors/)
- [The /llms.txt file spec — llmstxt.org](https://llmstxt.org/)
- [The State of llms.txt in 2026 — AEO Press](https://www.aeo.press/ai/the-state-of-llms-txt-in-2026)
- [Do You Need Both llms.txt and llms-full.txt?](https://llms-txt.io/blog/llms-txt-and-llms-full-txt)
- [Structured data: SEO and GEO optimization for AI in 2026 — Digidop](https://www.digidop.com/blog/structured-data-secret-weapon-seo)
- [Schema & NLP Best Practices for AI Search Visibility — Wellows](https://wellows.com/blog/schema-and-nlp-best-practices-for-ai-search/)
- [Best Schema Types for LLM Visibility in 2026 — Mean CEO](https://blog.mean.ceo/startup-news-best-schema-types-hidden-tips-llm-visibility-2026/)
- [SoftwareApplication Schema — schema.org](https://schema.org/SoftwareApplication)
- [How to describe a SaaS product with schema markup](https://www.danielkcheung.com/how-to-describe-saas-product-with-schema/)
- [Anthropic's Claude Bots Make Robots.txt Decisions More Granular — SEJ](https://www.searchenginejournal.com/anthropics-claude-bots-make-robots-txt-decisions-more-granular/568253/)
- [GPTBot vs ClaudeBot vs PerplexityBot — DataPrixa](https://dataprixa.com/gptbot-vs-claudebot-vs-perplexitybot/)
- [Best Practices: Optimize Crunchbase and G2 for AI Search Visibility — Geneo](https://geneo.app/blog/optimize-crunchbase-g2-directories-for-ai-search/)
- [Does G2 Get Ranked in AI LLM Search? — G2](https://learn.g2.com/tech-signals-does-g2-get-ranked-in-ai-llm-search)
- [40+ Best SaaS Directories to Submit Your Product in 2026 — SaaSConsult](https://saasconsult.co/blog/top-directories-to-list-your-saas/)
- [AI Visibility for B2B SaaS — Metricus](https://metricusapp.com/blog/ai-visibility-b2b-saas/)
- [LLM SEO: The Ultimate Guide — Marketer Milk](https://www.marketermilk.com/blog/llm-seo)
- [FAQPage Structured Data — Google Search Central](https://developers.google.com/search/docs/appearance/structured-data/faqpage)
- [Software App Structured Data — Google Search Central](https://developers.google.com/search/docs/appearance/structured-data/software-app)
- Existing KB: `~/.claude/knowledge/seo-llm-visibility/research.md`
- Existing KB: `~/.claude/knowledge/content-outlier-analysis/research.md`
- Existing research: `docs/research/content-distribution-strategy.md`

## Replicable Playbook: LLM Discoverability for New Products

_This section documents the process used for EmitHQ so it can be replicated for any new product launch._

### Phase 1: Diagnose (day 1)

1. **Real-world test:** Have someone ask ChatGPT/Claude/Perplexity "should I use [product]?" and "best [category] for [use case]?" Save the full response.
2. **Identify trust gaps:** LLMs will explicitly name what's missing — stars, reviews, track record, SLA, etc. These are the gaps to close.
3. **Audit current signals:** Check JSON-LD, robots.txt, llms.txt, sitemap, meta tags, directory presence, backlinks.
4. **Competitor audit:** What do competitors have that you don't? (G2 profile, Crunchbase, blog content, GitHub stars, partnership content)

### Phase 2: Technical Foundation (before any marketing)

1. **JSON-LD structured data** — Organization, SoftwareApplication, FAQPage schemas. Single highest-impact change for LLM content parsing. GPT-4 accuracy: 16% → 54%.
2. **robots.txt AI bot differentiation** — Block training bots (GPTBot, ClaudeBot), allow retrieval bots (ChatGPT-User, PerplexityBot). Don't give away training data without getting discovery in return.
3. **llms.txt + llms-full.txt** — Machine-readable product summary + complete docs. Plural form is the spec path.
4. **Canonical URLs** — Prevent duplicate content signals.
5. **Google Search Console** — Baseline indexing data. Submit sitemap.
6. **SPF/DKIM/DMARC** — Email authentication before any outreach. SPF must include your sending provider.

### Phase 3: Third-Party Presence (parallel with outreach)

1. **Directory listings** — AlternativeTo, G2, Crunchbase, SaaSHub, StackShare, awesome-selfhosted. Consistent messaging across all. LLMs build entity confidence from corroborative mentions across 15+ sources.
2. **npm/PyPI README quality** — LLMs read package READMEs. Keep them compelling and current (auto-publish on version bump).
3. **Community profiles** — Dev.to, Indie Hackers. Build-in-public posts create indexed content.

### Phase 4: Content Authority (parallel with outreach)

1. **Origin story** — Why you built it, what gap you fill. Establishes entity narrative.
2. **Technical deep-dive** — Architecture decisions, reliability patterns. Builds topical authority.
3. **Comparison content** — vs-competitor pages. Bottom-of-funnel SEO + LLM citation bait.

### Phase 5: Social Proof (after first users)

1. **Collect metrics** — Real numbers replace placeholders.
2. **Testimonials** — Even 1-2 quotes dramatically change LLM recommendations.
3. **Show HN / Product Hunt** — Stagger launches. HN first (developers), PH second (SaaS buyers). Both create high-authority backlinks + indexed discussion threads.

### Key Insight

LLM recommendations are 80% classic SEO (backlinks, structured data, content depth) + 20% LLM-specific (llms.txt, entity clarity, FAQ schemas). Don't over-index on the LLM-specific 20% at the expense of fundamentals. The single biggest lever is third-party mentions — LLMs trust corroborative signals across sources more than anything on your own domain.
