# Muze Features

Muze is a personal Android music player built with Expo. It scans and plays audio stored on the device, including FLAC files, without copying music into the app.

## Features

### Music library

- Scan device audio files and browse songs, albums, artists, and folders.
- Edit supported embedded tags, including title, track number, artist, album, album artist, year, and genre.
- Rename audio filenames separately from song titles.
- Delete audio files after confirmation and required Android system approval.
- Sort track lists by title, artist, date added, or duration.
- Search songs, albums, artists, and playlists.
- Rescan the library and keep local metadata current.

### Playback

- Play, pause, skip, and seek with a waveform.
- Show album art and playback controls in the mini-player and now-playing screen.
- Use an album-focused vinyl-style player screen with rotation while music is playing.
- Support background playback, lock-screen controls, and media notifications.
- Support headset and Bluetooth media controls.
- Shuffle and repeat playback.
- Reorder tracks in the playback queue.
- Set a sleep timer.

### Personalization and collections

- Create and manage playlists.
- Manage Favorites and recently played tracks.
- Support system, light, and dark themes.
- Use a monochrome visual palette of dark gray and muted white, with no bright accent colors.
- Set an optional display name in Settings for the time-of-day Home greeting; it is stored locally. The default name is "Melophile".
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
