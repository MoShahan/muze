/**
 * Albums-tab data hook.
 *
 * Reads album rows from visible tracks (respecting hidden folders) and filters
 * by the in-screen search query.
 */
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { listAlbums, type AlbumRow } from '@/lib/db/albums';
import { listVisibleTracks } from '@/lib/db/tracks';
import { matchesLibraryQuery } from '@/lib/library/filter';
import { albumsFromTracks } from '@/lib/library/hidden-folders';
import { useLibraryVisibility } from '@/store/library-visibility-provider';

import type { SQLiteDatabase } from 'expo-sqlite';

type UseLibraryAlbumsOptions = {
  enabled?: boolean;
  revision?: number;
  query?: string;
};

async function loadVisibleAlbums(
  db: SQLiteDatabase,
  hiddenFolderPaths: ReadonlySet<string>,
): Promise<AlbumRow[]> {
  if (hiddenFolderPaths.size === 0) {
    return listAlbums(db);
  }
  // Precomputed albums table includes hidden folders - rebuild counts from visible tracks only.
  return albumsFromTracks(await listVisibleTracks(db, hiddenFolderPaths));
}

export function useLibraryAlbums({
  enabled = true,
  revision = 0,
  query = '',
}: UseLibraryAlbumsOptions = {}) {
  const db = useSQLiteContext();
  const { hiddenFolderPaths, revision: visibilityRevision } = useLibraryVisibility();
  const [albums, setAlbums] = useState<AlbumRow[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const hasAlbumsRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setAlbums([]);
      hasAlbumsRef.current = false;
      setIsLoading(false);
      return [] as AlbumRow[];
    }
    const showSpinner = !hasAlbumsRef.current;
    if (showSpinner) {
      setIsLoading(true);
    }
    try {
      const next = await loadVisibleAlbums(db, hiddenFolderPaths);
      setAlbums(next);
      hasAlbumsRef.current = next.length > 0;
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
        setAlbums([]);
        hasAlbumsRef.current = false;
        setIsLoading(false);
        return;
      }
      const showSpinner = !hasAlbumsRef.current;
      if (showSpinner) {
        setIsLoading(true);
      }
      try {
        const next = await loadVisibleAlbums(db, hiddenFolderPaths);
        if (!cancelled) {
          setAlbums(next);
          hasAlbumsRef.current = next.length > 0;
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

  const filteredAlbums = useMemo(() => {
    return albums.filter(
      (album) =>
        matchesLibraryQuery(album.title, query) || matchesLibraryQuery(album.artist, query),
    );
  }, [albums, query]);

  return { albums, filteredAlbums, isLoading, refresh };
}
