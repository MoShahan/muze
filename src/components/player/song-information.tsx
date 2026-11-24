import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/store/theme-provider';

/** Light copy for use over the glassy album-art backdrop. */
const OVERLAY_TITLE = '#F5F7FA';
const OVERLAY_ARTIST = 'rgba(245, 247, 250, 0.82)';
const OVERLAY_MUTED = 'rgba(245, 247, 250, 0.65)';

type SongInformationProps = {
  title: string;
  artist: string;
  favorited: boolean;
  onToggleFavorite: () => void;
  /** When true, force light text so copy stays readable on any album-art glass. */
  onGlass?: boolean;
};

export function SongInformation({
  title,
  artist,
  favorited,
  onToggleFavorite,
  onGlass = false,
}: SongInformationProps) {
  const { colors } = useTheme();
  const titleColor = onGlass ? OVERLAY_TITLE : colors.text;
  const artistColor = onGlass ? OVERLAY_ARTIST : colors.textSecondary;
  const heartColor = favorited ? colors.accent : onGlass ? OVERLAY_MUTED : colors.textMuted;

  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        <Text
          style={[styles.title, onGlass && styles.overlayShadow, { color: titleColor }]}
          numberOfLines={2}
        >
          {title}
        </Text>
        <Text
          style={[styles.artist, onGlass && styles.overlayShadow, { color: artistColor }]}
          numberOfLines={2}
        >
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
        <Ionicons name={favorited ? 'heart' : 'heart-outline'} size={26} color={heartColor} />
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
  overlayShadow: {
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  heartHit: {
    width: 44,
    height: 44,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
