# Android App Setup - Play Store

## Overview
Capacitor-based Android app for Play Store submission.

## Files Generated

| File | Location | Description |
|------|---------|-------------|
| `et3am-release.apk` | `D:\et3am\et3am-release.apk` | Signed release APK (6.1 MB) |
| `et3am-debug.apk` | `D:\et3am\et3am-debug.apk` | Debug APK (7.1 MB) |
| `et3am-release.keystore` | `D:\et3am\et3am-release.keystore` | Signing keystore |

## Configuration

### App Package Details
- **App ID:** `com.et3am.app`
- **App Name:** ET3AM
- **Version:** 1.0.0
- **Version Code:** 1
- **Min SDK:** 24 (Android 7.0)
- **Target SDK:** 36

### Keystore Details
- **Alias:** et3am
- **Password:** changeit
- **Validity:** 10,000 days (~27 years)
- **Location:** `D:\et3am\et3am-release.keystore`

> ⚠️ **IMPORTANT:** Store keystore securely. Required for all future updates.

## Build Commands

```bash
# Required environment
export JAVA_HOME="/d/jdk-21.0.5+11"
export ANDROID_HOME="D:/Android/Sdk"
export ANDROID_SDK_ROOT="D:/Android/Sdk"

# Debug build
cd D:/et3am/frontend/android
./gradlew assembleDebug --no-daemon

# Release build
./gradlew assembleRelease -x lint -x lintVitalAnalyzeRelease --no-daemon
```

## Firebase Setup

### Required Files

| File | Purpose | Location |
|------|---------|----------|
| `google-services.json` | Android client config (Firebase) | `frontend/android/app/google-services.json` |
| `firebase-service-account.json` | Backend admin | Already exists in backend |

### Getting google-services.json

1. Go to [Firebase Console](https://console.firebase.google.com/project/foodshare777/settings)
2. Project Settings → General → Add app → Android
3. Enter package name: `com.et3am.app`
4. Download `google-services.json`
5. Place in `frontend/android/app/google-services.json`
6. Rebuild release APK

## Play Store Submission

1. Go to [Google Play Console](https://play.google.com/console)
2. Create app → App details
3. Upload `et3am-release.apk`
4. Add screenshots (phone, tablet)
5. Set content rating
6. Submit for review

### Required Screenshots
- Phone: 320×1440, 720×1280, 1080×1920, 1440×2960
- Tablet: 7" and 10" tablets
- Feature graphic: 1024×500

## Troubleshooting

### Memory Issues
If daemon crashes, increase memory in `android/gradle.properties`:
```properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=512m
```

### Missing Keystore
If keystore is lost, you must create a new app with a new package name (can't update existing).

## Project Structure

```
frontend/
├── android/           # Capacitor Android project
│   ├── app/
│   │   └── src/
│   ├── gradle/
│   └── build.gradle
├── capacitor.config.ts
└── dist/             # Built web assets
```

## Dependencies Installed

```bash
npm install @capacitor/core @capacitor/android --save --legacy-peer-deps
npm install @capacitor/cli --save-dev --legacy-peer-deps
```

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2026-04-14 | 1.0.0 | Initial release |