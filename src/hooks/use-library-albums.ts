/**
 * Albums-tab data hook.
 *
 * Reads grouped album rows from SQLite and filters them by the in-screen
 * search query. Exists so the Albums list can refresh after scans / focus
 * without duplicating query + filter wiring in the route file.
 */
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { listAlbums, type AlbumRow } from '@/lib/db/albums';
import { matchesLibraryQuery } from '@/lib/library/filter';

type UseLibraryAlbumsOptions = {
  enabled?: boolean;
  revision?: number;
  query?: string;
};

export function useLibraryAlbums({
  enabled = true,
  revision = 0,
  query = '',
}: UseLibraryAlbumsOptions = {}) {
  const db = useSQLiteContext();
  const [albums, setAlbums] = useState<AlbumRow[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setAlbums([]);
      setIsLoading(false);
      return [] as AlbumRow[];
    }
    setIsLoading(true);
    try {
      const next = await listAlbums(db);
      setAlbums(next);
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
        setAlbums([]);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const next = await listAlbums(db);
        if (!cancelled) {
          setAlbums(next);
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

  const filteredAlbums = useMemo(() => {
    return albums.filter(
      (album) =>
        matchesLibraryQuery(album.title, query) || matchesLibraryQuery(album.artist, query),
    );
  }, [albums, query]);

  return { albums, filteredAlbums, isLoading, refresh };
}
