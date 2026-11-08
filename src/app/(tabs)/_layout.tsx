import { NativeTabs } from 'expo-router/native-tabs';

import { useTheme } from '@/store/theme-provider';

export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <NativeTabs
      backgroundColor={colors.surface}
      tintColor={colors.accent}
      iconColor={colors.textMuted}
      labelStyle={{ color: colors.textMuted }}
      indicatorColor={colors.accent}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="library">
        <NativeTabs.Trigger.Label>Library</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'music.note.list', selected: 'music.note.list' }}
          md="library_music"
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="playlists">
        <NativeTabs.Trigger.Label>Playlists</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'list.bullet', selected: 'list.bullet' }}
          md="queue_music"
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'gearshape', selected: 'gearshape.fill' }}
          md="settings"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
