import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Spacing, neoRaisedShadow } from '@/constants/theme';
import { useTheme } from '@/store/theme-provider';

type PlaybackControlsProps = {
  isPlaying: boolean;
  shuffle: boolean;
  repeat: 'off' | 'all' | 'one';
  onTogglePlay: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onToggleShuffle: () => void;
  onCycleRepeat: () => void;
};

export function PlaybackControls({
  isPlaying,
  shuffle,
  repeat,
  onTogglePlay,
  onPrevious,
  onNext,
  onToggleShuffle,
  onCycleRepeat,
}: PlaybackControlsProps) {
  const { colors } = useTheme();

  const repeatLabel =
    repeat === 'off' ? 'Repeat off' : repeat === 'all' ? 'Repeat all' : 'Repeat one';

  return (
    <View style={styles.row}>
      <ControlButton
        label="Shuffle"
        active={shuffle}
        onPress={onToggleShuffle}
        text="⇄"
        color={shuffle ? colors.accent : colors.textMuted}
      />
      <ControlButton
        label="Previous track"
        onPress={onPrevious}
        text="⏮"
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
        <Text style={[styles.playIcon, { color: colors.text }]}>{isPlaying ? '❚❚' : '▶'}</Text>
      </Pressable>
      <ControlButton label="Next track" onPress={onNext} text="⏭" color={colors.textSecondary} />
      <ControlButton
        label={repeatLabel}
        active={repeat !== 'off'}
        onPress={onCycleRepeat}
        text={repeat === 'one' ? '🔂' : '🔁'}
        color={repeat !== 'off' ? colors.accent : colors.textMuted}
      />
    </View>
  );
}

type ControlButtonProps = {
  label: string;
  text: string;
  color: string;
  active?: boolean;
  onPress: () => void;
};

function ControlButton({ label, text, color, onPress }: ControlButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={onPress}
      style={styles.sideButton}
    >
      <Text style={[styles.sideIcon, { color }]}>{text}</Text>
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
  sideIcon: {
    fontSize: 20,
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    fontSize: 26,
    fontWeight: '600',
  },
});
