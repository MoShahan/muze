import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import { DetailHero } from '@/components/library/detail-hero';
import { LibraryBrowser } from '@/components/library/library-browser';
import { TrackListItem } from '@/components/library/track-list-item';
import { TrackSortControl } from '@/components/library/track-sort-control';
import { getAlbumById, type AlbumRow } from '@/lib/db/albums';
import { listTracksForAlbum, type CachedTrackRow } from '@/lib/db/tracks';
import { formatDurationMs, matchesLibraryQuery } from '@/lib/library/filter';
import { filterTracksExcludingFolders } from '@/lib/library/hidden-folders';
import { playTrackList } from '@/lib/library/play-tracks';
import { DEFAULT_TRACK_SORT, sortTracks, type TrackSortKey } from '@/lib/library/sort-tracks';
import { useLibraryVisibility } from '@/store/library-visibility-provider';
import { usePlayback } from '@/store/playback-provider';

export default function AlbumDetailScreen() {
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const id = typeof rawId === 'string' ? decodeURIComponent(rawId) : '';
  const db = useSQLiteContext();
  const { hiddenFolderPaths, revision: visibilityRevision } = useLibraryVisibility();
  const { playTrack, setQueue } = usePlayback();
  const [album, setAlbum] = useState<AlbumRow | null>(null);
  const [tracks, setTracks] = useState<CachedTrackRow[]>([]);
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<TrackSortKey>(DEFAULT_TRACK_SORT);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (cancelled || !id) {
        return;
      }
      setIsLoading(true);
      try {
        const nextAlbum = await getAlbumById(db, id);
        if (!nextAlbum) {
          if (!cancelled) {
            setAlbum(null);
            setTracks([]);
          }
          return;
        }
        const nextTracks = filterTracksExcludingFolders(
          await listTracksForAlbum(db, nextAlbum.title, nextAlbum.artist),
          hiddenFolderPaths,
        );
        if (!cancelled) {
          setAlbum(nextAlbum);
          setTracks(nextTracks);
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
  }, [db, id, hiddenFolderPaths, visibilityRevision]);

  const filteredTracks = useMemo(() => {
    const filtered = tracks.filter(
      (track) =>
        matchesLibraryQuery(track.title, query) || matchesLibraryQuery(track.artist, query),
    );
    return sortTracks(filtered, sortKey);
  }, [tracks, query, sortKey]);

  const playFrom = useCallback(
    (startId: string | null, shuffle = false) => {
      const ok = playTrackList(
        filteredTracks.length > 0 ? filteredTracks : tracks,
        startId,
        {
          playTrack,
          setQueue,
        },
        { shuffle },
      );
      if (ok) {
        router.push('/player');
      }
    },
    [filteredTracks, tracks, playTrack, setQueue],
  );

  const onPressTrack = useCallback(
    (trackId: string) => {
      playFrom(trackId, false);
    },
    [playFrom],
  );

  const renderItem = useCallback(
    ({ item }: { item: CachedTrackRow }) => (
      <TrackListItem
        id={item.id}
        title={item.title}
        artist={item.artist}
        durationLabel={formatDurationMs(item.durationMs)}
        artworkUri={item.artworkPath}
        onPressId={onPressTrack}
      />
    ),
    [onPressTrack],
  );

  return (
    <LibraryBrowser
      title={album?.title ?? (isLoading ? 'Album' : 'Album not found')}
      subtitle={album ? album.artist : null}
      statusMessage={
        album ? `${filteredTracks.length} track${filteredTracks.length === 1 ? '' : 's'}` : null
      }
      searchValue={query}
      onSearchChange={setQuery}
      searchPlaceholder="Search album tracks"
      data={filteredTracks}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      emptyTitle={isLoading ? 'Loading…' : album ? 'No matching tracks' : 'Album missing'}
      emptySubtitle={
        isLoading
          ? 'Reading album from SQLite.'
          : album
            ? 'Try a different search.'
            : 'This album is no longer in the library. Rescan from Songs.'
      }
      onBack={() => router.back()}
      headerExtra={
        album ? (
          <View style={{ gap: 12 }}>
            <DetailHero
              artworkUri={album.artworkPath}
              disabled={tracks.length === 0}
              onPlay={() => playFrom(filteredTracks[0]?.id ?? tracks[0]?.id ?? null, false)}
              onShuffle={() => playFrom(null, true)}
            />
            <TrackSortControl value={sortKey} onChange={setSortKey} />
          </View>
        ) : null
      }
    />
  );
}
