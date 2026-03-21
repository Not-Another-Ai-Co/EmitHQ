# Research: Payload Transformation Dashboard UX

**Date:** 2026-03-21
**Status:** Draft — pending review

## Summary

EmitHQ already has a fully functional payload transformation engine (JSONPath + template interpolation, 20-rule limit, built-in functions) and a preview API endpoint, but zero dashboard UI for configuring transforms. Competitors (Svix, Hookdeck) provide JavaScript code editors with inline testing/diff views — a significant investment. EmitHQ's simpler JSONPath/template model is better suited to a visual form-based UI that would be faster to build, more accessible to non-JavaScript users, and a genuine differentiator against the "write JS code" approach used by competitors.

**Recommendation:** Build a lightweight form-based transform editor in the dashboard (not a code editor), gated to Growth+ tier as currently marketed. Defer JavaScript transforms indefinitely — the JSONPath model covers 80%+ of use cases and is easier to surface in a UI.

## Current State

### What exists today

1. **Transform engine** (`packages/core/src/transformation/transform.ts`):
   - `TransformRule[]` — array of `{ sourcePath, targetField, template? }` objects
   - JSONPath dot-notation subset (supports `$.key.nested`, `$.arr[0]`, `$.obj['key-with-dashes']`)
   - Template interpolation with `{{...}}` expressions
   - Built-in functions: `formatDate`, `uppercase`, `lowercase`, `concat`
   - Validation: max 20 rules, max 256-char paths, max 512-char templates, regex-validated target fields
   - Prototype pollution protection (`__proto__`, `constructor`, `prototype` blocked)
   - 36 unit tests covering extraction, templates, transformation, validation, and preview

2. **Preview API** (`packages/api/src/routes/transform-preview.ts`):
   - `POST /api/v1/transform/preview` — stateless preview, accepts payload + rules, returns original + transformed
   - Authenticated (requires API key or Clerk session)

3. **Endpoint API support** (`packages/api/src/routes/endpoints.ts`):
   - `transformRules` accepted on POST (create) and PUT (update)
   - Validated via `validateTransformRules()` before storage
   - Stored as JSONB in `endpoints.transform_rules` column
   - Nullable — `null` or `[]` means passthrough (no transformation)

4. **Delivery worker integration** (`packages/core/src/workers/delivery-worker.ts`):
   - `applyTransformation()` called BEFORE signing in the delivery pipeline
   - Passthrough when rules are null/empty

5. **Dashboard** (`packages/dashboard/src/app/dashboard/app/[appId]/endpoints/page.tsx`):
   - **Zero transform UI** — the `Endpoint` interface doesn't even include `transformRules`
   - Create/edit forms have fields for URL, description, and event type filter only
   - No way to configure transforms from the dashboard

6. **Landing site**:
   - Pricing page: transforms marked as Growth+ feature (`transform: true` only on Growth/Scale)
   - Compare pages: "JSONPath + templates (all tiers)" vs Svix "JavaScript (Pro+ only)"
   - Compare/build-vs-buy: "No-code JSONPath + templates" as a selling point

**Inconsistency found:** The compare pages say "all tiers" but pricing gates transforms to Growth+. The API doesn't enforce tier gating — any tier can set `transformRules` today.

## Competitive Landscape

### Svix — JavaScript Code Editor

- **Model:** Full JavaScript with a `handler(webhook)` function that receives `{ method, url, payload, eventType }` and can modify any property
- **UI:** Code editor in the Consumer App Portal → Endpoint → Advanced tab → Transformations card
- **Testing:** Inline test against event type payloads or custom payloads, results shown in editor
- **Templates:** Pre-built transformation templates for Slack, Discord, Teams, HubSpot with "Generate with AI" button
- **Connectors:** Transformations enable "Connectors" — pre-built integrations to external services
- **Gating:** Transformations are a paid feature (Pro+ tier, ~$490/mo minimum)
- **Audience:** The JavaScript editor targets developers; templates + AI generation lower the barrier

### Hookdeck — JavaScript Code Editor with Diff View

