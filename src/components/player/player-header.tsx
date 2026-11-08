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
      <View style={styles.side} />
      <Text style={[styles.title, { color: colors.textMuted }]}>{title}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="More options"
        hitSlop={12}
        style={styles.side}
      >
        <Text style={[styles.menu, { color: colors.textSecondary }]}>...</Text>
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
    paddingVertical: Spacing.two,
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
  menu: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 22,
  },
});
