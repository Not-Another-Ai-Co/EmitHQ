# Research: Dashboard UX Restructure

**Date:** 2026-03-18
**Status:** Complete
**Linked to:** T-068

## Summary

Restructure the EmitHQ dashboard from a flat sidebar with app dropdown to a two-level navigation pattern (Vercel/Railway model). App listing becomes the landing page, Getting Started moves inline, Settings/Billing/Profile consolidate into tabs, app deletion becomes soft-delete with 30-day recovery. Six implementation tickets produced.

## Current State Analysis

### Navigation (8 nav items + conditional Getting Started)

```
[Getting Started]  ← conditional, localStorage-based visibility
Overview           ← landing page (broken without app context)
Events             ← app-scoped
Endpoints          ← app-scoped
Dead Letter Queue  ← app-scoped
Applications       ← app management (buried in nav)
Billing            ← org-scoped
Settings           ← API keys only
Profile            ← Clerk UserProfile
```

**AppSwitcher:** Sidebar dropdown, fetches app list once on mount, no cache invalidation. Context tracked via `?app=<uid>` URL query param propagated to all nav links via `hrefWithApp()`.

### Identified Issues

1. **App selection is a dropdown, not the landing page.** New users land on Overview with `?app=default` which shows `—` placeholders for all stats. No guidance.
2. **Getting Started is a hidden separate page.** Onboarding at `/dashboard/getting-started`, discoverable only via conditional nav item. localStorage-only persistence.
3. **Settings fragmented across 3 nav items.** Settings (API keys), Billing, Profile are separate pages/nav items.
4. **Hard delete with no recovery.** Apps are hard-deleted with manual cascade (delivery_attempts → endpoints → messages → application). All data permanently lost.
5. **Stale app dropdown after deletion.** AppSwitcher uses local `useState`, no invalidation when ApplicationsPage deletes an app.
6. **Delete button formatting.** Minimal visual weight (`text-xs text-muted`), inconsistent with endpoint delete pattern.
7. **AppSwitcher shows 'default' when no app selected.** Confusing placeholder string.
8. **No app update/rename endpoint.** `PUT /api/v1/app/:appId` does not exist.

## Competitive Analysis

### App-Centric Navigation (Vercel, Railway, Supabase, Neon, Hookdeck)

All modern developer platforms use two-level navigation:

- **Level 1 (global):** Landing page = resource list (projects/apps/databases as cards). Navigation is global: settings, billing, profile.
- **Level 2 (resource context):** Clicking a resource enters its context. Sidebar transforms to show resource-specific items. "Back to all" gesture returns to listing.

Vercel: `vercel.com/[team]` → project grid → `vercel.com/[team]/[project]` → project-specific sidebar.
Hookdeck: Organizations > Projects. Pipeline config is project-scoped.

### Onboarding Integration (PostHog, Stripe, Linear)

- Checklist inline on the main dashboard, not a separate page
- Progress-driven visibility — auto-hides when complete
- Server-side persistence, not localStorage-only
- Completion celebration before fade-out

### Settings Consolidation (Stripe, Vercel, Linear)

- Single "Settings" nav item → tabbed page
- Tab order by frequency: most-used first
- Billing is a tab within Settings, not top-level
- Profile either under Settings or via user avatar menu

### Soft Delete (Notion, GitHub)

- Delete = archive/soft-delete with time-limited recovery
- Recovery UI in Settings or dedicated Trash section
- Confirmation dialog states recovery window
- Auto-purge after retention period (30 days typical)

## Proposed Architecture

### Route Structure

```
/dashboard                           → App listing + inline onboarding
  /dashboard/app/[appId]             → App overview (stats)
  /dashboard/app/[appId]/events      → Events list
  /dashboard/app/[appId]/endpoints   → Endpoints CRUD
  /dashboard/app/[appId]/dlq         → Dead letter queue
/dashboard/settings                  → Tabbed: API Keys | Billing | Profile | Danger Zone
```

### Sidebar States

**Global (no app selected — on `/dashboard` or `/dashboard/settings`):**

```
EmitHQ
─────────────
Applications    ← this IS the landing page
Settings
Sign Out
```

**App context (on `/dashboard/app/[id]/*`):**

```
EmitHQ
← All Apps
─────────────
[App Name]
─────────────
Overview
Events
Endpoints
Dead Letter Queue
─────────────
Settings
Sign Out
```

### App Listing Page (`/dashboard`)

**With apps (onboarding complete/dismissed):**

- Card grid: app name, uid, endpoint count, 24h event count, created date
- "+ New Application" card/button
- Quick actions menu per card (rename, delete)

**No apps yet:**

- Getting Started checklist rendered inline (not a separate page)
- "Create your first application" CTA
- Checklist: Create app → Generate API key → Add endpoint → Send first event

**With apps (onboarding incomplete):**

- Getting Started card at top (collapsible, shows progress like "2/4 complete")
- App cards below

### Onboarding State

- Server-side: `onboarding_completed_at TIMESTAMPTZ` on `organizations` table
- localStorage as cache layer (check local first, fall back to API)
- Auto-complete when all 4 steps done — show "You're all set!" briefly, then collapse
- Dismiss sets both localStorage AND server flag
- Remove `/dashboard/getting-started` page and nav item

### Settings Consolidation

