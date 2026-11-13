import type { CachedTrackRow } from '@/lib/db/tracks';

export type TrackSortKey = 'title' | 'artist' | 'dateAdded' | 'duration';

export const TRACK_SORT_OPTIONS: { key: TrackSortKey; label: string }[] = [
  { key: 'title', label: 'Title' },
  { key: 'artist', label: 'Artist' },
  { key: 'dateAdded', label: 'Date added' },
  { key: 'duration', label: 'Duration' },
];

export const DEFAULT_TRACK_SORT: TrackSortKey = 'title';

const SORT_KEYS = new Set<TrackSortKey>(TRACK_SORT_OPTIONS.map((option) => option.key));

export function isTrackSortKey(value: string | null | undefined): value is TrackSortKey {
  return value != null && SORT_KEYS.has(value as TrackSortKey);
}

function compareText(a: string, b: string): number {
  return a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true });
}

/** Stable secondary keys keep the list predictable when the primary field ties. */
export function sortTracks(
  tracks: readonly CachedTrackRow[],
  sortKey: TrackSortKey,
): CachedTrackRow[] {
  const sorted = [...tracks];
  sorted.sort((left, right) => {
    switch (sortKey) {
      case 'artist': {
        const byArtist = compareText(left.artist, right.artist);
        if (byArtist !== 0) {
          return byArtist;
        }
        return compareText(left.title, right.title);
      }
      case 'dateAdded': {
        const leftDate = left.dateAdded ?? 0;
        const rightDate = right.dateAdded ?? 0;
        if (leftDate !== rightDate) {
          // Newest first for "date added".
          return rightDate - leftDate;
        }
        return compareText(left.title, right.title);
      }
      case 'duration': {
        if (left.durationMs !== right.durationMs) {
          return left.durationMs - right.durationMs;
        }
        return compareText(left.title, right.title);
      }
      case 'title':
      default: {
        const byTitle = compareText(left.title, right.title);
        if (byTitle !== 0) {
          return byTitle;
        }
        return compareText(left.artist, right.artist);
      }
    }
  });
  return sorted;
}
