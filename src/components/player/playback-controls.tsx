import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { NeoIconButton } from '@/components/ui/neo-icon-button';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/store/theme-provider';

export type PlayMode = 'shuffle' | 'all' | 'one';

/** Match song title/artist overlay colors on the glassy player backdrop. */
const OVERLAY_PRIMARY = '#F5F7FA';
const OVERLAY_SECONDARY = 'rgba(245, 247, 250, 0.82)';

type PlaybackControlsProps = {
  isPlaying: boolean;
  playMode: PlayMode;
  onTogglePlay: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onCyclePlayMode: () => void;
  onOpenQueue: () => void;
  /** When true, use light overlay colors so controls stay visible on album art. */
  onGlass?: boolean;
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
  onOpenQueue,
  onGlass = false,
}: PlaybackControlsProps) {
  const { colors } = useTheme();
  const mode = PLAY_MODE_META[playMode];
  const primary = onGlass ? OVERLAY_PRIMARY : colors.text;
  const secondary = onGlass ? OVERLAY_SECONDARY : colors.textSecondary;
  const modeColor = onGlass ? OVERLAY_PRIMARY : colors.accent;

  return (
    <View style={styles.row}>
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
      <NeoIconButton
        label="Previous track"
        icon="play-skip-back"
        color={secondary}
        onPress={onPrevious}
        variant="ghost"
      />
      {onGlass ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
          hitSlop={8}
          onPress={onTogglePlay}
          style={styles.playGlass}
        >
          {isPlaying ? (
            <View style={styles.pauseIcon}>
              <View style={[styles.pauseBar, { backgroundColor: primary }]} />
              <View style={[styles.pauseBar, { backgroundColor: primary }]} />
            </View>
          ) : (
            <Ionicons name="play" size={28} color={primary} style={styles.playGlyph} />
          )}
        </Pressable>
      ) : (
        <NeoIconButton
          label={isPlaying ? 'Pause' : 'Play'}
          onPress={onTogglePlay}
          size="lg"
          color={primary}
        >
          {isPlaying ? (
            <View style={styles.pauseIcon}>
              <View style={[styles.pauseBar, { backgroundColor: primary }]} />
              <View style={[styles.pauseBar, { backgroundColor: primary }]} />
            </View>
          ) : (
            <Ionicons name="play" size={28} color={primary} style={styles.playGlyph} />
          )}
        </NeoIconButton>
      )}
      <NeoIconButton
        label="Next track"
        icon="play-skip-forward"
        color={secondary}
        onPress={onNext}
        variant="ghost"
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Up next queue"
        hitSlop={8}
        onPress={onOpenQueue}
        style={styles.sideButton}
      >
        <Ionicons name="list" size={22} color={secondary} />
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
  playGlass: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 247, 250, 0.18)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(245, 247, 250, 0.45)',
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
