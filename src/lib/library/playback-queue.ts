/**
 * Pure queue helpers for shuffle / next-prev index math / reorder.
 * PlaybackProvider owns side effects (native playlist sync, resume, UI).
 */
import type { PlaybackTrack } from '@/store/playback-provider';

/**
 * Fisher–Yates shuffle of everything except the current track, which stays
 * first so enabling shuffle does not interrupt what is already playing.
 */
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

/** Move one queue item to a new index; returns a new array. */
export function moveQueueItem<T>(items: readonly T[], fromIndex: number, toIndex: number): T[] {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= items.length ||
    toIndex >= items.length
  ) {
    return [...items];
  }
  const next = [...items];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}
