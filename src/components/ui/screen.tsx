import { type ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MINI_PLAYER_HEIGHT } from '@/components/player/mini-player';
import { Spacing } from '@/constants/theme';
import { usePlayback } from '@/store/playback-provider';
import { useTheme } from '@/store/theme-provider';

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

export function Screen({ children, scroll = false, style, contentStyle }: ScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { currentTrack } = usePlayback();
  const miniPlayerPad = currentTrack ? MINI_PLAYER_HEIGHT + Spacing.three : 0;

  const padding = {
    paddingTop: insets.top + Spacing.three,
    paddingBottom: insets.bottom + Spacing.five + miniPlayerPad,
    paddingHorizontal: Spacing.four,
  };

  if (scroll) {
    return (
      <ScrollView
        style={[styles.flex, { backgroundColor: colors.canvas }, style]}
        contentContainerStyle={[styles.content, padding, contentStyle]}
        contentInsetAdjustmentBehavior="automatic"
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: colors.canvas }, padding, style]}>
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    gap: Spacing.four,
    flexGrow: 1,
  },
});
