import { NativeTabs } from 'expo-router/native-tabs';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MiniPlayer } from '@/components/player/mini-player';
import { Spacing } from '@/constants/theme';
import { usePlayback } from '@/store/playback-provider';

/** Approximate Material 3 unlabeled tab content height (excludes system inset). */
export const ANDROID_TAB_BAR_CONTENT_HEIGHT = 64;

/**
 * iOS 26+ BottomAccessory chrome. State lives in PlaybackProvider because
 * Expo renders two accessory instances (regular + inline).
 */
export function MiniPlayerBottomAccessory() {
  const placement = NativeTabs.BottomAccessory.usePlacement();
  return <MiniPlayer compact={placement === 'inline'} />;
}

/**
 * Android / web dock: BottomAccessory is a no-op there, so sit above the tab bar.
 */
export function AndroidMiniPlayerDock() {
  const insets = useSafeAreaInsets();
  const { currentTrack } = usePlayback();

  if (Platform.OS === 'ios' || !currentTrack) {
    return null;
  }

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.dock,
        {
          bottom: ANDROID_TAB_BAR_CONTENT_HEIGHT + insets.bottom,
        },
      ]}
    >
      <MiniPlayer />
    </View>
  );
}

const styles = StyleSheet.create({
  dock: {
    position: 'absolute',
    left: Spacing.two,
    right: Spacing.two,
    zIndex: 20,
    elevation: 8,
  },
});
