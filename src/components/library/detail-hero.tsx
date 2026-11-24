import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { NeoIconButton } from '@/components/ui/neo-icon-button';
import { Spacing } from '@/constants/theme';
import { artworkDisplayUri } from '@/lib/db/tracks';
import { useTheme } from '@/store/theme-provider';

const HERO_HEIGHT_RATIO = 0.6;
const OVERLAY_TEXT = '#F5F7FA';
const OVERLAY_TEXT_SECONDARY = 'rgba(245, 247, 250, 0.82)';

type DetailHeroProps = {
  title: string;
  subtitle?: string | null;
  artworkUri?: string | null;
  onPlay: () => void;
  onShuffle: () => void;
  onSortPress: () => void;
  disabled?: boolean;
};

export function DetailHero({
  title,
  subtitle,
  artworkUri,
  onPlay,
  onShuffle,
  onSortPress,
  disabled = false,
}: DetailHeroProps) {
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const height = Math.round(width * HERO_HEIGHT_RATIO);
  const displayUri = artworkDisplayUri(artworkUri);

  return (
    <View style={[styles.root, { width, height }]}>
      {displayUri ? (
        <Image
          source={{ uri: displayUri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          recyclingKey={displayUri}
          transition={120}
        />
      ) : (
        <View
          style={[
            StyleSheet.absoluteFill,
            styles.artFallback,
            { backgroundColor: colors.surfacePressed },
          ]}
          accessibilityLabel="No album art"
        >
          <Ionicons name="musical-notes" size={72} color={colors.textMuted} />
        </View>
      )}

      <LinearGradient
        colors={['rgba(0,0,0,0.55)', 'rgba(0,0,0,0.18)', 'transparent']}
        locations={[0, 0.45, 1]}
        style={styles.topScrim}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.22)', 'rgba(0,0,0,0.58)']}
        locations={[0, 0.4, 1]}
        style={styles.bottomScrim}
        pointerEvents="none"
      />

      <View style={styles.titleBlock} pointerEvents="none">
        <AppText variant="display" numberOfLines={2} style={styles.title}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="subtitle" numberOfLines={2} style={styles.subtitle}>
            {subtitle}
          </AppText>
        ) : null}
      </View>

      <View style={styles.actions}>
        <NeoIconButton
          label="Play"
          icon="play"
          variant="raised"
          size="md"
          onPress={onPlay}
          disabled={disabled}
        />
        <NeoIconButton
          label="Shuffle"
          icon="shuffle"
          variant="pressed"
          size="md"
          onPress={onShuffle}
          disabled={disabled}
        />
        <NeoIconButton
          label="Sort"
          icon="swap-vertical"
          variant="pressed"
          size="md"
          onPress={onSortPress}
          disabled={disabled}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    overflow: 'hidden',
    alignSelf: 'center',
  },
  artFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  topScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '42%',
  },
  bottomScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '38%',
  },
  titleBlock: {
    position: 'absolute',
    left: Spacing.four,
    right: Spacing.four,
    top: Spacing.three,
    gap: Spacing.half,
  },
  title: {
    color: OVERLAY_TEXT,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  subtitle: {
    color: OVERLAY_TEXT_SECONDARY,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  actions: {
    position: 'absolute',
    left: Spacing.four,
    right: Spacing.four,
    bottom: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
});