- **Model:** JavaScript (ES6) with `addHandler("transform", (request, context) => { ... })` syntax
- **UI:** Split-pane editor — code on right, Input/Output/Diff tabs on left
- **Testing:** "Run" button tests transformation, Output tab shows result, Diff tab shows before/after delta
- **Environment variables:** Managed via Variables dropdown in editor
- **Console output:** Shows `console.log` output from transformation execution
- **Limitations:** No IO, no async/await, 1-second execution limit, 5MB code limit
- **Gating:** Transformations available on all plans (including free tier)
- **Recent:** Dashboard v4 (July 2025) added dedicated Transformations page with data-dense layout

### Convoy — JavaScript with CDC Integration

- **Model:** JavaScript transformations for reshaping payloads from CDC pipelines
- **UI:** Web dashboard with inline transformation configuration
- **Gating:** Available in open-source self-hosted version
- **Differentiator:** Focuses on ingestion from SQS, Kafka, PubSub — transformation is secondary

### Key Patterns Across All Three

| Pattern             | Svix                       | Hookdeck               | EmitHQ (current)     |
| ------------------- | -------------------------- | ---------------------- | -------------------- |
| Language            | JavaScript                 | JavaScript             | JSONPath + templates |
| Editor type         | Code editor (Monaco-like)  | Split-pane code editor | None (API only)      |
| Inline testing      | Yes                        | Yes + diff view        | API endpoint only    |
| Pre-built templates | Yes (Slack, Discord, etc.) | No                     | No                   |
| AI generation       | Yes ("Generate with AI")   | No                     | No                   |
| Tier gating         | Pro+ ($490+)               | All tiers              | Growth+ ($149+)      |

## Three UI Approaches Evaluated

### Approach A: JavaScript Code Editor (Monaco/CodeMirror)

What Svix and Hookdeck do. Embed a Monaco or CodeMirror editor in the endpoint settings.

**Pros:**

- Maximum flexibility — users write arbitrary JavaScript
- Familiar to developers
- Proven pattern (two competitors validate it)

**Cons:**

- Heavy dependency: Monaco is ~5MB, CodeMirror is lighter but still significant for a dashboard
- Requires a sandboxed JS execution environment (security risk if server-side eval)
- EmitHQ doesn't have a JS transform engine — would need to replace the JSONPath engine
- Development cost: 2-3 weeks for editor + sandboxed execution + testing UI
- Only serves developers — excludes no-code/low-code users

**Verdict:** Wrong direction. EmitHQ's JSONPath model is simpler and covers the common cases. Adding a JS editor means abandoning the current engine, adding security complexity, and competing on Svix/Hookdeck's terms.

### Approach B: Visual Form-Based Builder (Recommended)

A form-based UI that maps directly to the existing `TransformRule[]` model. No code editor needed.

**Concept:**

- Each rule is a row: `Source (JSONPath)` → `Target field` → optional `Template`
- Add/remove rules with + / - buttons
- JSONPath autocomplete from a sample payload (user pastes or selects from recent events)
- Live preview panel: paste payload → see transformed output in real-time
- Built-in function helper: dropdown or tooltip showing `formatDate`, `uppercase`, `lowercase`, `concat`

**Pros:**

- Maps 1:1 to existing `TransformRule[]` — no backend changes needed
- Lightweight UI (no Monaco, no CodeMirror) — just form inputs
- More accessible than code editors — no JavaScript knowledge required
- Genuine differentiator: "No-code payload transformations" vs "write JavaScript"
- Development cost: 3-5 days (form + preview API integration)
- Already have the preview API endpoint to power the live preview

**Cons:**

- Less flexible than arbitrary JavaScript
- Users who need complex logic (conditionals, loops) can't do it
- Need to explain JSONPath syntax to non-technical users

**Mitigation for cons:**

- JSONPath syntax helper with examples and autocomplete
- For the 20% of users who need complex logic: API-only with raw JSON rules (already works today)
- Document common patterns in docs: "How to flatten nested objects," "How to format dates"

### Approach C: Hybrid (Visual + Code)

Start with visual form, add "Advanced: Raw JSON" toggle.

**Pros:**

- Best of both worlds
- Advanced users can edit raw `TransformRule[]` JSON directly
- Visual form is the default for discoverability

**Cons:**

- Slightly more UI complexity
- Risk of confusing users with two modes

