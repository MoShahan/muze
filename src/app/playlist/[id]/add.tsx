import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { LibraryBrowser } from '@/components/library/library-browser';
import { TrackListItem } from '@/components/library/track-list-item';
import { AppText } from '@/components/ui/app-text';
import { NeoSurface } from '@/components/ui/neo-surface';
import { Radius, Spacing } from '@/constants/theme';
import { addTracksToPlaylist, getPlaylistById, listPlaylistTrackIds } from '@/lib/db/playlists';
import { listTracks, type CachedTrackRow } from '@/lib/db/tracks';
import { formatDurationMs, matchesLibraryQuery } from '@/lib/library/filter';

export default function PlaylistAddTracksScreen() {
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const id = typeof rawId === 'string' ? decodeURIComponent(rawId) : '';
  const db = useSQLiteContext();
  const [playlistName, setPlaylistName] = useState('Playlist');
  const [tracks, setTracks] = useState<CachedTrackRow[]>([]);
  const [inPlaylist, setInPlaylist] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!id) {
        return;
      }
      setIsLoading(true);
      try {
        const [playlist, allTracks, existingIds] = await Promise.all([
          getPlaylistById(db, id),
          listTracks(db),
          listPlaylistTrackIds(db, id),
        ]);
        if (cancelled) {
          return;
        }
        setPlaylistName(playlist?.name ?? 'Playlist');
        setTracks(allTracks);
        setInPlaylist(existingIds);
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

  const onPressTrack = useCallback(
    (trackId: string) => {
      if (inPlaylist.has(trackId)) {
        return;
      }
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(trackId)) {
          next.delete(trackId);
        } else {
          next.add(trackId);
        }
        return next;
      });
    },
    [inPlaylist],
  );

  const onSave = useCallback(() => {
    if (selected.size === 0 || !id) {
      router.back();
      return;
    }
    setSaving(true);
    void (async () => {
      try {
        await addTracksToPlaylist(db, id, [...selected]);
        router.back();
      } finally {
        setSaving(false);
      }
    })();
  }, [db, id, selected]);

  const renderItem = useCallback(
    ({ item }: { item: CachedTrackRow }) => {
      const alreadyIn = inPlaylist.has(item.id);
      const isSelected = selected.has(item.id);
      return (
        <TrackListItem
          id={item.id}
          title={item.title}
          artist={item.artist}
          durationLabel={formatDurationMs(item.durationMs)}
          artworkUri={item.artworkPath}
          onPressId={onPressTrack}
          trailingLabel={
            alreadyIn ? 'Added' : isSelected ? 'Selected' : formatDurationMs(item.durationMs)
          }
        />
      );
    },
    [inPlaylist, onPressTrack, selected],
  );

  return (
    <LibraryBrowser
      title="Add songs"
      subtitle={playlistName}
      statusMessage={
        selected.size > 0
          ? `${selected.size} selected`
          : `${filteredTracks.length} track${filteredTracks.length === 1 ? '' : 's'}`
      }
      searchValue={query}
      onSearchChange={setQuery}
      searchPlaceholder="Search library"
      data={filteredTracks}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      emptyTitle={isLoading ? 'Loading…' : 'No matching songs'}
      emptySubtitle={isLoading ? 'Reading library.' : 'Try a different search.'}
      onBack={() => router.back()}
      headerExtra={
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add selected songs"
            onPress={onSave}
            disabled={saving || selected.size === 0}
            style={styles.flex}
          >
            <NeoSurface variant="raised" radius={Radius.md} style={styles.button}>
              <AppText variant="label">
                {selected.size === 0 ? 'Select songs' : `Add ${selected.size}`}
              </AppText>
            </NeoSurface>
          </Pressable>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
  },
  flex: {
    flex: 1,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.three,
  },
});
