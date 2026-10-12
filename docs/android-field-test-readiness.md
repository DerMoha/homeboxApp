# Android inventory field test — updated 12 October 2026

The client API contract matches Homebox v0.26.2. A standalone personal-test
APK was built and installed on the connected ARM64 Android phone. Authenticated login and reads now work on the phone: 0 items, 8 locations,
including Basement. Places renders all eight locations, and the item form
loads location and label options. An authenticated item/photo save-and-reload
check is still required before a large inventory session.

## Quick entry — 12 October

- New items default to a compact name, location and photo form. “Show all
  fields” restores quantity, asset ID and configured optional fields; editing
  always uses the full form.
- “Save & next” stays on the form, clears the item draft and photo, retains
  the chosen location, scrolls to the top and shows a session save count.
- Successful saves require no confirmation. Partial saves still display a
  warning; failed saves keep the draft. Photos remain optional.
- Fixed unstable metadata callback dependencies that repeatedly loaded
  locations/labels while the form was focused.
- Validation and standalone ARM64 APK build passed. APK signature verified.
  No Android device was connected during this update, so this APK has not
  been installed or visually checked on the phone yet. The latest installed
  build remains the 10 October build. Live item/photo writes remain unverified.

## Evidence

- `https://hb.brokenmoha.de/api/v1/status` returned healthy, v0.26.2,
  commit `e01dd737238a3fa7e1a6454b37de6c6fc88c86e4` over trusted HTTPS.
- The official v0.26.2 Swagger definitions and entity handler were checked:
  https://github.com/sysadminsmedia/homebox/blob/v0.26.2/backend/app/api/static/docs/swagger.json
  https://github.com/sysadminsmedia/homebox/blob/v0.26.2/backend/app/api/handlers/v1/v1_ctrl_entities.go
- Login uses `/api/v1/users/login`; inventory and locations use
  `/api/v1/entities` with `isLocation`; labels use `/api/v1/tags`;
  location trees use `/api/v1/entities/tree`; photo uploads use
  `/api/v1/entities/{id}/attachments` with `file`, `type`, `primary`, `name`.
- Live unauthenticated entity/tag requests returned 401, as expected.
- `npm run validate`: ESLint, TypeScript and 137 tests across 14 suites passed.
- `assembleFieldTest -PreactNativeArchitectures=arm64-v8a` passed, including
  fatal release lint, minification and resource shrinking.
- APK signature verified. The APK includes Hermes and `index.android.bundle`;
  `BuildConfig.DEBUG=false`, and the installed app is not debuggable.
- Installation with `adb install -r` succeeded; Home, Settings and Server
  Configuration rendered on the phone. Navigation no longer crashes.

## Repairs made during verification

- Load the React Native URL polyfill before app startup: Hermes previously
  threw `URL.hostname is not implemented` before any login request.
- Saving a server now establishes the active connection; selecting a saved
  server reports failures instead of silently selecting a disconnected server.
- Inventory and Places reload on focus after connection and inventory changes.

- Inventory screen requests the full inventory instead of silently stopping
  at 50 items; Home's recent-item request remains limited.
- Location array filters use repeated query keys, matching Homebox's parser.
- If creating an item succeeds but its optional-field update fails, return
  that item's ID with a visible warning. The UI completes the save rather
  than inviting a duplicate create. Photo warnings are retained as well.
- Preserve container parents and explicit location overrides when editing
  without changing the location on newer Homebox versions.
- Android barcode scanning and photo capture request camera permission.
- Reject unsupported asset IDs and overlong text before making mutations.
- Library originals are no longer deleted after compression.
- Photo rotation changes the uploaded image file, rather than only its
  preview. The preview-only Flip button was removed.
- Added shared keyboard-aware form scrolling to server setup and item entry.
  Real-device screenshots confirmed password focus brings username, password
  and both connection buttons above the keyboard.
- Added Android VIBRATE permission after a real-device tab-navigation test
  exposed a native SecurityException.
- Fixed two network security XML entries rejected by release lint.
- Updated Axios from 1.19.0 to 1.20.0 after checking the dependency audit.

## Remaining limits

- No offline persistence or synchronization queue: server connectivity is
  required. Confirm Wi-Fi/mobile data works in the basement.
- Locations and tags must already exist in Homebox; this app selects them.
- The scan field is Homebox's numeric asset ID, not a general product-barcode
  database. Leave it empty for Homebox's generated ID. Asset IDs are unique;
  using the same product barcode for multiple items can fail.
- An ambiguous network failure during the initial create can still leave a
  server-side item. Check the web inventory before retrying after a timeout.
- This is debug-key signed for personal testing, with release behavior.
  Public distribution needs the real release signing key.
- `npm audit --omit=dev` still reports 28 dependency findings (4 moderate,
  23 high, 1 critical). Many come from development tools pulled through
  React Native, including shell-quote; this does not establish an exploit
  in the installed APK. Resolve and assess them before public release.
- Full inventory loading is appropriate for the initial field test; very
  large collections will eventually need paginated UI/search.
- Authenticated login, inventory, locations, tree and label reads were verified
  on the real phone/server. No create/update/photo/delete was performed yet. iOS was not built or device-tested.

## Before inventorying many items

1. Save/connect the configured server on the phone.
2. Confirm existing locations, labels and inventory load.
3. Create one clearly named test item with quantity, a location and a photo.
4. Verify its values and photo in the Homebox web interface.
5. Edit the test item, restart the app and confirm the saved result reloads.
6. Test scanning if using asset labels, and check basement connectivity.

APK: `android/app/build/outputs/apk/fieldTest/app-fieldTest.apk`

SHA-256: `761b6d9b1e928dc34d4ba217f477360cd50f1a5cfd06f44ec5b11e4d24bbfb50`
