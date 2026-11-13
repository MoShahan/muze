/**
 * Songs-tab data hook.
 *
 * Loads persisted tracks from SQLite, applies in-screen search + sort, and
 * optionally remembers the user's sort preference. Exists so the Songs list
 * can stay in sync with scan revisions without each screen reimplementing
 * filter/sort/persistence logic.
 */
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { getTrackSort, setTrackSort } from '@/lib/db/settings';
import { listTracks, type CachedTrackRow } from '@/lib/db/tracks';
import { matchesLibraryQuery } from '@/lib/library/filter';
import { DEFAULT_TRACK_SORT, sortTracks, type TrackSortKey } from '@/lib/library/sort-tracks';

type UseLibraryTracksOptions = {
  enabled?: boolean;
  /** Bump when a scan finishes so the list reloads from SQLite. */
  revision?: number;
  query?: string;
  /** When true, load/persist sort preference in settings. Default true. */
  persistSort?: boolean;
};

export function useLibraryTracks({
  enabled = true,
  revision = 0,
  query = '',
  persistSort = true,
}: UseLibraryTracksOptions = {}) {
  const db = useSQLiteContext();
  const [tracks, setTracks] = useState<CachedTrackRow[]>([]);
  const [sortKey, setSortKeyState] = useState<TrackSortKey>(DEFAULT_TRACK_SORT);
  const [isLoading, setIsLoading] = useState(enabled);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setTracks([]);
      setIsLoading(false);
      return [] as CachedTrackRow[];
    }
    setIsLoading(true);
    try {
      const next = await listTracks(db);
      setTracks(next);
      return next;
    } finally {
      setIsLoading(false);
    }
  }, [db, enabled]);

  const setSortKey = useCallback(
    (next: TrackSortKey) => {
      setSortKeyState(next);
      if (persistSort) {
        void setTrackSort(db, next);
      }
    },
    [db, persistSort],
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (cancelled) {
        return;
      }
      if (!enabled) {
        setTracks([]);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        if (persistSort) {
          const storedSort = await getTrackSort(db);
          if (!cancelled) {
            setSortKeyState(storedSort);
          }
        }
        const next = await listTracks(db);
        if (!cancelled) {
          setTracks(next);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [db, enabled, revision, persistSort]);

  const filteredTracks = useMemo(() => {
    const filtered = tracks.filter(
      (track) =>
        matchesLibraryQuery(track.title, query) ||
        matchesLibraryQuery(track.artist, query) ||
        matchesLibraryQuery(track.album, query),
    );
    return sortTracks(filtered, sortKey);
  }, [tracks, query, sortKey]);

  return { tracks, filteredTracks, sortKey, setSortKey, isLoading, refresh };
}
