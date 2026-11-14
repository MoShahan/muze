import { type Href, router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';

import { AudioPermissionPanel } from '@/components/library/audio-permission-panel';
import { LibraryBrowser } from '@/components/library/library-browser';
import { TrackListItem } from '@/components/library/track-list-item';
import { TrackSortControl } from '@/components/library/track-sort-control';
import { AppText } from '@/components/ui/app-text';
import { NeoCard } from '@/components/ui/neo-card';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useAudioLibraryPermission } from '@/hooks/use-audio-library-permission';
import { useDisplayName } from '@/hooks/use-display-name';
import { useLibraryTracks } from '@/hooks/use-library-tracks';
import { formatHomeGreeting } from '@/lib/greeting';
import { formatDurationMs } from '@/lib/library/filter';
import { useLibraryScan } from '@/store/library-scan-provider';
import { usePlayback } from '@/store/playback-provider';

/** Default tab (Expo `index` route). Product name: Songs. */
export default function SongsScreen() {
  const { isLoading, isGranted, isUndetermined, canAskAgain, request, openSettings } =
    useAudioLibraryPermission();
  const {
    status,
    count,
    batchIndex,
    libraryCounts,
    libraryRevision,
    errorMessage,
    isScanning,
    rescan,
  } = useLibraryScan();
  const { displayName } = useDisplayName();
  const [query, setQuery] = useState('');
  const {
    filteredTracks,
    sortKey,
    setSortKey,
    isLoading: tracksLoading,
    refresh,
  } = useLibraryTracks({
    enabled: isGranted,
    revision: libraryRevision,
    query,
  });
  const { playTrack, setQueue } = usePlayback();
  const [busy, setBusy] = useState(false);
  const didAutoRequest = useRef(false);

  useEffect(() => {
    if (didAutoRequest.current || isLoading || !isUndetermined) {
      return;
    }
    didAutoRequest.current = true;
    void request();
  }, [isLoading, isUndetermined, request]);

  const onAllowAccess = async () => {
    setBusy(true);
    try {
      await request();
    } finally {
      setBusy(false);
    }
  };

  const onPressTrack = useCallback(
    (id: string) => {
      const track = filteredTracks.find((item) => item.id === id);
      if (!track) {
        return;
      }
      const queue = filteredTracks.map((item) => ({
        id: item.id,
        title: item.title,
        artist: item.artist,
        album: item.album,
        artworkUri: item.artworkPath,
        durationMs: item.durationMs,
        uri: item.uri,
      }));
      const startIndex = Math.max(
        0,
        queue.findIndex((item) => item.id === id),
      );
      setQueue(queue, startIndex);
      playTrack(queue[startIndex]);
      router.push('/player');
    },
    [filteredTracks, playTrack, setQueue],
  );

  const onLongPressTrack = useCallback((trackId: string) => {
    Alert.alert('Track', undefined, [
      {
        text: 'Edit',
        onPress: () => router.push(`/track/${encodeURIComponent(trackId)}/edit` as Href),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: (typeof filteredTracks)[number] }) => (
      <TrackListItem
        id={item.id}
        title={item.title}
        artist={item.artist}
        durationLabel={formatDurationMs(item.durationMs)}
        artworkUri={item.artworkPath}
        onPressId={onPressTrack}
        onLongPressId={onLongPressTrack}
      />
    ),
    [onPressTrack, onLongPressTrack],
  );

  const hasQuery = query.trim().length > 0;
  const scanFailed = status === 'error';
  const statusMessage = !isGranted
    ? null
    : scanFailed
      ? (errorMessage ?? 'Scan failed')
      : isScanning
        ? `Scanning… ${count} files (batch ${batchIndex + 1}) · ${filteredTracks.length} shown`
        : `${libraryCounts.tracks} songs · ${libraryCounts.albums} albums · ${libraryCounts.artists} artists`;

  const emptyTitle = tracksLoading
    ? 'Loading library…'
    : isScanning
      ? 'Finding songs…'
      : scanFailed
        ? 'Could not scan library'
        : hasQuery
          ? 'No matching songs'
          : 'No music on this device';
  const emptySubtitle =
    tracksLoading || isScanning
      ? 'First scan only: tracks appear after each batch. Short clips under 30s are skipped.'
      : scanFailed
        ? (errorMessage ?? 'Something went wrong while reading audio files. Try again.')
        : hasQuery
          ? 'Try a different title, artist, or album.'
          : 'Add songs to device storage, then pull to refresh.';

  if (isLoading) {
    return (
      <Screen contentStyle={styles.content}>
        <AppText variant="display">Songs</AppText>
        <NeoCard>
          <AppText variant="subtitle" tone="secondary">
            Checking audio permission…
          </AppText>
        </NeoCard>
      </Screen>
    );
  }

  if (!isGranted) {
    return (
      <Screen contentStyle={styles.content}>
        <AppText variant="display">Songs</AppText>
        <AudioPermissionPanel
          canAskAgain={canAskAgain}
          busy={busy}
          onAllowAccess={() => {
            void onAllowAccess();
          }}
          onOpenSettings={() => {
            void openSettings();
          }}
        />
      </Screen>
    );
  }

  return (
    <LibraryBrowser
      title="Songs"
      greeting={formatHomeGreeting(displayName)}
      statusMessage={statusMessage}
      searchValue={query}
      onSearchChange={setQuery}
      searchPlaceholder="Search songs"
      data={filteredTracks}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      emptyTitle={emptyTitle}
      emptySubtitle={emptySubtitle}
      emptyTone={scanFailed ? 'error' : 'neutral'}
      emptyActionLabel={scanFailed ? 'Try again' : undefined}
      onEmptyAction={
        scanFailed
          ? () => {
              void (async () => {
                await rescan();
                await refresh();
              })();
            }
          : undefined
      }
      refreshing={isScanning}
      onRefresh={() => {
        void (async () => {
          await rescan();
          await refresh();
        })();
      }}
      headerExtra={<TrackSortControl value={sortKey} onChange={setSortKey} />}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.three,
  },
});
