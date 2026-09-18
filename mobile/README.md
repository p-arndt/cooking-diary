# Kochtagebuch – native app

Native Android and iOS client for the Cooking Diary web app, built with
[Kotlin Multiplatform](https://www.jetbrains.com/help/kotlin-multiplatform-dev/get-started.html),
[Compose Multiplatform](https://kotlinlang.org/compose-multiplatform/) and the
[Kotlin Toolchain](https://kotlin-toolchain.org/dev/). The UI mirrors the web redesign: warm cream
canvas, white cards, amber primary, tomato accent, Plus Jakarta Sans and the same Lucide icons.

## Features

- **Login / registration** with email + password against the web app's better-auth
  (same accounts as the web). The server URL is editable on the login screen; URL and session
  token are persisted on the device.
- **Tagebuch** – greeting, "Was soll ich heute kochen?" shuffle over `/api/v1/suggestions`,
  stat tiles, timeline grouped by day with infinite scroll and pull-to-refresh, edit/delete per entry.
- **Gerichte** – searchable photo grid, detail page with photo hero, time/difficulty/category
  chips and cooking history, create/edit/delete meals incl. categories and photo.
- **"+" in the tab bar** – add an entry: search a meal (or create it inline), today/yesterday/any
  date, photo (picked, downscaled to JPEG and uploaded), notes.
- **Analysen** – stat tiles, most active weekday, entries per month, favourite meals, categories.
- **Einstellungen** – suggestion settings (days threshold, weekday preference, excluded
  categories), category management, sign out.
- German and English UI (follows the system language), light and dark theme.

## Prerequisites

The app talks to the SvelteKit server's JSON API (`/api/v1/*`, bearer-token auth). In the
repository root:

```bash
pnpm run db:start   # Postgres via docker compose
pnpm db:seed        # demo account: demo@example.com / demo1234
pnpm dev            # http://localhost:5173
```

The debug defaults are `http://10.0.2.2:5173` on the Android emulator (the emulator's alias for
the host's `127.0.0.1`) and `http://localhost:5173` on the iOS simulator. The dev server therefore
has to listen on IPv4 loopback — on macOS Node resolves `localhost` to `::1` only. `just doctor`
checks this. Release builds default to the production server instead (see below).

## Running

Android (uses the `justfile`, run `just` for all recipes):

```bash
just android   # starts the "default" AVD if no device is attached, builds, installs, launches
just build     # debug APK only
just release   # signed release bundle (.aab) for Google Play, see below
just test      # shared unit tests on the host JVM
just logcat    # follow the app's log
just doctor    # show SDK/JDK/AVD/dev-server status
```

iOS (needs Xcode):

```bash
xcrun simctl list devices available                          # pick a simulator UDID
./kotlin run -m iosApp -p iosSimulatorArm64 -d <simulator-udid>
```

Alternatively open `iosApp/module.xcodeproj` in Xcode.

The `kotlin` wrapper downloads the pinned toolchain (and a JDK) on first use.

## Releasing to Google Play

Release builds talk to `https://cooking-diary.allthing.eu` by default (`PRODUCTION_SERVER_URL` in
`shared/src/data/SessionStore.kt`); debug builds keep using the local dev server. Plain http is only
allowed for local dev hosts (`androidApp/res/xml/network_security_config.xml`).

1. Once: create the upload key, then copy `androidApp/keystore.properties.example` to
   `androidApp/keystore.properties` and fill in the path and password. Both stay out of git; back up
   the keystore and its password.
   ```bash
   keytool -genkeypair -v -keystore ~/keystores/cooking-diary-upload.jks \
     -storetype PKCS12 -keyalg RSA -keysize 2048 -validity 10000 -alias upload
   ```
2. Bump `versionCode` (and usually `versionName`) in `androidApp/module.yaml` for every upload.
3. `just release` builds the signed bundle `build/release/cooking-diary-<versionName>-<versionCode>.aab`.
4. Upload it in the Play Console with Play App Signing enabled (the default), so the key above is only
   the upload key and can be reset by Google if it gets lost.

Store listing assets are in `store/`: `icon-512.png` and `feature-graphic-1024x500.png`.

## Structure

- [`shared/`](./shared) – everything shared: Compose UI, API client, state.
  - `src/data` – `ApiClient` (Ktor + kotlinx.serialization), DTOs, `SessionStore`
    (multiplatform-settings: SharedPreferences / NSUserDefaults).
  - `src/state` – per-session stores for the tab screens (cached across tab switches,
    refreshed after mutations).
  - `src/ui` – theme (tokens converted from the web's `app.css`), components, screens,
    a small back-stack navigator and the generated `Lucide` icon set.
  - `composeResources` – strings (`values` = German, `values-en`), Plus Jakarta Sans, logo.
  - `src@android` / `src@ios` – platform bits (default server URL, system back handling).
- [`androidApp/`](./androidApp) – Android entry point, manifest, launcher icons.
- [`iosApp/`](./iosApp) – SwiftUI host and Xcode project.

Photos are server-relative URLs (`/files/…`); Coil loads them through the same Ktor client, which
attaches the bearer token only for requests to the configured server.

Library versions are pinned to ones built against Compose Multiplatform 1.11 (Coil 3.5,
FileKit 0.15); newer releases pull in Compose 1.12 and crash at runtime against Material3 1.11.
