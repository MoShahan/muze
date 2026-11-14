import { type Href, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { NamePromptModal } from '@/components/collections/name-prompt-modal';
import { DetailActions } from '@/components/library/detail-actions';
import { LibraryBrowser } from '@/components/library/library-browser';
import { TrackListItem } from '@/components/library/track-list-item';
import { TrackSortControl } from '@/components/library/track-sort-control';
import { AppText } from '@/components/ui/app-text';
import { NeoSurface } from '@/components/ui/neo-surface';
import { Radius, Spacing } from '@/constants/theme';
import {
  deletePlaylist,
  getPlaylistById,
  listPlaylistTracks,
  removeTrackFromPlaylist,
  renamePlaylist,
  type PlaylistRow,
} from '@/lib/db/playlists';
import { type CachedTrackRow } from '@/lib/db/tracks';
import { formatDurationMs, matchesLibraryQuery } from '@/lib/library/filter';
import { playTrackList } from '@/lib/library/play-tracks';
import { DEFAULT_TRACK_SORT, sortTracks, type TrackSortKey } from '@/lib/library/sort-tracks';
import { usePlayback } from '@/store/playback-provider';

export default function PlaylistDetailScreen() {
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const id = typeof rawId === 'string' ? decodeURIComponent(rawId) : '';
  const db = useSQLiteContext();
  const { playTrack, setQueue } = usePlayback();
  const [playlist, setPlaylist] = useState<PlaylistRow | null>(null);
  const [tracks, setTracks] = useState<CachedTrackRow[]>([]);
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<TrackSortKey>(DEFAULT_TRACK_SORT);
  const [isLoading, setIsLoading] = useState(true);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameDraft, setRenameDraft] = useState('');

  const refresh = useCallback(async () => {
    if (!id) {
      setPlaylist(null);
      setTracks([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const nextPlaylist = await getPlaylistById(db, id);
      if (!nextPlaylist) {
        setPlaylist(null);
        setTracks([]);
        return;
      }
      const nextTracks = await listPlaylistTracks(db, id);
      setPlaylist(nextPlaylist);
      setTracks(nextTracks);
    } finally {
      setIsLoading(false);
    }
  }, [db, id]);

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

  const onLongPressTrack = useCallback(
    (trackId: string) => {
      const track = tracks.find((item) => item.id === trackId);
      Alert.alert(track?.title ?? 'Track', undefined, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove from playlist',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              await removeTrackFromPlaylist(db, id, trackId);
              await refresh();
            })();
          },
        },
      ]);
    },
    [db, id, refresh, tracks],
  );

  const openRename = () => {
    setRenameDraft(playlist?.name ?? '');
    setRenameOpen(true);
  };

  const confirmRename = () => {
    const trimmed = renameDraft.trim();
    if (!trimmed || !playlist) {
      setRenameOpen(false);
      return;
    }
    setRenameOpen(false);
    void (async () => {
      await renamePlaylist(db, playlist.id, trimmed);
      await refresh();
    })();
  };

  const confirmDelete = () => {
    if (!playlist) {
      return;
    }
    Alert.alert('Delete playlist?', `“${playlist.name}” will be removed. Tracks stay on device.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            await deletePlaylist(db, playlist.id);
            router.back();
          })();
        },
      },
    ]);
  };

  const renderItem = useCallback(
    ({ item }: { item: CachedTrackRow }) => (
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

  return (
    <>
      <LibraryBrowser
        title={playlist?.name ?? (isLoading ? 'Playlist' : 'Playlist not found')}
        statusMessage={
          playlist
            ? `${filteredTracks.length} track${filteredTracks.length === 1 ? '' : 's'}`
            : null
        }
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search playlist tracks"
        data={filteredTracks}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        emptyTitle={
          isLoading
            ? 'Loading playlist…'
            : playlist
              ? query.trim()
                ? 'No matching tracks'
                : 'Empty playlist'
              : 'Playlist missing'
        }
        emptySubtitle={
          isLoading
            ? 'Reading playlist from SQLite.'
            : playlist
              ? query.trim()
                ? 'Try a different title, artist, or album.'
                : 'Add songs from your library to fill this playlist.'
              : 'It may have been deleted.'
        }
        emptyActionLabel={
          playlist && !isLoading && !query.trim() && tracks.length === 0 ? 'Add songs' : undefined
        }
        onEmptyAction={
          playlist && !isLoading && !query.trim() && tracks.length === 0
            ? () => router.push(`/playlist/${encodeURIComponent(id)}/add` as Href)
            : undefined
        }
        onBack={() => router.back()}
        refreshing={isLoading && tracks.length === 0}
        onRefresh={() => {
          void refresh();
        }}
        headerExtra={
          playlist ? (
            <View style={styles.headerExtra}>
              <DetailActions
                disabled={tracks.length === 0}
                onPlay={() => playFrom(filteredTracks[0]?.id ?? tracks[0]?.id ?? null, false)}
                onShuffle={() => playFrom(null, true)}
              />
              <View style={styles.manageRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Add songs"
                  onPress={() => router.push(`/playlist/${encodeURIComponent(id)}/add` as Href)}
                  style={styles.manageHit}
                >
                  <NeoSurface variant="raised" radius={Radius.md} style={styles.manageButton}>
                    <AppText variant="label">Add songs</AppText>
                  </NeoSurface>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Rename playlist"
                  onPress={openRename}
                  style={styles.manageHit}
                >
                  <NeoSurface variant="flat" radius={Radius.md} style={styles.manageButton}>
                    <AppText variant="label">Rename</AppText>
                  </NeoSurface>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Delete playlist"
                  onPress={confirmDelete}
                  style={styles.manageHit}
                >
                  <NeoSurface variant="pressed" radius={Radius.md} style={styles.manageButton}>
                    <AppText variant="label">Delete</AppText>
                  </NeoSurface>
                </Pressable>
              </View>
              <TrackSortControl value={sortKey} onChange={setSortKey} />
            </View>
          ) : null
        }
      />

      <NamePromptModal
        visible={renameOpen}
        title="Rename playlist"
        hint="Name shown on the Playlists tab"
        value={renameDraft}
        placeholder="Playlist name"
        confirmLabel="Save"
        onChangeText={setRenameDraft}
        onCancel={() => setRenameOpen(false)}
        onConfirm={confirmRename}
      />
    </>
  );
}

const styles = StyleSheet.create({
  headerExtra: {
    gap: Spacing.three,
  },
  manageRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  manageHit: {
    flex: 1,
  },
  manageButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.two,
  },
});
