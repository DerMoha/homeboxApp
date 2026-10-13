# Security Remediation Plan

## Overview

This document outlines the security fixes required before a production release. Issues are prioritized by severity and organized into phases.

---

## Phase 1: Transport Security (Highest Priority)

### Issue

Android allows cleartext HTTP globally, enabling credentials to traverse plaintext for private/LAN servers.

### Fixes

| Issue                    | Location                                                   | Fix                                                                                                                                 |
| ------------------------ | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Android global cleartext | `android/app/src/main/AndroidManifest.xml`                 | Remove `android:usesCleartextTraffic="true"`                                                                                        |
| Network security config  | `android/app/src/main/res/xml/network_security_config.xml` | Replace `base-config cleartextPermitted="true"` with domain-specific exceptions for localhost, `.local`, and RFC1918 private ranges |
| iOS local networking     | `ios/HomeboxApp/Info.plist`                                | Keep `NSAllowsLocalNetworking` only if LAN access is required                                                                       |

---

## Phase 2: iOS Permissions & Metadata

### Issue

Missing required permissions and template defaults that can cause App Store rejection.

### Fixes

| Issue                            | Location                                   | Fix                                                                        |
| -------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------- |
| Missing photo library permission | `ios/HomeboxApp/Info.plist`                | Add `NSPhotoLibraryUsageDescription` for image picker                      |
| Empty location permission        | `ios/HomeboxApp/Info.plist`                | Remove unused `NSLocationWhenInUseUsageDescription` or add meaningful text |
| Release bundle ID is template    | `ios/HomeboxApp.xcodeproj/project.pbxproj` | Replace `org.reactjs.native.example` with real bundle ID in Xcode          |
| Release signing identity         | `ios/HomeboxApp.xcodeproj/project.pbxproj` | Configure real iPhone Distribution signing in Xcode                        |

---

## Phase 3: Session & Credential Lifecycle

### Issue

Deleting a server doesn't clear in-memory auth state, allowing continued session.

### Fixes

| Issue                             | Location                                                              | Fix                                                                                                                                   |
| --------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Server delete leaves memory state | `src/services/serverService.ts` + `src/services/server/serverAuth.ts` | Add `disconnect()` method that clears `currentConfig`, `token`, and axios `Authorization` header; call it when deleting active server |
| Active server memory retention    | `src/services/serverService.ts`                                       | After any server deletion, check if deleted server was active; invoke `disconnect()` and reset state                                  |

---

## Phase 4: Diagnostics & Privacy Hardening

### Issue

Diagnostics store plaintext timestamps, messages, error stacks with no TTL or user control.

### Fixes

| Issue                               | Location                             | Fix                                                                                    |
| ----------------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------- |
| No TTL on diagnostics               | `src/services/diagnosticsService.ts` | Add max-age/TTL: discard events older than 7 days on app launch                        |
| Error stacks persisted              | `src/utils/logSanitizer.ts`          | Strip `stack` field from Error serialization; keep only `message`                      |
| No user clear/export                | `src/services/diagnosticsService.ts` | Add `clear()` method and expose through settings                                       |
| Diagnostics include item/server IDs | `src/services/diagnosticsService.ts` | Add allowlist filtering: only persist event codes + severity, not raw messages/context |
| Raw server errors shown in UI       | `src/hooks/useServerConfig.ts`       | Map server errors to generic user-safe messages before alerting                        |

---

## Phase 5: Runtime Security Defaults

### Issue

Key-name redaction is bypassable; sensitive values can still leak.

### Fixes

| Issue                      | Location                       | Fix                                                                              |
| -------------------------- | ------------------------------ | -------------------------------------------------------------------------------- |
| Key-name redaction fragile | `src/utils/logSanitizer.ts`    | Replace key-based filtering with strict allowlist: only permit known-safe fields |
| Barcodes in logs           | Various                        | Ensure barcode values are not included in log context                            |
| Image cache exposure       | `src/hooks/useImageHandler.ts` | Add explicit cleanup on logout                                                   |

---

## Phase 6: Build & Release Hygiene

### Issue

Production builds must meet platform security baselines.

### Fixes

| Issue                   | Location                    | Fix                                                                         |
| ----------------------- | --------------------------- | --------------------------------------------------------------------------- |
| Android release signing | `android/app/build.gradle`  | Keep fail-closed behavior (already correct)                                 |
| No iOS entitlements     | `ios/`                      | Add `HomeboxApp.entitlements` with `keychain-access-groups` if needed       |
| Export compliance       | `ios/HomeboxApp/Info.plist` | Add `ITSAppUsesNonExemptEncryption` if not using encryption                 |
| Play/App Store setup    | Manual                      | Verify Play App Signing, Data Safety declarations, Privacy Nutrition Labels |

---

## Recommended Execution Order

1. **Phase 1** — Transport security (blocks credentials over plaintext)
2. **Phase 2** — iOS permissions (fixes App Store rejection risk)
3. **Phase 3** — Session lifecycle (ensures deleted servers fully disconnect)
4. **Phase 4** — Diagnostics hardening (reduces plaintext retention)
5. **Phase 5** — Runtime defaults (future-proofs logging)
6. **Phase 6** — Build hygiene (manual Xcode/console steps)

---

## Effort Estimate

| Phase   | Effort   | Risk                                  |
| ------- | -------- | ------------------------------------- |
| Phase 1 | 1 day    | Low — tightens security               |
| Phase 2 | 1 day    | Medium — requires Xcode/manual        |
| Phase 3 | 0.5 day  | Low — cleanup logic                   |
| Phase 4 | 1-2 days | Medium — changes diagnostics behavior |
| Phase 5 | 0.5 day  | Low — logging hardening               |
| Phase 6 | Manual   | N/A                                   |

---

## Decisions Required

1. **Cleartext scope**: Should private/LAN HTTP be supported in production?

   - If yes: keep domain-scoped cleartext in Phase 1
   - If no: remove cleartext entirely

2. **Diagnostics retention**: How long should diagnostics be kept?

   - Default: 7 days with auto-purge

3. **iOS release identity**: Real bundle ID and signing identity available?
   - If yes: provide values for manual Xcode configuration
   - If no: leave placeholders for manual setup
