/**
 * Albums-tab data hook.
 *
 * Reads album rows from visible tracks (respecting hidden folders) and filters
 * by the in-screen search query.
 */
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { listAlbums, type AlbumRow } from '@/lib/db/albums';
import { listTracks } from '@/lib/db/tracks';
import { matchesLibraryQuery } from '@/lib/library/filter';
import { albumsFromTracks, filterTracksExcludingFolders } from '@/lib/library/hidden-folders';
import { useLibraryVisibility } from '@/store/library-visibility-provider';

type UseLibraryAlbumsOptions = {
  enabled?: boolean;
  revision?: number;
  query?: string;
};

async function loadVisibleAlbums(
  db: Parameters<typeof listTracks>[0],
  hiddenFolderPaths: ReadonlySet<string>,
): Promise<AlbumRow[]> {
  if (hiddenFolderPaths.size === 0) {
    return listAlbums(db);
  }
  const tracks = filterTracksExcludingFolders(await listTracks(db), hiddenFolderPaths);
  return albumsFromTracks(tracks);
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

  const refresh = useCallback(async () => {
    if (!enabled) {
      setAlbums([]);
      setIsLoading(false);
      return [] as AlbumRow[];
    }
    setIsLoading(true);
    try {
      const next = await loadVisibleAlbums(db, hiddenFolderPaths);
      setAlbums(next);
      return next;
    } finally {
      setIsLoading(false);
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
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const next = await loadVisibleAlbums(db, hiddenFolderPaths);
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
  }, [db, enabled, revision, hiddenFolderPaths, visibilityRevision]);

  const filteredAlbums = useMemo(() => {
    return albums.filter(
      (album) =>
        matchesLibraryQuery(album.title, query) || matchesLibraryQuery(album.artist, query),
    );
  }, [albums, query]);

  return { albums, filteredAlbums, isLoading, refresh };
}
