import type { PlaybackTrack } from '@/store/playback-provider';

export function shuffleTracksKeepingCurrent(
  tracks: PlaybackTrack[],
  currentId: string | null,
): PlaybackTrack[] {
  if (tracks.length <= 1) {
    return [...tracks];
  }

  const currentIndex = currentId != null ? tracks.findIndex((track) => track.id === currentId) : -1;
  const current = currentIndex >= 0 ? tracks[currentIndex] : null;
  const rest =
    currentIndex >= 0 ? tracks.filter((_, index) => index !== currentIndex) : [...tracks];

  for (let i = rest.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = rest[i];
    rest[i] = rest[j];
    rest[j] = tmp;
  }

  return current ? [current, ...rest] : rest;
}

export function nextQueueIndex(
  queueLength: number,
  currentIndex: number,
  options: { wrap: boolean },
): number | null {
  if (queueLength <= 0) {
    return null;
  }
  if (currentIndex < queueLength - 1) {
    return currentIndex + 1;
  }
  return options.wrap ? 0 : null;
}

export function previousQueueIndex(
  queueLength: number,
  currentIndex: number,
  options: { wrap: boolean },
): number | null {
  if (queueLength <= 0) {
    return null;
  }
  if (currentIndex > 0) {
    return currentIndex - 1;
  }
  return options.wrap ? queueLength - 1 : null;
}
