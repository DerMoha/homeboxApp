# Inventory improvements

Scope accepted on 12 October 2026. Each feature gets its own verified commit.

- [x] Autosaved item drafts, including durable photos and server/edit isolation
  - Verified durable restore, isolation, missing photos, queued clear, and failed copy (142 tests total).
- [x] Recoverable saves: retry photos/optional fields and reconcile uncertain creates
  - Persistent server-scoped Pending saves screen; durable photo copies; stable upload names; seven recovery regressions (149 tests total).
- [x] Offline inventory browsing with server isolation and freshness indicators
  - Cached text/details/locations/labels and best-effort thumbnails; offline startup/server selection; mutation-aware cache; explicit cache clearing.
- [x] Create locations and labels within the app
  - Parent location selection and inline creation; entity-type/tag API contract tests (157 tests total).
- [x] Duplicate items with fresh asset IDs
  - Detail action opens an isolated duplicate draft; common fields copied; unique identity/photos excluded; original remains unchanged (158 tests total).
- [ ] Multiple photos, receipts/manuals, and attachment management
- [ ] Paginated inventory and server search
- [ ] Saved searches and data-quality review lists
- [ ] Automated login/create/photo/edit/reload end-to-end coverage
- [ ] Accessibility: screen reader semantics, large text, and checks
- [ ] Refresh the UI roadmap against implemented behavior

Verification includes targeted regression tests, full lint/typecheck/unit tests,
production JavaScript bundling, native builds, and end-to-end checks where supported.
Existing untracked plan.md is outside this work.
