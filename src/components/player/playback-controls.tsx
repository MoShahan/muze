import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { NeoIconButton } from '@/components/ui/neo-icon-button';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/store/theme-provider';

export type PlayMode = 'shuffle' | 'all' | 'one';

type PlaybackControlsProps = {
  isPlaying: boolean;
  playMode: PlayMode;
  onTogglePlay: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onCyclePlayMode: () => void;
};

const PLAY_MODE_META: Record<
  PlayMode,
  { label: string; icon: keyof typeof Ionicons.glyphMap; showOne?: boolean }
> = {
  shuffle: { label: 'Shuffle', icon: 'shuffle' },
  all: { label: 'Repeat all', icon: 'repeat' },
  one: { label: 'Repeat one', icon: 'repeat', showOne: true },
};

export function PlaybackControls({
  isPlaying,
  playMode,
  onTogglePlay,
  onPrevious,
  onNext,
  onCyclePlayMode,
}: PlaybackControlsProps) {
  const { colors } = useTheme();
  const mode = PLAY_MODE_META[playMode];

  return (
    <View style={styles.row}>
      <NeoIconButton
        label="Previous track"
        icon="play-skip-back"
        color={colors.textSecondary}
        onPress={onPrevious}
        variant="ghost"
      />
      <NeoIconButton
        label={isPlaying ? 'Pause' : 'Play'}
        onPress={onTogglePlay}
        size="lg"
        color={colors.text}
      >
        {isPlaying ? (
          <View style={styles.pauseIcon}>
            <View style={[styles.pauseBar, { backgroundColor: colors.text }]} />
            <View style={[styles.pauseBar, { backgroundColor: colors.text }]} />
          </View>
        ) : (
          <Ionicons name="play" size={28} color={colors.text} style={styles.playGlyph} />
        )}
      </NeoIconButton>
      <NeoIconButton
        label="Next track"
        icon="play-skip-forward"
        color={colors.textSecondary}
        onPress={onNext}
        variant="ghost"
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={mode.label}
        hitSlop={8}
        onPress={onCyclePlayMode}
        style={styles.sideButton}
      >
        <Ionicons name={mode.icon} size={22} color={colors.accent} />
        {mode.showOne ? (
          <AppText variant="caption" tone="accent" style={styles.oneBadge}>
            1
          </AppText>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
  },
  sideButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playGlyph: {
    marginLeft: 3,
  },
  pauseIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  pauseBar: {
    width: 3,
    height: 22,
    borderRadius: 1,
  },
  oneBadge: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },
});
