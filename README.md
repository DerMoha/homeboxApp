# HomeboxApp

React Native client for a self-hosted Homebox server.

## Requirements

- Node.js 22.13+, 24.3+, or 26+ (matching the supported ranges in `package.json`)
- Ruby 3.2+ and Bundler for iOS dependencies
- npm 10+
- Xcode for iOS builds
- Android Studio for Android builds
- A reachable Homebox server over `https://`, or `http://` for localhost/loopback and `.local` development hosts

## Getting Started

```bash
npm ci
npm start
```

For iOS, install the Ruby tools and native dependencies first:

```bash
bundle install
cd ios
bundle exec pod install
cd ..
```

In a second terminal, launch the platform app:

```bash
npm run android
# or
npm run ios
```

## Quality Checks

```bash
npm run validate
```

## Server Security

- Saved server passwords are stored in the device keychain, not AsyncStorage.
- Hosts without a scheme default to `https://`.
- Hosts without a scheme default to `https://` except for localhost, loopback, `10.0.2.2` (Android emulator), and `.local` development hosts.
- Plain `http://` is rejected for public and RFC1918 IP addresses; use HTTPS for servers on a LAN or across the internet.

## Android Release Setup

Release builds now require a real keystore. Export these values before running a release build:

```bash
export HOMEBOX_RELEASE_STORE_FILE=/absolute/path/to/homebox-release.keystore
export HOMEBOX_RELEASE_STORE_PASSWORD=your-store-password
export HOMEBOX_RELEASE_KEY_ALIAS=your-key-alias
export HOMEBOX_RELEASE_KEY_PASSWORD=your-key-password
```

Then build the release artifact from `android/` with your usual Gradle command.

## Standalone Android Field Test

Build a test APK with bundled JavaScript, Hermes, and release optimizations:

```bash
cd android
./gradlew assembleFieldTest -PreactNativeArchitectures=arm64-v8a
adb install -r app/build/outputs/apk/fieldTest/app-fieldTest.apk
```

This build runs without Metro or a connected computer. It uses the local debug
signing key for personal testing; public releases still require the release
keystore. The architecture above targets modern ARM64 phones.

The app requires a reachable server and does not queue inventory changes
offline. This client uses the entity/tag API verified against Homebox v0.26.2.
Create locations in Homebox before starting inventory. The scan field maps to
Homebox's numeric asset ID, rather than a separate product barcode field.

Before a large inventory session, save one item with a photo and location,
check it in the Homebox web interface, then restart the app and verify it loads.

Android cleartext traffic is disabled by default. The network security policy
only permits it for localhost, the Android emulator loopback alias, and `.local`
development names.

## iOS Release Setup

Before archiving, set the real Apple Developer Team and verify the bundle ID
`com.homeboxapp.mobile` in Xcode Signing & Capabilities. The project no longer
contains the React Native template signing identity.

## Continuous Integration

GitHub Actions runs linting, TypeScript checking, the Jest suite, and an
unsigned Android debug build for pushes to `main` and all pull requests via
`.github/workflows/ci.yml`.
