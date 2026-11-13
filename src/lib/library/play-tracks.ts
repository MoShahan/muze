import type { CachedTrackRow } from '@/lib/db/tracks';
import type { PlaybackTrack } from '@/store/playback-provider';

type PlaybackSetters = {
  setCurrentTrack: (track: PlaybackTrack | null) => void;
  setQueue: (trackIds: string[], startIndex?: number) => void;
};

function toPlaybackTrack(track: CachedTrackRow): PlaybackTrack {
  return {
    id: track.id,
    title: track.title,
    artist: track.artist,
    album: track.album,
    artworkUri: track.artworkPath,
    durationMs: track.durationMs,
  };
}

function shuffleIds(ids: string[]): string[] {
  const next = [...ids];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = next[i];
    next[i] = next[j];
    next[j] = tmp;
  }
  return next;
}

/** Queue tracks into the playback shell (real audio wiring is Phase 4). */
export function playTrackList(
  tracks: CachedTrackRow[],
  startId: string | null,
  setters: PlaybackSetters,
  options?: { shuffle?: boolean },
): boolean {
  if (tracks.length === 0) {
    return false;
  }

  const ids = tracks.map((track) => track.id);
  const queueIds = options?.shuffle ? shuffleIds(ids) : ids;
  const startIndex =
    startId != null
      ? Math.max(
          0,
          queueIds.findIndex((id) => id === startId),
        )
      : 0;
  const current = tracks.find((track) => track.id === queueIds[startIndex]) ?? tracks[0];

  setters.setCurrentTrack(toPlaybackTrack(current));
  setters.setQueue(queueIds, startIndex);
  return true;
}
