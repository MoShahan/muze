import { shuffleTracksKeepingCurrent } from '@/lib/library/playback-queue';

import type { CachedTrackRow } from '@/lib/db/tracks';
import type { PlaybackTrack } from '@/store/playback-provider';

type PlaybackSetters = {
  playTrack: (track: PlaybackTrack) => void;
  setQueue: (tracks: PlaybackTrack[], startIndex?: number) => void;
};

export function toPlaybackTrack(track: CachedTrackRow): PlaybackTrack {
  return {
    id: track.id,
    title: track.title,
    artist: track.artist,
    album: track.album,
    artworkUri: track.artworkPath,
    durationMs: track.durationMs,
    uri: track.uri,
  };
}

/** Queue tracks and start real playback of the selected (or first) track. */
export function playTrackList(
  tracks: CachedTrackRow[],
  startId: string | null,
  setters: PlaybackSetters,
  options?: { shuffle?: boolean },
): boolean {
  if (tracks.length === 0) {
    return false;
  }

  const playbackTracks = tracks.map(toPlaybackTrack);
  const queueTracks = options?.shuffle
    ? shuffleTracksKeepingCurrent(playbackTracks, startId)
    : playbackTracks;
  const foundIndex = startId != null ? queueTracks.findIndex((track) => track.id === startId) : 0;
  const startIndex = foundIndex >= 0 ? foundIndex : 0;
  const current = queueTracks[startIndex] ?? queueTracks[0];

  setters.setQueue(queueTracks, startIndex);
  setters.playTrack(current);
  return true;
}
