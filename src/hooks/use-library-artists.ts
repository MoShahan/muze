/**
 * Artists-tab data hook.
 *
 * Reads artist rows from visible tracks (respecting hidden folders) and filters
 * by the in-screen search query.
 */
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { listArtists, type ArtistRow } from '@/lib/db/artists';
import { listTracks } from '@/lib/db/tracks';
import { matchesLibraryQuery } from '@/lib/library/filter';
import { artistsFromTracks, filterTracksExcludingFolders } from '@/lib/library/hidden-folders';
import { useLibraryVisibility } from '@/store/library-visibility-provider';

type UseLibraryArtistsOptions = {
  enabled?: boolean;
  revision?: number;
  query?: string;
};

async function loadVisibleArtists(
  db: Parameters<typeof listTracks>[0],
  hiddenFolderPaths: ReadonlySet<string>,
): Promise<ArtistRow[]> {
  if (hiddenFolderPaths.size === 0) {
    return listArtists(db);
  }
  const tracks = filterTracksExcludingFolders(await listTracks(db), hiddenFolderPaths);
  return artistsFromTracks(tracks);
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

  const refresh = useCallback(async () => {
    if (!enabled) {
      setArtists([]);
      setIsLoading(false);
      return [] as ArtistRow[];
    }
    setIsLoading(true);
    try {
      const next = await loadVisibleArtists(db, hiddenFolderPaths);
      setArtists(next);
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
        setArtists([]);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const next = await loadVisibleArtists(db, hiddenFolderPaths);
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
  }, [db, enabled, revision, hiddenFolderPaths, visibilityRevision]);

  const filteredArtists = useMemo(() => {
    return artists.filter((artist) => matchesLibraryQuery(artist.name, query));
  }, [artists, query]);

  return { artists, filteredArtists, isLoading, refresh };
}
