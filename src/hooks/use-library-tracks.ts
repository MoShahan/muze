/**
 * Songs-tab data hook.
 *
 * Loads persisted tracks from SQLite, applies hidden-folder + search + sort,
 * and optionally remembers the user's sort preference. Exists so the Songs list
 * can stay in sync with scan / visibility revisions without each screen
 * reimplementing filter/sort/persistence logic.
 */
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getTrackSort, setTrackSort } from '@/lib/db/settings';
import { listTracks, type CachedTrackRow } from '@/lib/db/tracks';
import { matchesLibraryQuery } from '@/lib/library/filter';
import { filterTracksExcludingFolders } from '@/lib/library/hidden-folders';
import { DEFAULT_TRACK_SORT, sortTracks, type TrackSortKey } from '@/lib/library/sort-tracks';
import { useLibraryVisibility } from '@/store/library-visibility-provider';

type UseLibraryTracksOptions = {
  enabled?: boolean;
  /** Bump when a scan batch finishes so the list reloads from SQLite. */
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
  const { hiddenFolderPaths, revision: visibilityRevision } = useLibraryVisibility();
  const [tracks, setTracks] = useState<CachedTrackRow[]>([]);
  const [sortKey, setSortKeyState] = useState<TrackSortKey>(DEFAULT_TRACK_SORT);
  const [isLoading, setIsLoading] = useState(enabled);
  const hasTracksRef = useRef(false);
  const sortLoadedRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setTracks([]);
      hasTracksRef.current = false;
      setIsLoading(false);
      return [] as CachedTrackRow[];
    }
    const showSpinner = !hasTracksRef.current;
    if (showSpinner) {
      setIsLoading(true);
    }
    try {
      const next = filterTracksExcludingFolders(await listTracks(db), hiddenFolderPaths);
      setTracks(next);
      hasTracksRef.current = next.length > 0;
      return next;
    } finally {
      if (showSpinner) {
        setIsLoading(false);
      }
    }
  }, [db, enabled, hiddenFolderPaths]);

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
        hasTracksRef.current = false;
        setIsLoading(false);
        return;
      }

      // Soft reload during scan batches: keep existing rows visible (no full-screen spinner).
      const showSpinner = !hasTracksRef.current;
      if (showSpinner) {
        setIsLoading(true);
      }
      try {
        if (persistSort && !sortLoadedRef.current) {
          sortLoadedRef.current = true;
          const storedSort = await getTrackSort(db);
          if (!cancelled) {
            setSortKeyState(storedSort);
          }
        }
        const next = filterTracksExcludingFolders(await listTracks(db), hiddenFolderPaths);
        if (!cancelled) {
          setTracks(next);
          hasTracksRef.current = next.length > 0;
        }
      } finally {
        if (!cancelled && showSpinner) {
          setIsLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [db, enabled, revision, persistSort, hiddenFolderPaths, visibilityRevision]);

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
