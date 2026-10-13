# Homebox mobile UX roadmap

Updated 13 October 2026. Implementation and verification details are tracked in
[the implementation checklist](docs/implementation-progress.md).

## Implemented

The [UI cleanup checklist](docs/ui-cleanup.md) records the completed navigation,
form, toolbar, picker, and presentation changes.

- Four destination tabs: Home, Items, Locations, and Settings. Add/Edit open a
  separate modal form with Cancel; draft autosave preserves dismissed work.
- Quick entry keeps name, location, and photo together, collapses optional details,
  and pins Save above the keyboard with safe-area padding.
- Items places Display, Filters, and Saved together, with removable filter/review
  chips and a separate Add action. Display includes sorting, list/grid, and density.
- Location selection/creation and label selection use searchable shared sheets.
  Fields, filters, saved views, rename, and batch pickers share control patterns.
- Edit is in the item header; Duplicate/Share and per-file actions use overflow
  menus. Form sections are flatter, and error states have no idle animation.
- Prices use the Homebox group currency and device locale. Offline currency is
  server scoped; unknown currency displays a number without an assumed symbol.
  Absolute dates use the device locale.

- Item drafts autosave fields, location, labels, photos, and selected documents on
  this device. Drafts are isolated by server and by new/edit/duplicate item. Users
  can restore or discard them; unavailable local files are reported.
- Pending saves in Settings retain interrupted optional-field and file uploads.
  Retries use the known item ID. Ambiguous creates require checking the server
  and choosing the existing item or explicitly confirming a new create.
- Previously loaded inventory, locations, labels, item details, and downloaded
  images remain browsable offline. A banner shows the original refresh time.
  Offline browsing and cache clearing are server scoped. Downloads are best
  effort; files that have never been downloaded require a connection.
- Locations and labels can be created during entry. Locations support parent
  selection and can also be created from Places.
- Duplicate opens a separate draft with copied descriptive fields, location,
  labels, and quantity. Asset IDs and attachments are excluded so Homebox can
  assign a fresh identity.
- Items support multiple photos and receipt/manual/document uploads. Files are
  retained with drafts and pending saves. Details offer a photo gallery with
  pinch and button zoom, primary-photo selection, attachment rename/removal,
  and a native document viewer.
- Inventory uses 50-item pages and debounced server search. Load more retries a
  failed page without losing previous records. Load all fetches remaining pages
  and caches a complete unfiltered inventory snapshot for offline browsing.
  Counts explicitly identify loaded results: local filters, review lists, and
  sort order cover loaded records until all pages have been fetched.
- Named saved searches retain query, filters, sort order, and review list per
  server. Built-in reviews cover missing photos, missing locations, uninsured
  items worth at least 500 in the server currency, and items added this week.
- Filters include location, all selected labels, insurance, quantity bounds, and
  rolling week/month/quarter dates. Last-used filters are stored per server.
- Inventory supports list/grid display, batch selection, move, labels, delete,
  and swipe actions. Quick entry offers Save & next with inline feedback.
- Shared controls expose screen-reader purpose/state and input errors. Buttons
  use growing minimum heights; inventory rows use measured heights. Shared
  button/header press animations respect reduced-motion preferences. Tab labels
  scale up to 150% to stay on one line; their screen-reader labels remain complete.

## Verification

Lint, TypeScript, unit/regression tests, Android builds, and iOS simulator builds
cover the implementation. The native Android regression uses an isolated local
Homebox-contract fixture and checks login, create, photo upload, edit, and reload.
See [the end-to-end instructions](e2e/README.md) for prerequisites and test scope.
This fixture validates the client flow; it does not replace testing against every
Homebox server version or manual VoiceOver/TalkBack navigation on physical devices.

## Further work

These remain separate proposals, not unfinished parts of the accepted scope:

- Server-supported global filter/sort expansion and richer search highlighting.
- Price-range filters, custom date intervals, and configurable review thresholds.
- Explicit full-resolution offline file downloads and storage limits.
- Import/export, sharing, and server-backed draft synchronization.
- iOS native end-to-end automation and a broader physical-device accessibility
  matrix, including VoiceOver and TalkBack with multilingual content.
- Product lookup for commercial barcodes, if a suitable data provider is chosen.
  The current numeric asset-ID field uses Homebox identity semantics.
