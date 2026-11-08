import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/store/theme-provider';

type PlayerHeaderProps = {
  title?: string;
};

export function PlayerHeader({ title = 'NOW PLAYING' }: PlayerHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={12}
        onPress={() => {
          if (router.canGoBack()) {
            router.back();
            return;
          }
          router.replace('/');
        }}
        style={styles.side}
      >
        <Ionicons name="chevron-down" size={24} color={colors.textSecondary} />
      </Pressable>
      <Text style={[styles.title, { color: colors.textMuted }]}>{title}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="More options"
        hitSlop={12}
        style={styles.side}
      >
        <Ionicons name="ellipsis-horizontal" size={22} color={colors.textSecondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.one,
    paddingBottom: Spacing.half,
  },
  side: {
    width: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.4,
  },
});
