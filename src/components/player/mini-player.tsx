import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { NeoSurface } from '@/components/ui/neo-surface';
import { Radius, Spacing } from '@/constants/theme';
import { usePlayback } from '@/store/playback-provider';
import { useTheme } from '@/store/theme-provider';

export const MINI_PLAYER_HEIGHT = 64;

type MiniPlayerProps = {
  /** Compact chrome for iOS BottomAccessory `inline` placement. */
  compact?: boolean;
};

export function MiniPlayer({ compact = false }: MiniPlayerProps) {
  const { colors } = useTheme();
  const { currentTrack, isPlaying, setIsPlaying } = usePlayback();

  if (!currentTrack) {
    return null;
  }

  const openPlayer = () => {
    router.push('/player');
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  if (compact) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
        onPress={togglePlay}
        hitSlop={8}
        style={styles.compactHit}
      >
        <Ionicons name={isPlaying ? 'pause' : 'play'} size={18} color={colors.text} />
      </Pressable>
    );
  }

  return (
    <NeoSurface variant="raised" radius={Radius.lg} style={styles.shell}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open now playing: ${currentTrack.title}`}
        onPress={openPlayer}
        style={styles.mainHit}
      >
        <View style={[styles.art, { backgroundColor: colors.surfacePressed }]}>
          {currentTrack.artworkUri ? (
            <Image
              source={{ uri: currentTrack.artworkUri }}
              style={styles.artImage}
              contentFit="cover"
            />
          ) : (
            <Ionicons name="musical-note" size={18} color={colors.textMuted} />
          )}
        </View>
        <View style={styles.copy}>
          <AppText variant="bodyStrong" numberOfLines={1}>
            {currentTrack.title}
          </AppText>
          <AppText variant="caption" tone="muted" numberOfLines={1}>
            {currentTrack.artist}
          </AppText>
        </View>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
        onPress={togglePlay}
        hitSlop={8}
        style={styles.playHit}
      >
        <NeoSurface variant="pressed" radius={20} style={styles.playButton}>
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={18}
            color={colors.text}
            style={isPlaying ? undefined : styles.playIconOffset}
          />
        </NeoSurface>
      </Pressable>
    </NeoSurface>
  );
}

const styles = StyleSheet.create({
  shell: {
    height: MINI_PLAYER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: Spacing.two,
    paddingRight: Spacing.two,
    gap: Spacing.two,
  },
  mainHit: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    minWidth: 0,
  },
  art: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  artImage: {
    width: '100%',
    height: '100%',
  },
  copy: {
    flex: 1,
    gap: Spacing.half,
    minWidth: 0,
  },
  playHit: {
    padding: Spacing.one,
  },
  playButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIconOffset: {
    marginLeft: 2,
  },
  compactHit: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
