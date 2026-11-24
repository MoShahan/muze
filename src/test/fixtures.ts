import type { CachedTrackRow } from '@/lib/db/tracks';
import type { PlaybackTrack } from '@/store/playback-provider';

/** Build a CachedTrackRow with sensible defaults for unit tests. */
export function makeTrack(overrides: Partial<CachedTrackRow> = {}): CachedTrackRow {
  const id = overrides.id ?? 'track-1';
  return {
    id,
    uri: overrides.uri ?? `file:///music/${id}.flac`,
    filename: overrides.filename ?? `${id}.flac`,
    title: overrides.title ?? 'Song One',
    artist: overrides.artist ?? 'Artist One',
    album: overrides.album ?? 'Album One',
    albumArtist: overrides.albumArtist ?? null,
    trackNumber: overrides.trackNumber ?? 1,
    year: overrides.year ?? 2020,
    genre: overrides.genre ?? 'Rock',
    durationMs: overrides.durationMs ?? 180_000,
    artworkPath: overrides.artworkPath !== undefined ? overrides.artworkPath : '',
    folderPath: overrides.folderPath !== undefined ? overrides.folderPath : 'Music/Album One',
    dateAdded: overrides.dateAdded !== undefined ? overrides.dateAdded : 1_700_000_000_000,
    sourceModifiedAt:
      overrides.sourceModifiedAt !== undefined ? overrides.sourceModifiedAt : 1_700_000_100_000,
    updatedAt: overrides.updatedAt ?? 1_700_000_200_000,
  };
}

/** Build a PlaybackTrack for queue / shuffle tests. */
export function makePlaybackTrack(overrides: Partial<PlaybackTrack> = {}): PlaybackTrack {
  const id = overrides.id ?? 'track-1';
  return {
    id,
    title: overrides.title ?? 'Song One',
    artist: overrides.artist ?? 'Artist One',
    album: overrides.album ?? 'Album One',
    artworkUri: overrides.artworkUri ?? null,
    durationMs: overrides.durationMs ?? 180_000,
    uri: overrides.uri ?? `file:///music/${id}.flac`,
  };
}
