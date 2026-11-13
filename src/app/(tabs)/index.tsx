import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';

import { AudioPermissionPanel } from '@/components/library/audio-permission-panel';
import { LibraryBrowser } from '@/components/library/library-browser';
import { TrackListItem } from '@/components/library/track-list-item';
import { TrackSortControl } from '@/components/library/track-sort-control';
import { AppText } from '@/components/ui/app-text';
import { NeoCard } from '@/components/ui/neo-card';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useAudioLibraryPermission } from '@/hooks/use-audio-library-permission';
import { useAudioLibraryScan } from '@/hooks/use-audio-library-scan';
import { useDisplayName } from '@/hooks/use-display-name';
import { useLibraryTracks } from '@/hooks/use-library-tracks';
import { formatHomeGreeting } from '@/lib/greeting';
import { formatDurationMs } from '@/lib/library/filter';
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
  } = useAudioLibraryScan({
    enabled: isGranted,
  });
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
  const { setCurrentTrack, setQueue } = usePlayback();
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
      setCurrentTrack({
        id: track.id,
        title: track.title,
        artist: track.artist,
        album: track.album,
        artworkUri: track.artworkPath,
        durationMs: track.durationMs,
      });
      setQueue(
        filteredTracks.map((item) => item.id),
        filteredTracks.findIndex((item) => item.id === id),
      );
      router.push('/player');
    },
    [filteredTracks, setCurrentTrack, setQueue],
  );

  const renderItem = useCallback(
    ({ item }: { item: (typeof filteredTracks)[number] }) => (
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

  const statusMessage = !isGranted
    ? null
    : status === 'error'
      ? (errorMessage ?? 'Scan failed')
      : isScanning
        ? `Scanning… ${count} files (batch ${batchIndex + 1}) · ${filteredTracks.length} shown`
        : `${libraryCounts.tracks} songs · ${libraryCounts.albums} albums · ${libraryCounts.artists} artists`;

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
      emptyTitle={
        tracksLoading
          ? 'Loading library…'
          : isScanning
            ? 'Finding songs…'
            : query.trim()
              ? 'No matching songs'
              : 'No songs yet'
      }
      emptySubtitle={
        tracksLoading || isScanning
          ? 'First scan only: tracks appear after each batch. Short clips under 30s are skipped.'
          : query.trim()
            ? 'Try a different title, artist, or album.'
            : 'Pull to refresh after adding music on this device.'
      }
      refreshing={isScanning && filteredTracks.length === 0}
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
