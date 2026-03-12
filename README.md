# HomeboxApp

React Native client for a self-hosted Homebox server.

## Requirements

- Node.js 22
- npm 10+
- Xcode for iOS builds
- Android Studio for Android builds
- A reachable Homebox server over `https://`, or `http://` on local/private hosts only

## Getting Started

```bash
npm install --legacy-peer-deps
npm start
```

In a second terminal, launch the platform app:

```bash
npm run android
# or
npm run ios
```

## Quality Checks

```bash
npm run lint
npm test -- --runInBand
```

## Server Security

- Saved server passwords are stored in the device keychain, not AsyncStorage.
- Hosts without a scheme default to `https://`.
- Plain `http://` is only allowed for local/private hosts such as `localhost`, `.local`, and RFC1918 IPs.

## Android Release Setup

Release builds now require a real keystore. Export these values before running a release build:

```bash
export HOMEBOX_RELEASE_STORE_FILE=/absolute/path/to/homebox-release.keystore
export HOMEBOX_RELEASE_STORE_PASSWORD=your-store-password
export HOMEBOX_RELEASE_KEY_ALIAS=your-key-alias
export HOMEBOX_RELEASE_KEY_PASSWORD=your-key-password
```

Then build the release artifact from `android/` with your usual Gradle command.

## Continuous Integration

GitHub Actions runs `lint` and `test` for pushes to `main` and all pull requests via `.github/workflows/ci.yml`.
