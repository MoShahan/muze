import { type Href, router } from 'expo-router';
import { StyleSheet } from 'react-native';

import { SettingsRow } from '@/components/settings/settings-row';
import { SettingsSection } from '@/components/settings/settings-section';
import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';

/** Temporary layout placeholders — remove when real playlists ship (see TODO.md Phase 5). */
const DEMO_PLAYLISTS = [
  { id: 'demo-playlist-1', title: 'Playlist 1' },
  { id: 'demo-playlist-2', title: 'Playlist 2' },
] as const;

/**
 * Playlists tab order (product):
 * 1. Folders — device folder browse
 * 2. Favorites — pinned system list
 * 3. Custom playlists — user-created lists
 */
export default function PlaylistsScreen() {
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
        <SettingsRow title="Favorites" detail="Soon" hint="Liked tracks from now-playing" />
      </SettingsSection>

      <SettingsSection title="Your playlists">
        {DEMO_PLAYLISTS.map((playlist) => (
          <SettingsRow
            key={playlist.id}
            title={playlist.title}
            detail="Demo"
            hint="Sample playlist for layout preview"
            onPress={() => router.push(`/playlist/${encodeURIComponent(playlist.id)}` as Href)}
          />
        ))}
      </SettingsSection>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.four,
  },
});
