# Dependency upgrade — 2026-10-12

Upgraded the app from React Native 0.79.1 to 0.87.1, including its CLI,
Babel preset, Metro configuration, TypeScript configuration, Jest preset,
Android toolchain, and iOS pods. All other direct npm dependencies now use
the latest stable version available at upgrade time, with these compatibility
exceptions:

| Package | Selected | Reason |
| --- | --- | --- |
| React and react-test-renderer | 19.2.3 | Matches the renderer bundled with React Native 0.87.1. |
| test-renderer | 1.2.0 | Uses React 19.2's reconciler; 1.3 requires React 19.3. |
| Babel core, preset-env, runtime | Latest 7.x | React Native's Babel preset uses Babel 7 plugins. |
| ESLint | 9.39.5 | React Native's ESLint config supports ESLint 8 and 9. |
| TypeScript | 6.0.3 | TypeScript 7 is incompatible with the current TypeScript ESLint tooling. |

Removed unused Expo vector icons and the obsolete React Native type stub.
Retained the existing vector icon package at its latest published version to
preserve the app's icon imports and font setup.

## Migration changes

- AsyncStorage 3 uses `getMany` and `setMany`. The app keeps the default legacy
  storage instance so existing saved settings and server configurations remain
  accessible. Tests now exercise the new batch API.
- Testing Library 14 rendering, hook rendering, and act helpers are asynchronous.
- Replaced removed `StyleSheet.absoluteFillObject` references.
- Updated ScrollView instance and navigation types for the new definitions.
- Migrated ESLint to flat config. Flow rules are excluded because the app uses
  TypeScript and React Native's bundled Flow plugin uses the legacy ESLint API.
- Android uses Gradle 9.4.1, AGP 9.2.1, compile SDK/build tools 37, target SDK 36,
  and Kotlin 2.2.10. Kotlin matches the version resolved by native dependencies.
  The old Kotlin plugin/DSL remain enabled for native library compatibility;
  library BuildConfig generation and image-resizer's namespace are explicit.
- Updated Android application initialization to the ReactHost entry point.
- iOS pod resource bundles inherit at least React Native's minimum iOS version,
  avoiding obsolete deployment targets rejected by Xcode 27.
- Updated Ruby dependencies and GitHub Actions; native and Ruby lockfiles are
  now tracked for reproducible installs.
- Node follows React Native's supported engine ranges. See README for setup.

## Security audit

At upgrade time, `npm audit` reports 46 affected dependency entries (29 high,
17 moderate), tracing to two unfixed advisories in `braces` and `sprintf-js`.
The latest registry releases (3.0.3 and 1.1.3 respectively) are still affected.
These are transitive tooling dependencies. npm's suggested major downgrades
would undo the React Native upgrade; no forced downgrades were applied.

## Validation

- Clean `npm ci` without `--legacy-peer-deps` succeeds.
- `npm run validate` passes: lint, typecheck, 14 suites / 137 tests.
- Production Android JavaScript bundle builds successfully with Metro.
- iOS Debug simulator build succeeds with Xcode 27 (unsigned, arm64 and x86_64).
- Android Debug arm64 APK builds successfully with JDK 17.

Device testing of scanning, image selection/cropping, keychain access, saved
settings, and navigation is still needed before shipping this framework upgrade.
