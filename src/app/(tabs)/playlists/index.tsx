import { type Href, router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { NamePromptModal } from '@/components/collections/name-prompt-modal';
import { LibrarySearchField } from '@/components/library/library-search-field';
import { SettingsRow } from '@/components/settings/settings-row';
import { SettingsSection } from '@/components/settings/settings-section';
import { AppText } from '@/components/ui/app-text';
import { NeoSurface } from '@/components/ui/neo-surface';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { countFavorites } from '@/lib/db/favorites';
import { createPlaylist, listPlaylists, type PlaylistRow } from '@/lib/db/playlists';
import { countRecents } from '@/lib/db/recents';
import { matchesLibraryQuery } from '@/lib/library/filter';

type LibraryShortcut = {
  id: string;
  title: string;
  hint: string;
  detail: string;
  href: Href;
};

/**
 * Playlists tab order (product):
 * 1. Folders — device folder browse
 * 2. Favorites — pinned system list
 * 3. Recently played
 * 4. Custom playlists — user-created lists
 */
export default function PlaylistsScreen() {
  const db = useSQLiteContext();
  const [playlists, setPlaylists] = useState<PlaylistRow[]>([]);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [recentCount, setRecentCount] = useState(0);
  const [query, setQuery] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [createDraft, setCreateDraft] = useState('');

  const refresh = useCallback(async () => {
    const [nextPlaylists, nextFavorites, nextRecents] = await Promise.all([
      listPlaylists(db),
      countFavorites(db),
      countRecents(db),
    ]);
    setPlaylists(nextPlaylists);
    setFavoriteCount(nextFavorites);
    setRecentCount(nextRecents);
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const libraryShortcuts = useMemo<LibraryShortcut[]>(
    () => [
      {
        id: 'folders',
        title: 'Folders',
        hint: 'Browse audio by device folder',
        detail: 'Open',
        href: '/folders' as Href,
      },
      {
        id: 'favorites',
        title: 'Favorites',
        hint: 'Liked tracks from now-playing',
        detail: favoriteCount > 0 ? String(favoriteCount) : 'Empty',
        href: '/favorites' as Href,
      },
      {
        id: 'recent',
        title: 'Recently played',
        hint: 'Tracks you started recently',
        detail: recentCount > 0 ? String(recentCount) : 'Empty',
        href: '/recent' as Href,
      },
    ],
    [favoriteCount, recentCount],
  );

  const filteredShortcuts = useMemo(
    () =>
      libraryShortcuts.filter(
        (item) => matchesLibraryQuery(item.title, query) || matchesLibraryQuery(item.hint, query),
      ),
    [libraryShortcuts, query],
  );

  const filteredPlaylists = useMemo(
    () => playlists.filter((playlist) => matchesLibraryQuery(playlist.name, query)),
    [playlists, query],
  );

  const openCreate = () => {
    setCreateDraft('');
    setCreateOpen(true);
  };

  const confirmCreate = () => {
    const trimmed = createDraft.trim();
    if (!trimmed) {
      setCreateOpen(false);
      return;
    }
    setCreateOpen(false);
    void (async () => {
      const created = await createPlaylist(db, trimmed);
      await refresh();
      router.push(`/playlist/${encodeURIComponent(created.id)}` as Href);
    })();
  };

  const hasQuery = query.trim().length > 0;
  const showEmpty = hasQuery && filteredShortcuts.length === 0 && filteredPlaylists.length === 0;

  return (
    <Screen scroll contentStyle={styles.content}>
      <AppText variant="display">Playlists</AppText>

      <LibrarySearchField value={query} onChangeText={setQuery} placeholder="Search playlists" />

      {showEmpty ? (
        <AppText variant="body" tone="secondary">
          No matching playlists or library rows.
        </AppText>
      ) : null}

      {filteredShortcuts.length > 0 ? (
        <SettingsSection title="Library">
          {filteredShortcuts.map((item) => (
            <SettingsRow
              key={item.id}
              title={item.title}
              detail={item.detail}
              hint={item.hint}
              onPress={() => router.push(item.href)}
            />
          ))}
        </SettingsSection>
      ) : null}

      {!showEmpty ? (
        <SettingsSection title="Your playlists">
          {filteredPlaylists.length === 0 ? (
            <SettingsRow
              title={hasQuery ? 'No matching playlists' : 'No playlists yet'}
              hint={hasQuery ? 'Try a different name' : 'Create one to group songs you like'}
            />
          ) : (
            filteredPlaylists.map((playlist) => (
              <SettingsRow
                key={playlist.id}
                title={playlist.name}
                detail={
                  playlist.trackCount === 0
                    ? 'Empty'
                    : `${playlist.trackCount} track${playlist.trackCount === 1 ? '' : 's'}`
                }
                onPress={() => router.push(`/playlist/${encodeURIComponent(playlist.id)}` as Href)}
              />
            ))
          )}
        </SettingsSection>
      ) : null}

      <View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Create playlist"
          onPress={openCreate}
        >
          <NeoSurface variant="raised" radius={Radius.md} style={styles.createButton}>
            <AppText variant="label">New playlist</AppText>
          </NeoSurface>
        </Pressable>
      </View>

      <NamePromptModal
        visible={createOpen}
        title="New playlist"
        hint="Name your playlist"
        value={createDraft}
        placeholder="Playlist name"
        confirmLabel="Create"
        onChangeText={setCreateDraft}
        onCancel={() => setCreateOpen(false)}
        onConfirm={confirmCreate}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.four,
  },
  createButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.three,
  },
});
