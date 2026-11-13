import { type Href, router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { NamePromptModal } from '@/components/collections/name-prompt-modal';
import { SettingsRow } from '@/components/settings/settings-row';
import { SettingsSection } from '@/components/settings/settings-section';
import { AppText } from '@/components/ui/app-text';
import { NeoSurface } from '@/components/ui/neo-surface';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { countFavorites } from '@/lib/db/favorites';
import { createPlaylist, listPlaylists, type PlaylistRow } from '@/lib/db/playlists';
import { countRecents } from '@/lib/db/recents';

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

  return (
    <Screen scroll contentStyle={styles.content}>
      <AppText variant="display">Playlists</AppText>

      <SettingsSection title="Library">
        <SettingsRow
          title="Folders"
          detail="Open"
          hint="Browse audio by device folder"
          onPress={() => router.push('/folders' as Href)}
        />
        <SettingsRow
          title="Favorites"
          detail={favoriteCount > 0 ? String(favoriteCount) : 'Empty'}
          hint="Liked tracks from now-playing"
          onPress={() => router.push('/favorites' as Href)}
        />
        <SettingsRow
          title="Recently played"
          detail={recentCount > 0 ? String(recentCount) : 'Empty'}
          hint="Tracks you started recently"
          onPress={() => router.push('/recent' as Href)}
        />
      </SettingsSection>

      <SettingsSection title="Your playlists">
        {playlists.length === 0 ? (
          <SettingsRow title="No playlists yet" hint="Create one to group songs you like" />
        ) : (
          playlists.map((playlist) => (
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
