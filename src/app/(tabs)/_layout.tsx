import { NativeTabs } from 'expo-router/native-tabs';

import { useTheme } from '@/store/theme-provider';

export default function TabsLayout() {
  const { colors } = useTheme();

  return (
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
      <NativeTabs.Trigger name="index" accessibilityLabel="Home">
        <NativeTabs.Trigger.Label hidden>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="library" accessibilityLabel="Library">
        <NativeTabs.Trigger.Label hidden>Library</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'music.note.list', selected: 'music.note.list' }}
          md="library_music"
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
  );
}
