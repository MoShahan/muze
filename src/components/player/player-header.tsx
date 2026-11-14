import { Ionicons } from '@expo/vector-icons';
import { type Href, router } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/store/theme-provider';

type PlayerHeaderProps = {
  title?: string;
  trackId?: string | null;
};

export function PlayerHeader({ title = 'NOW PLAYING', trackId }: PlayerHeaderProps) {
  const { colors } = useTheme();

  const onMore = () => {
    if (!trackId) {
      return;
    }
    Alert.alert('Track', undefined, [
      {
        text: 'Edit track',
        onPress: () => router.push(`/track/${encodeURIComponent(trackId)}/edit` as Href),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

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
        onPress={onMore}
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
