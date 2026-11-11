import { NativeTabs } from 'expo-router/native-tabs';
import { Platform, StyleSheet, View } from 'react-native';

import {
  AndroidMiniPlayerDock,
  MiniPlayerBottomAccessory,
} from '@/components/player/tabs-mini-player';
import { usePlayback } from '@/store/playback-provider';
import { useTheme } from '@/store/theme-provider';

export default function TabsLayout() {
  const { colors } = useTheme();
  const { currentTrack } = usePlayback();
  const showAccessory = Platform.OS === 'ios' && currentTrack != null;

  return (
    <View style={styles.root}>
      <NativeTabs
        backgroundColor={colors.surface}
        // Indicator pill must contrast with selected icon color (same color = invisible icon).
        indicatorColor={colors.backgroundSelected}
        iconColor={{
          default: colors.textMuted,
          selected: colors.accent,
        }}
        labelVisibilityMode="unlabeled"
        rippleColor={colors.overlay}
      >
        {showAccessory ? (
          <NativeTabs.BottomAccessory>
            <MiniPlayerBottomAccessory />
          </NativeTabs.BottomAccessory>
        ) : null}

        <NativeTabs.Trigger name="index" accessibilityLabel="Songs">
          <NativeTabs.Trigger.Label hidden>Songs</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf={{ default: 'music.note', selected: 'music.note' }}
            md="music_note"
          />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="albums" accessibilityLabel="Albums">
          <NativeTabs.Trigger.Label hidden>Albums</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf={{ default: 'square.stack', selected: 'square.stack.fill' }}
            md="album"
          />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="artists" accessibilityLabel="Artists">
          <NativeTabs.Trigger.Label hidden>Artists</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf={{ default: 'person.2', selected: 'person.2.fill' }}
            md="people"
          />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="playlists" accessibilityLabel="Playlists">
          <NativeTabs.Trigger.Label hidden>Playlists</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf={{ default: 'list.bullet', selected: 'list.bullet' }}
            md="queue_music"
          />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="settings" accessibilityLabel="Settings">
          <NativeTabs.Trigger.Label hidden>Settings</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            sf={{ default: 'gearshape', selected: 'gearshape.fill' }}
            md="settings"
          />
        </NativeTabs.Trigger>
      </NativeTabs>

      <AndroidMiniPlayerDock />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
