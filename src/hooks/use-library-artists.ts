/**
 * Artists-tab data hook.
 *
 * Reads grouped artist rows from SQLite and filters them by the in-screen
 * search query. Exists so the Artists list can refresh after scans / focus
 * without duplicating query + filter wiring in the route file.
 */
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { listArtists, type ArtistRow } from '@/lib/db/artists';
import { matchesLibraryQuery } from '@/lib/library/filter';

type UseLibraryArtistsOptions = {
  enabled?: boolean;
  revision?: number;
  query?: string;
};

export function useLibraryArtists({
  enabled = true,
  revision = 0,
  query = '',
}: UseLibraryArtistsOptions = {}) {
  const db = useSQLiteContext();
  const [artists, setArtists] = useState<ArtistRow[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setArtists([]);
      setIsLoading(false);
      return [] as ArtistRow[];
    }
    setIsLoading(true);
    try {
      const next = await listArtists(db);
      setArtists(next);
      return next;
    } finally {
      setIsLoading(false);
    }
  }, [db, enabled]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (cancelled) {
        return;
      }
      if (!enabled) {
        setArtists([]);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const next = await listArtists(db);
        if (!cancelled) {
          setArtists(next);
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
  }, [db, enabled, revision]);

  const filteredArtists = useMemo(() => {
    return artists.filter((artist) => matchesLibraryQuery(artist.name, query));
  }, [artists, query]);

  return { artists, filteredArtists, isLoading, refresh };
}
