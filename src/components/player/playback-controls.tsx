import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Spacing, neoRaisedShadow } from '@/constants/theme';
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
  const modeColor = colors.accent;

  return (
    <View style={styles.row}>
      <ControlButton
        label="Previous track"
        onPress={onPrevious}
        icon="play-skip-back"
        color={colors.textSecondary}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
        onPress={onTogglePlay}
        style={[
          styles.playButton,
          { backgroundColor: colors.surfaceRaised },
          neoRaisedShadow(colors),
        ]}
      >
        {isPlaying ? (
          <View style={styles.pauseIcon}>
            <View style={[styles.pauseBar, { backgroundColor: colors.text }]} />
            <View style={[styles.pauseBar, { backgroundColor: colors.text }]} />
          </View>
        ) : (
          <Ionicons name="play" size={28} color={colors.text} style={styles.playGlyph} />
        )}
      </Pressable>
      <ControlButton
        label="Next track"
        onPress={onNext}
        icon="play-skip-forward"
        color={colors.textSecondary}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={mode.label}
        hitSlop={8}
        onPress={onCyclePlayMode}
        style={styles.sideButton}
      >
        <Ionicons name={mode.icon} size={22} color={modeColor} />
        {mode.showOne ? <Text style={[styles.oneBadge, { color: modeColor }]}>1</Text> : null}
      </Pressable>
    </View>
  );
}

type ControlButtonProps = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
};

function ControlButton({ label, icon, color, onPress }: ControlButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={onPress}
      style={styles.sideButton}
    >
      <Ionicons name={icon} size={22} color={color} />
    </Pressable>
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
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
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
