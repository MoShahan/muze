import { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import {
  GestureDetector,
  usePanGesture,
  useSimultaneousGestures,
  useTapGesture,
} from 'react-native-gesture-handler';
import Svg, { Rect } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';

import { Spacing } from '@/constants/theme';
import { formatDurationMs } from '@/lib/library/filter';
import { progressFromX } from '@/lib/library/playback-math';
import { useTheme } from '@/store/theme-provider';

type WaveformSeekbarProps = {
  peaks: number[];
  progress: number;
  durationMs: number;
  onSeek: (progress: number) => void;
  /** True while real peaks load - show a flat seek line, not a fake waveform. */
  isPlaceholder?: boolean;
};

const WAVE_HEIGHT = 56;
const LINE_HEIGHT = 3;

export function WaveformSeekbar({
  peaks,
  progress,
  durationMs,
  onSeek,
  isPlaceholder = false,
}: WaveformSeekbarProps) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);

  const seekFromX = (x: number) => {
    if (width <= 0) return;
    onSeek(progressFromX(x, width));
  };

  // Gesture callbacks run on the UI thread - hop to JS before calling React state setters.
  const pan = usePanGesture({
    onBegin: (event) => {
      scheduleOnRN(seekFromX, event.x);
    },
    onUpdate: (event) => {
      scheduleOnRN(seekFromX, event.x);
    },
  });

  const tap = useTapGesture({
    onDeactivate: (event) => {
      if (event.canceled) return;
      scheduleOnRN(seekFromX, event.x);
    },
  });

  const gesture = useSimultaneousGestures(pan, tap);

  const onLayout = (event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  };

  const barCount = peaks.length;
  const gap = 2;
  const barWidth = width > 0 && barCount > 0 ? (width - gap * (barCount - 1)) / barCount : 0;
  const elapsedMs = durationMs * progress;
  const lineY = (WAVE_HEIGHT - LINE_HEIGHT) / 2;
  const playedWidth = Math.max(0, Math.min(width, width * progress));

  return (
    <View style={styles.container}>
      <GestureDetector gesture={gesture}>
        <View
          style={styles.waveHit}
          onLayout={onLayout}
          accessibilityLabel={isPlaceholder ? 'Loading waveform' : 'Waveform seek bar'}
        >
          {width > 0 ? (
            isPlaceholder ? (
              <Svg width={width} height={WAVE_HEIGHT}>
                <Rect
                  x={0}
                  y={lineY}
                  width={width}
                  height={LINE_HEIGHT}
                  rx={LINE_HEIGHT / 2}
                  fill={colors.waveformRemaining}
                />
                {playedWidth > 0 ? (
                  <Rect
                    x={0}
                    y={lineY}
                    width={playedWidth}
                    height={LINE_HEIGHT}
                    rx={LINE_HEIGHT / 2}
                    fill={colors.waveformPlayed}
                  />
                ) : null}
              </Svg>
            ) : (
              <Svg width={width} height={WAVE_HEIGHT}>
                {peaks.map((peak, index) => {
                  const barHeight = Math.max(4, peak * WAVE_HEIGHT);
                  const x = index * (barWidth + gap);
                  const y = (WAVE_HEIGHT - barHeight) / 2;
                  const played = index / barCount <= progress;
                  return (
                    <Rect
                      key={index}
                      x={x}
                      y={y}
                      width={Math.max(1, barWidth)}
                      height={barHeight}
                      rx={1}
                      fill={played ? colors.waveformPlayed : colors.waveformRemaining}
                    />
                  );
                })}
              </Svg>
            )
          ) : null}
        </View>
      </GestureDetector>

      <View style={styles.times}>
        <Text style={[styles.time, { color: colors.textMuted }]}>
          {formatDurationMs(elapsedMs)}
        </Text>
        <Text style={[styles.time, { color: colors.textMuted }]}>
          {formatDurationMs(durationMs)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  waveHit: {
    height: WAVE_HEIGHT,
    justifyContent: 'center',
  },
  times: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  time: {
    fontSize: 12,
    fontWeight: '500',
  },
});
