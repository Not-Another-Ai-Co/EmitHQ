# Verify Feedback

Patterns flagged by `/verify` — read by `/build` before test generation.

## T-118 (2026-03-29) — CONDITIONAL → Accepted

### Pattern: Tautological mock test (soft-delete)

**What happened:** `resolve-app.test.ts` "returns null for soft-deleted app" passes an empty mock result and asserts `null`. The `isNull(deletedAt)` filter is never exercised — removing it wouldn't break the test.

**Example:** `createMockTx([])` always yields `null` regardless of query conditions. The test proves empty rows → null, not that the soft-delete filter exists.

**What would catch it:** Either inspect `.where()` call arguments to verify `isNull(deletedAt)` is present, or use an in-memory DB (integration test). For pure unit mocks of Drizzle query chains, at minimum assert `.where` was called with a matcher that includes the expected condition.

### Pattern: Implementation-fitted method-chain test

**What happened:** `resolve-app.test.ts` "calls select, from, where, limit on the tx" asserts that Drizzle builder methods were called exactly once. This breaks on refactor (e.g., switching to `findFirst()`) but doesn't catch wrong conditions.

**What would catch it:** Test observable behavior (return values, side effects) rather than internal call sequence. If testing query structure is essential, assert what `.where()` was called _with_, not just that it was called.

### Pattern: Incomplete field assertions on data objects

**What happened:** `tiers.test.ts` starter/growth tests checked 3 of 5 fields, leaving `slaGuarantee` and `staticIps` unasserted. Fixed in verify commit.

**What would catch it:** Always assert all fields of a data object, or use `toEqual` on the entire object (catches extra/missing fields).
