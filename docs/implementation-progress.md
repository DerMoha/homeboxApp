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
- [x] Multiple photos, receipts/manuals, and attachment management
  - Durable multi-file drafts/recovery; gallery with pinch/accessible zoom; native document viewer; rename/primary/delete. 162 tests and both native builds passed.
- [x] Paginated inventory and server search
  - 50-item pages, debounced Homebox queries, stale-request protection, retry/load-more, explicit partial counts, load-all/offline snapshot. 164 tests passed.
- [x] Saved searches and data-quality review lists
  - Server-scoped saved query/filter/sort/review presets and four review lists; safe persistence errors. 167 tests passed.
- [x] Automated login/create/photo/edit/reload end-to-end coverage
  - Android native instrumentation + local Homebox fixture; actual multipart photo, edit of the same ID, process restart, and rendered-photo pixel assertion. Passed at normal and 200% text size.
- [x] Accessibility: screen reader semantics, large text, and checks
  - Labeled/stateful controls, required-input/error announcements, growing buttons, measured rows, scrollable inventory controls, and reduced-motion press effects; native flow also passed at 200% font scale.
- [x] Refresh the UI roadmap against implemented behavior
  - Replaced stale feature claims with current behavior, practical limits, verification instructions, and explicitly separate future proposals.

Verification includes targeted regression tests, full lint/typecheck/unit tests,
production JavaScript bundling, native builds, and end-to-end checks where supported.
Existing untracked plan.md is outside this work.

## Final verification

- `npm run validate`: lint, TypeScript, and 174 tests in 24 suites passed.
- Android arm64 fieldTest build (bundled production JavaScript) and native test APK passed.
- iOS generic simulator Debug build passed with signing disabled.
- Android 37 arm64 native login/create/photo/edit/reload passed at 100% and 200%
  font scale, including a rendered-photo pixel assertion after process restart.
- Python native-flow harness passed Ruff and bytecode compilation checks.
- Native end-to-end coverage uses a local Homebox v0.26 contract fixture; manual
  physical-device VoiceOver/TalkBack testing and iOS native automation remain
  separate future verification work, described in the refreshed roadmap.
