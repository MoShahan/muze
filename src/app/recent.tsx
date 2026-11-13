import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';

import { DetailActions } from '@/components/library/detail-actions';
import { LibraryBrowser } from '@/components/library/library-browser';
import { TrackListItem } from '@/components/library/track-list-item';
import { listRecentTracks } from '@/lib/db/recents';
import { type CachedTrackRow } from '@/lib/db/tracks';
import { formatDurationMs, matchesLibraryQuery } from '@/lib/library/filter';
import { playTrackList } from '@/lib/library/play-tracks';
import { usePlayback } from '@/store/playback-provider';

export default function RecentScreen() {
  const db = useSQLiteContext();
  const { playTrack, setQueue } = usePlayback();
  const [tracks, setTracks] = useState<CachedTrackRow[]>([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      setTracks(await listRecentTracks(db));
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const filteredTracks = useMemo(
    () =>
      tracks.filter(
        (track) =>
          matchesLibraryQuery(track.title, query) ||
          matchesLibraryQuery(track.artist, query) ||
          matchesLibraryQuery(track.album, query),
      ),
    [tracks, query],
  );

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
      title="Recently played"
      subtitle="Last 50 tracks you started"
      statusMessage={`${filteredTracks.length} track${filteredTracks.length === 1 ? '' : 's'}`}
      searchValue={query}
      onSearchChange={setQuery}
      searchPlaceholder="Search recently played"
      data={filteredTracks}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      emptyTitle={
        isLoading ? 'Loading…' : query.trim() ? 'No matching tracks' : 'Nothing played yet'
      }
      emptySubtitle={
        isLoading
          ? 'Reading play history.'
          : query.trim()
            ? 'Try a different search.'
            : 'Play a song from Songs, Albums, or a playlist to build this list.'
      }
      onBack={() => router.back()}
      refreshing={isLoading && tracks.length === 0}
      onRefresh={() => {
        void refresh();
      }}
      headerExtra={
        tracks.length > 0 ? (
          <View style={{ gap: 12 }}>
            <DetailActions
              disabled={tracks.length === 0}
              onPlay={() => playFrom(filteredTracks[0]?.id ?? tracks[0]?.id ?? null, false)}
              onShuffle={() => playFrom(null, true)}
            />
          </View>
        ) : null
      }
    />
  );
}
