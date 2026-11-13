# Muze Features

Muze is a personal Android music player built with Expo. It scans and plays audio stored on the device, including FLAC files, without copying music into the app.

## Features

### Music library

- Scan device audio files and browse on dedicated **Songs**, **Albums**, **Artists**, and **Playlists** screens (Songs is the default tab; no Home tab). Folder browsing remains available via a stack route.
- Edit track details with separate fields: disk **filename** (renames the file on storage) vs embedded **metadata** (title, artist, album, album artist, track number, year, genre). Changing the title does not rename the file; renaming the file does not change the title tag.
- Both filename rename and metadata edit are supported and independent.
- Delete audio files after confirmation and required Android system approval.
- Sort track lists by title, artist, date added, or duration.
- Search in place on each list screen (top search filters that page’s content only—e.g. Albums searches albums). No separate global search page.
- Rescan the library and keep local metadata current.
- Album detail uses a large full-bleed album-art hero with icon-only Play / Shuffle / Sort over a light scrim (planned; see `@docs/PROJECT_PLAN.md` Section 4.2.1). Artists list and artist detail show the artist name only (no artist image; tags only provide album art).

### Playback

- Play, pause, skip, and seek with a waveform.
- Show album art and playback controls in the mini-player and now-playing screen.
- Remember the last played song and its exact position; on app open show it in the mini-player at that timestamp (paused, ready to continue).
- Use an album-focused vinyl-style player screen with rotation while music is playing.
- Support background playback, lock-screen controls, and media notifications (including OEM Dynamic Island-style media capsules such as on Vivo / OriginOS when the system surfaces media sessions).
- Support headset and Bluetooth media controls.
- Shuffle and repeat playback.
- Reorder tracks in the playback queue.
- Set a sleep timer.
- Provide an Android home-screen media widget for quick controls.

### Personalization and collections

- Create and manage playlists on a dedicated Playlists screen.
- Manage Favorites and recently played tracks (without a separate Home hub).
- Support system, light, and dark themes.
- Use a monochrome visual palette of dark gray and muted white, with no bright accent colors.
- Set an optional display name in Settings (default "Melophile"); editing opens a modal with a text field and a Save button. If a greeting is useful, it may appear as compact header copy on Songs.
- Use a neomorphic visual style.

## Out of scope for v1

- Streaming, accounts, social features, or cloud sync
- Lyrics, equalizer, radio, video, podcasts, or recording
- Copying audio files into the app

## Optional future Google Play release

The current distribution target is a personal Android APK. If Play Store publishing becomes a goal:

1. Review the current Expo EAS Submit and Google Play Console requirements.
2. Confirm the permanent Android application ID, app versioning, production EAS profile, and signing credentials.
3. Configure required privacy disclosures, permissions, data-safety details, content rating, and store listing assets.
4. Build a production Android App Bundle (`.aab`) with EAS.
5. Upload it to a Play Console internal testing track and verify installation, updates, permissions, and playback.
6. Complete Google Play review requirements before promoting the release to production.
