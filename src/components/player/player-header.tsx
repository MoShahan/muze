import { Ionicons } from '@expo/vector-icons';
import { type Href, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { formatSleepRemaining, SLEEP_TIMER_PRESETS_MS } from '@/lib/library/sleep-timer';
import { usePlayback } from '@/store/playback-provider';
import { useTheme } from '@/store/theme-provider';

type PlayerHeaderProps = {
  title?: string;
  trackId?: string | null;
};

export function PlayerHeader({ title = 'NOW PLAYING', trackId }: PlayerHeaderProps) {
  const { colors } = useTheme();
  const { sleepTimerEndsAt, setSleepTimer, clearSleepTimer, positionMs, durationMs } =
    usePlayback();
  /** Bumps once a second so remaining sleep time re-renders while active. */
  const [, setSleepTick] = useState(0);

  useEffect(() => {
    if (sleepTimerEndsAt == null) {
      return;
    }
    const id = setInterval(() => {
      setSleepTick((value) => value + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [sleepTimerEndsAt]);

  const remainingLabel = sleepTimerEndsAt != null ? formatSleepRemaining(sleepTimerEndsAt) : null;

  const showSleepTimerPicker = () => {
    const buttons: {
      text: string;
      style?: 'cancel' | 'destructive' | 'default';
      onPress?: () => void;
    }[] = [];

    if (sleepTimerEndsAt != null) {
      buttons.push({
        text: remainingLabel ? `Turn off (${remainingLabel} left)` : 'Turn off',
        style: 'destructive',
        onPress: () => clearSleepTimer(),
      });
    }

    for (const preset of SLEEP_TIMER_PRESETS_MS) {
      buttons.push({
        text: preset.label,
        onPress: () => setSleepTimer(preset.durationMs),
      });
    }

    const remainingTrackMs = Math.max(0, durationMs - positionMs);
    if (remainingTrackMs > 1000) {
      buttons.push({
        text: 'End of track',
        onPress: () => setSleepTimer(remainingTrackMs),
      });
    }

    buttons.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert(
      'Sleep timer',
      sleepTimerEndsAt != null && remainingLabel
        ? `Stops playback in ${remainingLabel}.`
        : 'Pause playback after the selected time.',
      buttons,
    );
  };

  const onMore = () => {
    const buttons: {
      text: string;
      style?: 'cancel' | 'destructive' | 'default';
      onPress?: () => void;
    }[] = [
      {
        text: 'Up next',
        onPress: () => router.push('/queue' as Href),
      },
      {
        text:
          sleepTimerEndsAt != null && remainingLabel
            ? `Sleep timer · ${remainingLabel}`
            : 'Sleep timer',
        onPress: showSleepTimerPicker,
      },
    ];

    if (trackId) {
      buttons.push({
        text: 'Edit track',
        onPress: () => router.push(`/track/${encodeURIComponent(trackId)}/edit` as Href),
      });
    }

    buttons.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert('Track', undefined, buttons);
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
        accessibilityLabel={
          remainingLabel ? `More options, sleep timer ${remainingLabel} remaining` : 'More options'
        }
        hitSlop={12}
        onPress={onMore}
        style={styles.side}
      >
        <Ionicons
          name={sleepTimerEndsAt != null ? 'moon' : 'ellipsis-horizontal'}
          size={22}
          color={sleepTimerEndsAt != null ? colors.accent : colors.textSecondary}
        />
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
