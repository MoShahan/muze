import type { CachedTrackRow } from '@/lib/db/tracks';

export type TrackSortKey = 'title' | 'artist' | 'dateAdded' | 'duration';
export type TrackSortDirection = 'asc' | 'desc';

export const TRACK_SORT_OPTIONS: { key: TrackSortKey; label: string }[] = [
  { key: 'title', label: 'Title' },
  { key: 'artist', label: 'Artist' },
  { key: 'dateAdded', label: 'Date added' },
  { key: 'duration', label: 'Duration' },
];

export const DEFAULT_TRACK_SORT: TrackSortKey = 'title';
export const DEFAULT_TRACK_SORT_DIRECTION: TrackSortDirection = 'asc';

const SORT_KEYS = new Set<TrackSortKey>(TRACK_SORT_OPTIONS.map((option) => option.key));

export function isTrackSortKey(value: string | null | undefined): value is TrackSortKey {
  return value != null && SORT_KEYS.has(value as TrackSortKey);
}

export function isTrackSortDirection(
  value: string | null | undefined,
): value is TrackSortDirection {
  return value === 'asc' || value === 'desc';
}

/** Date added defaults to newest-first; everything else A-Z / short-to-long. */
export function defaultDirectionForSortKey(sortKey: TrackSortKey): TrackSortDirection {
  return sortKey === 'dateAdded' ? 'desc' : 'asc';
}

/** Human-readable sort label including direction (shown in the dropdown + trigger). */
export function trackSortOptionLabel(sortKey: TrackSortKey, direction: TrackSortDirection): string {
  switch (sortKey) {
    case 'artist':
      return direction === 'asc' ? 'Artist A to Z' : 'Artist Z to A';
    case 'dateAdded':
      return direction === 'desc' ? 'Date added · Newest' : 'Date added · Oldest';
    case 'duration':
      return direction === 'asc' ? 'Duration · Shortest first' : 'Duration · Longest first';
    case 'title':
    default:
      return direction === 'asc' ? 'Title A to Z' : 'Title Z to A';
  }
}

function compareText(a: string, b: string): number {
  return a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true });
}

/** Stable secondary keys keep the list predictable when the primary field ties. */
export function sortTracks(
  tracks: readonly CachedTrackRow[],
  sortKey: TrackSortKey,
  direction: TrackSortDirection = defaultDirectionForSortKey(sortKey),
): CachedTrackRow[] {
  const sorted = [...tracks];
  const directionFactor = direction === 'asc' ? 1 : -1;

  sorted.sort((left, right) => {
    let result = 0;
    switch (sortKey) {
      case 'artist': {
        const byArtist = compareText(left.artist, right.artist);
        result = byArtist !== 0 ? byArtist : compareText(left.title, right.title);
        break;
      }
      case 'dateAdded': {
        // Prefer device-add time; fall back to file mtime for older/null rows.
        const leftDate = left.dateAdded ?? left.sourceModifiedAt ?? 0;
        const rightDate = right.dateAdded ?? right.sourceModifiedAt ?? 0;
        // Asc = oldest first; default direction for this key is desc (newest first).
        result =
          leftDate !== rightDate ? leftDate - rightDate : compareText(left.title, right.title);
        break;
      }
      case 'duration': {
        result =
          left.durationMs !== right.durationMs
            ? left.durationMs - right.durationMs
            : compareText(left.title, right.title);
        break;
      }
      case 'title':
      default: {
        const byTitle = compareText(left.title, right.title);
        result = byTitle !== 0 ? byTitle : compareText(left.artist, right.artist);
        break;
      }
    }
    return result * directionFactor;
  });
  return sorted;
}
