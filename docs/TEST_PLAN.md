> Last verified: 2026-03-20

# Test Plan

Testing archetypes applicable to EmitHQ. Checked = applies to this project. Covered = has test coverage.

## Archetypes

| #   | Archetype                                                 | Applies | Covered | Notes                                                                  |
| --- | --------------------------------------------------------- | ------- | ------- | ---------------------------------------------------------------------- |
| 1   | Auth flows (login, logout, session expiry)                | [x]     | [x]     | Clerk auth — `browser-journey` + `account-management` E2E suites       |
| 2   | CRUD operations (apps, endpoints, messages)               | [x]     | [x]     | `browser-journey` E2E (create app, endpoint, send msg) + `api-journey` |
| 3   | Form validation (required fields, format, error messages) | [x]     | [ ]     | Dashboard forms — not yet covered                                      |
| 4   | Error states (404, 500, network failure, empty states)    | [x]     | [ ]     | Dashboard error boundaries exist but untested                          |
| 5   | Permission boundaries (RLS tenant isolation)              | [x]     | [x]     | 14 unit tests for quota enforcement + RLS on every query               |
| 6   | Responsive layouts (desktop, tablet, mobile)              | [x]     | [ ]     | Dashboard is responsive but untested                                   |
| 7   | Accessibility (keyboard nav, screen reader, contrast)     | [x]     | [ ]     | Not yet covered                                                        |
| 8   | Navigation & routing (deep links, back button)            | [x]     | [ ]     | Dashboard routing untested                                             |
| 9   | Loading & skeleton states (spinners, no layout shift)     | [x]     | [ ]     | Dashboard has loading states but untested                              |
| 10  | State persistence (filters in URL, form data)             | [ ]     | [ ]     | Not applicable yet — minimal state                                     |
| 11  | File upload/download                                      | [ ]     | [ ]     | Not applicable                                                         |
| 12  | Real-time updates (WebSocket, polling)                    | [ ]     | [ ]     | Not implemented yet                                                    |
| 13  | Search & filtering (message list, delivery attempts)      | [x]     | [ ]     | Dashboard has filtering but untested                                   |
| 14  | Performance budgets (LCP < 2.5s, CLS < 0.1)               | [x]     | [ ]     | Landing + dashboard — not measured                                     |
| 15  | Security surface (XSS, CSRF, SSRF, timing-safe compare)   | [x]     | [x]     | Signing uses timingSafeEqual, SSRF validation on endpoints             |
| 16  | Third-party integrations (Stripe, Clerk, Resend)          | [x]     | [x]     | Stripe billing E2E verified (T-076), Clerk auth in E2E                 |
| 17  | Data integrity (idempotency, soft-delete, concurrent)     | [x]     | [x]     | UNIQUE(app_id, event_id) dedup, Stripe webhook idempotency             |
| 18  | Notifications & feedback (toasts, confirmation dialogs)   | [x]     | [ ]     | Dashboard has toasts but untested                                      |
| 19  | Multi-tab/session (login propagation, stale session)      | [ ]     | [ ]     | Clerk handles — low priority                                           |
| 20  | Internationalization (date/currency formats)              | [ ]     | [ ]     | Not applicable — US-only for now                                       |

## Browser Test Accounts

| Role           | Username      | Credential Source                                   | Notes                                            |
| -------------- | ------------- | --------------------------------------------------- | ------------------------------------------------ |
| SaaS Developer | E2E test user | op://EmitHQ/e2e/username + op://EmitHQ/e2e/password | Clerk dev instance, `@clerk/testing` auth bypass |

## Existing E2E Suites

| Suite              | Location                                            | What it covers                                                             |
| ------------------ | --------------------------------------------------- | -------------------------------------------------------------------------- |
| browser-journey    | `packages/dashboard/e2e/browser-journey.spec.ts`    | 8-step UI flow: login → create app → endpoint → send msg → verify delivery |
| api-journey        | `packages/dashboard/e2e/api-journey.spec.ts`        | LLM-automatable API signup + full CRUD via REST                            |
| account-management | `packages/dashboard/e2e/account-management.spec.ts` | Profile, billing smoke tests                                               |
