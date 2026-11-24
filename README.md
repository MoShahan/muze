# Muze

A personal Android music player built with Expo. Muze scans and plays audio stored on the device; it does not copy music into the app.

- See [Features.md](./Features.md) for features, out-of-scope items, and optional future Google Play release steps.

## Android home-screen widget

Muze ships a **Muze** home-screen widget (`MuzeNowPlaying`) with album art, title/artist, and Prev / Play-Pause / Next controls.

| Piece                                     | Location                                                                                               |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Layout (`expo-widgets` + Jetpack Compose) | `src/widgets/muze-now-playing.tsx`                                                                     |
| Playback → widget sync + tap handling     | `src/lib/widgets/muze-now-playing-bridge.ts`, `src/components/player/muze-now-playing-widget-sync.tsx` |
| Config plugin                             | `expo-widgets` in `app.json` (`enableAndroid: true`)                                                   |

Requirements:

- **Development or release build** - not Expo Go (`expo-widgets` is native).
- After changing widget config or layout registration, rebuild native (`npx expo run:android` or EAS).
- Add it from the launcher: long-press home screen → Widgets → **Muze**.
- Transport taps apply while the Muze process is alive (including background playback); the app pushes live snapshots when the track or play state changes.

Details: [Features.md](./Features.md) (Playback).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **src/app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## EAS Build

This project is linked to EAS as [@moshahan/muze](https://expo.dev/accounts/moshahan/projects/muze).

### Create a build

```bash
# Development build (includes expo-dev-client)
npx eas-cli build --platform android --profile development

# Internal preview APK (no dev client)
npx eas-cli build --platform android --profile preview

# Personal release APK (sideload; not Play Store AAB)
npx eas-cli build --platform android --profile production
```

### Install on your Android phone

1. Wait until the build finishes on [expo.dev](https://expo.dev/accounts/moshahan/projects/muze/builds).
2. Open the finished build page on your phone (same Expo account), or scan the QR code shown in the terminal / build page.
3. Tap **Install** and allow installs from the browser if Android asks.
4. Open **Muze** from the app drawer.

You can also download the `.apk` from the build page on a computer, copy it to the phone, and open it to install.

Optional later: after a production build, `npx eas-cli submit` can upload the app to app stores.

## Learn more

- [Expo documentation](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
