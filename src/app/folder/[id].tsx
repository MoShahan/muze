import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import { DetailActions } from '@/components/library/detail-actions';
import { LibraryBrowser } from '@/components/library/library-browser';
import { TrackListItem } from '@/components/library/track-list-item';
import { TrackSortControl } from '@/components/library/track-sort-control';
import { getFolderById, type FolderRow } from '@/lib/db/folders';
import { listTracksForFolder, type CachedTrackRow } from '@/lib/db/tracks';
import { formatDurationMs, matchesLibraryQuery } from '@/lib/library/filter';
import { playTrackList } from '@/lib/library/play-tracks';
import { DEFAULT_TRACK_SORT, sortTracks, type TrackSortKey } from '@/lib/library/sort-tracks';
import { usePlayback } from '@/store/playback-provider';

export default function FolderDetailScreen() {
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const id = typeof rawId === 'string' ? decodeURIComponent(rawId) : '';
  const db = useSQLiteContext();
  const { playTrack, setQueue } = usePlayback();
  const [folder, setFolder] = useState<FolderRow | null>(null);
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
        const nextFolder = await getFolderById(db, id);
        if (!nextFolder) {
          if (!cancelled) {
            setFolder(null);
            setTracks([]);
          }
          return;
        }
        const nextTracks = await listTracksForFolder(db, nextFolder.path);
        if (!cancelled) {
          setFolder(nextFolder);
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
  }, [db, id]);

  const filteredTracks = useMemo(() => {
    const filtered = tracks.filter(
      (track) =>
        matchesLibraryQuery(track.title, query) ||
        matchesLibraryQuery(track.artist, query) ||
        matchesLibraryQuery(track.filename, query),
    );
    return sortTracks(filtered, sortKey);
  }, [tracks, query, sortKey]);

  const playFrom = useCallback(
    (startId: string | null, shuffle = false) => {
      const source = filteredTracks.length > 0 ? filteredTracks : tracks;
      const ok = playTrackList(source, startId, { playTrack, setQueue }, { shuffle });
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
      title={folder?.name ?? (isLoading ? 'Folder' : 'Folder not found')}
      subtitle={folder?.path ?? null}
      statusMessage={
        folder ? `${filteredTracks.length} track${filteredTracks.length === 1 ? '' : 's'}` : null
      }
      searchValue={query}
      onSearchChange={setQuery}
      searchPlaceholder="Search folder tracks"
      data={filteredTracks}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      emptyTitle={isLoading ? 'Loading…' : folder ? 'No matching tracks' : 'Folder missing'}
      emptySubtitle={
        isLoading
          ? 'Reading folder from SQLite.'
          : folder
            ? 'Try a different search.'
            : 'Rescan from Songs after adding files on this device.'
      }
      onBack={() => router.back()}
      headerExtra={
        folder ? (
          <View style={{ gap: 12 }}>
            <DetailActions
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
