import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/store/theme-provider';

type SongInformationProps = {
  title: string;
  artist: string;
  favorited: boolean;
  onToggleFavorite: () => void;
};

export function SongInformation({
  title,
  artist,
  favorited,
  onToggleFavorite,
}: SongInformationProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[styles.artist, { color: colors.textSecondary }]} numberOfLines={1}>
          {artist}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={favorited ? 'Remove from favorites' : 'Add to favorites'}
        hitSlop={10}
        onPress={onToggleFavorite}
        style={styles.heartHit}
      >
        <Ionicons
          name={favorited ? 'heart' : 'heart-outline'}
          size={26}
          color={favorited ? colors.accent : colors.textMuted}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  copy: {
    flex: 1,
    gap: Spacing.half,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
  },
  artist: {
    fontSize: 15,
  },
  heartHit: {
    width: 44,
    height: 44,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
