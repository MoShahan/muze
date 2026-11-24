/**
 * Artists-tab data hook.
 *
 * Reads artist rows from visible tracks (respecting hidden folders) and filters
 * by the in-screen search query.
 */
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { listArtists, type ArtistRow } from '@/lib/db/artists';
import { listVisibleTracks } from '@/lib/db/tracks';
import { matchesLibraryQuery } from '@/lib/library/filter';
import { artistsFromTracks } from '@/lib/library/hidden-folders';
import { useLibraryVisibility } from '@/store/library-visibility-provider';

import type { SQLiteDatabase } from 'expo-sqlite';

type UseLibraryArtistsOptions = {
  enabled?: boolean;
  revision?: number;
  query?: string;
};

async function loadVisibleArtists(
  db: SQLiteDatabase,
  hiddenFolderPaths: ReadonlySet<string>,
): Promise<ArtistRow[]> {
  if (hiddenFolderPaths.size === 0) {
    return listArtists(db);
  }
  return artistsFromTracks(await listVisibleTracks(db, hiddenFolderPaths));
}

export function useLibraryArtists({
  enabled = true,
  revision = 0,
  query = '',
}: UseLibraryArtistsOptions = {}) {
  const db = useSQLiteContext();
  const { hiddenFolderPaths, revision: visibilityRevision } = useLibraryVisibility();
  const [artists, setArtists] = useState<ArtistRow[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const hasArtistsRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setArtists([]);
      hasArtistsRef.current = false;
      setIsLoading(false);
      return [] as ArtistRow[];
    }
    const showSpinner = !hasArtistsRef.current;
    if (showSpinner) {
      setIsLoading(true);
    }
    try {
      const next = await loadVisibleArtists(db, hiddenFolderPaths);
      setArtists(next);
      hasArtistsRef.current = next.length > 0;
      return next;
    } finally {
      if (showSpinner) {
        setIsLoading(false);
      }
    }
  }, [db, enabled, hiddenFolderPaths]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (cancelled) {
        return;
      }
      if (!enabled) {
        setArtists([]);
        hasArtistsRef.current = false;
        setIsLoading(false);
        return;
      }
      const showSpinner = !hasArtistsRef.current;
      if (showSpinner) {
        setIsLoading(true);
      }
      try {
        const next = await loadVisibleArtists(db, hiddenFolderPaths);
        if (!cancelled) {
          setArtists(next);
          hasArtistsRef.current = next.length > 0;
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
  }, [db, enabled, revision, hiddenFolderPaths, visibilityRevision]);

  const filteredArtists = useMemo(() => {
    return artists.filter((artist) => matchesLibraryQuery(artist.name, query));
  }, [artists, query]);

  return { artists, filteredArtists, isLoading, refresh };
}
