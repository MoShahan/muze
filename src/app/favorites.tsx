import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';

import { DetailActions } from '@/components/library/detail-actions';
import { LibraryBrowser } from '@/components/library/library-browser';
import { TrackListItem } from '@/components/library/track-list-item';
import { TrackSortControl } from '@/components/library/track-sort-control';
import { listFavoriteTracks } from '@/lib/db/favorites';
import { type CachedTrackRow } from '@/lib/db/tracks';
import { formatDurationMs, matchesLibraryQuery } from '@/lib/library/filter';
import { playTrackList } from '@/lib/library/play-tracks';
import { DEFAULT_TRACK_SORT, sortTracks, type TrackSortKey } from '@/lib/library/sort-tracks';
import { usePlayback } from '@/store/playback-provider';

export default function FavoritesScreen() {
  const db = useSQLiteContext();
  const { playTrack, setQueue } = usePlayback();
  const [tracks, setTracks] = useState<CachedTrackRow[]>([]);
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<TrackSortKey>(DEFAULT_TRACK_SORT);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      setTracks(await listFavoriteTracks(db));
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const filteredTracks = useMemo(() => {
    const filtered = tracks.filter(
      (track) =>
        matchesLibraryQuery(track.title, query) ||
        matchesLibraryQuery(track.artist, query) ||
        matchesLibraryQuery(track.album, query),
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
      title="Favorites"
      subtitle="Liked from now-playing"
      statusMessage={`${filteredTracks.length} track${filteredTracks.length === 1 ? '' : 's'}`}
      searchValue={query}
      onSearchChange={setQuery}
      searchPlaceholder="Search favorites"
      data={filteredTracks}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      emptyTitle={
        isLoading ? 'Loading…' : query.trim() ? 'No matching favorites' : 'No favorites yet'
      }
      emptySubtitle={
        isLoading
          ? 'Reading liked tracks.'
          : query.trim()
            ? 'Try a different search.'
            : 'Tap the heart on the now-playing screen to save a track here.'
      }
      onBack={() => router.back()}
      refreshing={isLoading && tracks.length === 0}
      onRefresh={() => {
        void refresh();
      }}
      headerExtra={
        <View style={{ gap: 12 }}>
          <DetailActions
            disabled={tracks.length === 0}
            onPlay={() => playFrom(filteredTracks[0]?.id ?? tracks[0]?.id ?? null, false)}
            onShuffle={() => playFrom(null, true)}
          />
          <TrackSortControl value={sortKey} onChange={setSortKey} />
        </View>
      }
    />
  );
}
