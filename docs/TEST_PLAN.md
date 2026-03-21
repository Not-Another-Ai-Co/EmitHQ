> Last verified: 2026-03-20

# Test Plan

Testing archetypes applicable to EmitHQ. Checked = applies to this project. Covered = has test coverage.

## Archetypes

| #   | Archetype                                                 | Applies | Covered | Notes                                                                          |
| --- | --------------------------------------------------------- | ------- | ------- | ------------------------------------------------------------------------------ |
| 1   | Auth flows (login, logout, session expiry)                | [x]     | [x]     | Clerk auth — E2E suites + T-097 Playwright MCP (OTP + org setup flow verified) |
| 2   | CRUD operations (apps, endpoints, messages)               | [x]     | [x]     | `browser-journey` E2E (create app, endpoint, send msg) + `api-journey`         |
| 3   | Form validation (required fields, format, error messages) | [x]     | [ ]     | Dashboard forms — not yet covered                                              |
| 4   | Error states (404, 500, network failure, empty states)    | [x]     | [ ]     | Dashboard error boundaries exist but untested                                  |
| 5   | Permission boundaries (RLS tenant isolation)              | [x]     | [x]     | 14 unit tests for quota enforcement + RLS on every query                       |
| 6   | Responsive layouts (desktop, tablet, mobile)              | [x]     | [ ]     | Dashboard is responsive but untested                                           |
| 7   | Accessibility (keyboard nav, screen reader, contrast)     | [x]     | [ ]     | Not yet covered                                                                |
| 8   | Navigation & routing (deep links, back button)            | [x]     | [x]     | T-097: Playwright MCP verified 5 pages — home, settings (3 tabs), app overview |
| 9   | Loading & skeleton states (spinners, no layout shift)     | [x]     | [ ]     | Dashboard has loading states but untested                                      |
| 10  | State persistence (filters in URL, form data)             | [ ]     | [ ]     | Not applicable yet — minimal state                                             |
| 11  | File upload/download                                      | [ ]     | [ ]     | Not applicable                                                                 |
| 12  | Real-time updates (WebSocket, polling)                    | [ ]     | [ ]     | Not implemented yet                                                            |
| 13  | Search & filtering (message list, delivery attempts)      | [x]     | [ ]     | Dashboard has filtering but untested                                           |
| 14  | Performance budgets (LCP < 2.5s, CLS < 0.1)               | [x]     | [ ]     | T-099: landing 4 pages verified (no errors), LCP not measured (no Lighthouse)  |
| 15  | Security surface (XSS, CSRF, SSRF, timing-safe compare)   | [x]     | [x]     | Signing uses timingSafeEqual, SSRF validation on endpoints                     |
| 16  | Third-party integrations (Stripe, Clerk, Resend)          | [x]     | [x]     | Stripe billing E2E verified (T-076), Clerk auth in E2E                         |
| 17  | Data integrity (idempotency, soft-delete, concurrent)     | [x]     | [x]     | UNIQUE(app_id, event_id) dedup, Stripe webhook idempotency                     |
| 18  | Notifications & feedback (toasts, confirmation dialogs)   | [x]     | [ ]     | Dashboard has toasts but untested                                              |
| 19  | Multi-tab/session (login propagation, stale session)      | [ ]     | [ ]     | Clerk handles — low priority                                                   |
| 20  | Internationalization (date/currency formats)              | [ ]     | [ ]     | Not applicable — US-only for now                                               |

## Clerk-Specific Quirks (T-097)

Discovered during Playwright MCP smoke testing against `https://app.emithq.com`:

1. **New device email verification:** Clerk triggers mandatory email OTP verification when signing in from an unrecognized device/IP. Headless browsers always trigger this. The existing E2E suites bypass this via `@clerk/testing`'s `clerk.signIn()` which uses a testing token — Playwright MCP does not have this bypass.
2. **Password field has no accessibility ref:** The Clerk sign-in form's password `<input>` does not receive a ref in the Playwright MCP accessibility snapshot. Workaround: use `browser_evaluate` to target `input[type="password"]` via DOM and set value with native input setter + dispatched events.
3. **First login requires org setup:** New Clerk users are routed to `/sign-in/tasks/choose-organization` before reaching the dashboard. This is a one-time flow per user.
4. **UserProfile renders inline:** The Clerk `<UserProfile />` component on the Profile tab renders inline (not in an iframe), with `.cl-userProfile-root` selectors. Account heading, Profile/Security sub-tabs all accessible.
5. **No console errors during normal navigation:** The only error observed was a stale 422 from a failed verification attempt — not a real runtime issue.

**Recommendation for automated Playwright MCP testing:** Use `@clerk/testing` auth bypass to generate a `storageState` file, then pass `--storage-state` to the Playwright MCP server config. This skips email verification entirely.

```bash
# 1. Generate storageState via existing E2E global setup
cd packages/dashboard && op run --env-file=../../.env.tpl -- npx playwright test --project="global setup"
# 2. File saved to: packages/dashboard/playwright/.clerk/user.json
# 3. Add to MCP config in ~/.claude.json:
#    "args": ["@playwright/mcp@latest", "--headless", "--storage-state", "packages/dashboard/playwright/.clerk/user.json"]
```

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
