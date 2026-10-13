# Native Android regression

Use a dedicated Android emulator. The runner clears **only the emulator's
`com.homeboxapp` app data**, seeds a test image in Pictures, and restores font
scale to 1.0 afterward. No real Homebox server or account is used. The loopback
fixture binds to 127.0.0.1:18080, accepts test/test-password, and stores everything
in memory. `adb reverse` exposes it to the emulator.

Prerequisites: Node/package install, Python 3, JDK 17, Android SDK, `adb` on PATH,
and one booted emulator (verified on Android 37 arm64). Set `JAVA_HOME` and `ANDROID_HOME` for your installation.

```sh
npm ci
cd android
./gradlew :app:assembleFieldTest :app:assembleFieldTestAndroidTest -PreactNativeArchitectures=arm64-v8a
cd ..
python3 e2e/android_flow.py --apk android/app/build/outputs/apk/fieldTest/app-fieldTest.apk
python3 e2e/android_flow.py --apk android/app/build/outputs/apk/fieldTest/app-fieldTest.apk --font-scale 2.0
python3 e2e/android_flow.py --apk android/app/build/outputs/apk/fieldTest/app-fieldTest.apk --theme dark
```

Use the appropriate React Native architecture on an x86_64 emulator. The
`fieldTest` build bundles production JavaScript with local debug signing; it
needs no Metro server or release signing credentials. The test APK uses a small
Android platform Instrumentation runner and native accessibility actions; it
adds no test SDK to the shipped app.

Assertions cover settings/login, typed creation, native photo selection and
nonempty multipart upload, editing the same entity, process restart, automatic
login, and the restored photo gallery, including a pixel check that the fixture photo renders. The fixture asserts exactly one item and
one attachment, with the edited name. Result JSON, screenshots, and native
failure output go to ignored `e2e/artifacts/`.

The flow also opens the software keyboard for location search and checks that
the search field and matching location remain visible above it. `--theme light`
(default) and `--theme dark` exercise both system theme modes. The runner restores
the prior system night-mode setting afterward.

Large-text runs exercise the same flow at 200% font scale. Unit checks also cover
button roles/busy states and required input/error announcements. This does not
substitute for a manual VoiceOver/TalkBack usability audit, iOS native automation,
or integration testing every upstream Homebox version.