**Verdict:** Good incremental path. Start with Approach B, add raw JSON toggle in a follow-up if users request it.

## Recommendation

**Build Approach B (visual form-based transform editor) as a dashboard feature, gated to Growth+ tier.**

### Specific implementation plan:

1. **Add "Transform Rules" section to endpoint create/edit forms** — expandable/collapsible, hidden by default until user clicks "Add transform rules"
2. **Rule builder UI**: Each rule = 3 inputs in a row:
   - Source path (text input with `$.` prefix, placeholder: `$.data.user.email`)
   - Target field (text input, validated against `TARGET_FIELD_RE`)
   - Template (optional text input, placeholder: `{{$.data.user.name}} <{{$.data.user.email}}>`)
   - Delete button per rule, "Add Rule" button at bottom
3. **Live preview panel**: Two side-by-side JSON views (original → transformed). User pastes sample payload or clicks "Use last event" to pull from recent message history. Calls `POST /transform/preview` on each keystroke (debounced).
4. **Function reference tooltip**: Small help icon that shows available functions with examples
5. **Tier gating in UI**: Show transform section on all tiers but with a "Growth+ feature" upgrade prompt for Free/Starter users. API-level enforcement deferred (current API allows transforms on any tier — adding enforcement is a separate decision).

### What NOT to build:

- No Monaco/CodeMirror code editor
- No JavaScript execution engine
- No pre-built templates (premature — need users first)
- No AI generation (premature — need templates first)
- No "Connectors" feature (Svix's approach of turning transforms into integrations)

### Pricing inconsistency to resolve:

The compare/svix page says "JSONPath + templates (all tiers)" but the pricing page gates transforms to Growth+. Two options:

1. **Keep Growth+ gating**: Update compare pages to say "Growth+ tiers" instead of "all tiers"
2. **Make transforms available on all tiers**: Strongest competitive claim. Svix gates to $490+, EmitHQ offers it free.

**Recommendation:** Make transforms available on all paid tiers (Starter+). Free tier excluded. This gives the strongest positioning against Svix ($49 vs $490 for transforms) while keeping free tier simple. Update pricing page and compare pages to match.

### Effort estimate:

- Dashboard form UI: 2-3 days
- Live preview integration: 1 day
- Tier gating UI (upgrade prompt): 0.5 day
- Tests: 1 day
- **Total: ~5 days (Medium ticket)**

## Open Questions

1. **Should transforms be available on Starter ($49) or only Growth+ ($149)?** The current pricing page says Growth+ but compare pages say "all tiers." Making it Starter+ gives the strongest competitive position.
2. **Should the API enforce tier gating?** Currently any tier can set `transformRules` via API. Adding enforcement would break existing API behavior (if anyone is using it on free/starter).
3. **Should the preview panel show "last event" from the message history?** This requires an API call to fetch recent messages — useful but adds a dependency on the events endpoint.
4. **Is JSONPath syntax documented well enough for users?** May need a dedicated docs page with common transformation recipes.

## Sources

- [Svix Transformations Docs](https://docs.svix.com/transformations)
- [Svix Transformation Templates](https://docs.svix.com/transformation-templates)
- [Svix AI-Generated Transformations Blog](https://www.svix.com/blog/ai-for-transformations/)
- [Svix "What, Why, and How of Payload Transformations" Blog](https://www.svix.com/blog/transformations-feature/)
- [Hookdeck Transformations Docs](https://hookdeck.com/docs/transformations)
- [Hookdeck Custom Rules](https://docs.hookdeck.com/docs/configure-custom-rules)
- [Hookdeck Transformation Ordering](https://hookdeck.com/blog/transformation-ordering)
- [Convoy GitHub (transformations)](https://github.com/frain-dev/convoy)
- [Contentful Webhook Transformations](https://www.contentful.com/developers/docs/webhooks/transformations/)
- EmitHQ codebase: `packages/core/src/transformation/transform.ts`, `packages/api/src/routes/transform-preview.ts`, `packages/api/src/routes/endpoints.ts`, `packages/dashboard/src/app/dashboard/app/[appId]/endpoints/page.tsx`
- EmitHQ docs: `docs/research/competitive-landscape.md` (Gap 5: Payload Transformations at Mid-Market Price)