Single `/dashboard/settings` with tab routing via `?tab=`:

| Tab         | Content                                              | Default |
| ----------- | ---------------------------------------------------- | ------- |
| API Keys    | Current Settings page (generate, list, revoke)       | Yes     |
| Billing     | Current Billing page (tier, usage, checkout, portal) |         |
| Profile     | Clerk `<UserProfile />`                              |         |
| Danger Zone | Recently deleted apps (restore/permanent delete)     |         |

### Soft Delete

- Add `deleted_at TIMESTAMPTZ` to `applications` table
- `DELETE /api/v1/app/:appId` → sets `deleted_at = NOW()`, disables all endpoints
- `GET /api/v1/app` → filters `WHERE deleted_at IS NULL`
- New `POST /api/v1/app/:appId/restore` → clears `deleted_at`, re-enables endpoints
- New `GET /api/v1/app?deleted=true` → lists soft-deleted apps (for Danger Zone)
- 30-day auto-purge: scheduled job hard-deletes where `deleted_at < NOW() - 30 days`
- Dashboard: 5-second undo toast after deletion

### Cache Fix

Replace per-component `useState` app lists with shared state:

- React Context provider wrapping dashboard layout (`AppsProvider`)
- `useApps()` hook: `{ apps, refetch, removeApp, addApp }`
- AppSwitcher and ApplicationsPage both consume from context
- Mutations (create/delete) update context immediately

## Database Changes Required

### Migration: Add soft-delete to applications

```sql
ALTER TABLE applications ADD COLUMN deleted_at TIMESTAMPTZ;
CREATE INDEX idx_applications_deleted ON applications(org_id) WHERE deleted_at IS NULL;
```

### Migration: Add onboarding flag to organizations

```sql
ALTER TABLE organizations ADD COLUMN onboarding_completed_at TIMESTAMPTZ;
```

## Changes Summary

| Area            | Current                             | Proposed                                     |
| --------------- | ----------------------------------- | -------------------------------------------- |
| Landing page    | Overview stats (broken without app) | App card grid with stats                     |
| App context URL | `?app=my-app` query param           | `/dashboard/app/my-app` path segment         |
| Getting Started | Separate page, localStorage-only    | Inline card on app listing, server-side flag |
| Nav items       | 8 + conditional                     | 2 global + context-dependent app items       |
| Settings        | 3 separate nav items                | 1 tabbed page (4 tabs)                       |
| App deletion    | Hard delete, no recovery            | Soft delete, 30-day recovery                 |
| App cache       | Stale after delete                  | Shared React Context, immediate sync         |

## Implementation Tickets

### T-070: Route restructure + sidebar transform (Medium/Moderate)

- Add `/dashboard/app/[appId]` nested layout and routes
- Move Events, Endpoints, DLQ pages to app-scoped routes
- Replace AppSwitcher dropdown with sidebar context switching (global ↔ app)
- Remove `?app=` query param propagation
- Update all internal links

### T-071: App listing as landing page (Low/Simple)

- Move app grid to `/dashboard` (replace Overview)
- Add per-card stats (endpoint count, 24h events)
- Add "+ New Application" card
- Keep Overview as `/dashboard/app/[appId]` (app-scoped)

### T-072: Inline onboarding (Low/Simple)

- Extract Getting Started from page to embeddable component
- Render inline on app listing when incomplete/not dismissed
- Add `onboarding_completed_at` to organizations schema
- Sync dismiss to server
- Remove `/dashboard/getting-started` page and nav item

### T-073: Settings consolidation (Low/Simple)

- Merge Billing + Profile into Settings as tabs
- Tab routing via `?tab=api-keys|billing|profile|danger-zone`
- Remove Billing and Profile from sidebar nav
- Add Danger Zone tab (empty initially, populated by T-074)

### T-074: Soft delete + recovery (Medium/Moderate)

- Add `deleted_at` column to applications (migration)
- Update DELETE endpoint: soft-delete + disable endpoints
- Add restore endpoint
- Add deleted apps list endpoint
- Settings > Danger Zone: recovery UI (restore/permanent delete)
- 5-second undo toast in dashboard
- 30-day auto-purge job

### T-075: Stale app cache fix (Low/Simple)

- Add `AppsProvider` React Context to dashboard layout
- `useApps()` hook for shared app list state
- Mutations (create/delete/restore) update context immediately
- Remove per-component app fetching in AppSwitcher

### Dependency Order

```
T-070 (routes) → T-071 (landing) → T-072 (onboarding)
T-073 (settings) — independent, can parallel with T-070
T-074 (soft delete) → depends on T-073 (Danger Zone tab)
T-075 (cache fix) → depends on T-070 (app state changes with routes)
```

## Sources

- Vercel docs: project overview, settings structure
- Stripe docs: dashboard navigation, settings 3-tier model
- Linear docs: workspace/team navigation
- Hookdeck docs: organization/project navigation
- NNGroup: progressive disclosure, onboarding patterns
- PostHog: onboarding wizard integration
- Notion: trash/recovery UX
- EmitHQ codebase: nav.tsx, app-switcher.tsx, applications/page.tsx, getting-started/page.tsx, settings/page.tsx, billing/page.tsx, routes/applications.ts, schema.ts
- Knowledge base: ~/.claude/knowledge/frontend-development/research.md
