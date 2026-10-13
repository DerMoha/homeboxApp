# UI cleanup — 13 October 2026

All recommendations accepted in this chat were implemented in separate commits.

| Cleanup | Primary commit | Result |
| --- | --- | --- |
| Quick entry | `63608ee` | Optional details collapsed; save remains above keyboard |
| Items toolbar | `e2c2c48` | Display menu and removable active-filter chips |
| Location picker | `e7410e1` | Searchable selection/creation sheet |
| Navigation | `c95d772` | Four destination tabs; separate Add/Edit form with Cancel |
| Details/attachments | `74dbbd3` | Header Edit and overflow/file actions |
| Shared controls | `b5d9f33` | Consistent fields, sheets, filters, rename and batch pickers |
| Visual noise | `8d689ab` | Flatter forms/cards and static error/empty states |
| Terminology/formatting | `e63cbe6` | Items/Locations wording; server currency and locale dates |

Finishing commits refine shared sheets, compact the toolbar, preserve applied
filters, and stabilize Edit's initial loading transition. Native regression
coverage includes list/grid changes, filters and removable chips, saved review
lists, duplicate cancellation, and the original login/create/photo/edit/reload.

Verification: lint, TypeScript, 183 tests, Android production-JavaScript fieldTest
build, iOS simulator build, and Android native flow in light mode and dark mode
at 200% text size. Native checks assert the location search/result remain above
the software keyboard and the uploaded photo actually renders after restart.
Testing uses a dedicated local fixture, never a real account.

Currency comes from `/api/v1/groups`, cached by server. If unavailable, the app
shows a localized number without guessing a currency. Filters/sorting operate on
loaded items, with explicit counts and a Load all action for complete results.
