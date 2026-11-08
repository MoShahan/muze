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

import { formatTrackTime } from '@/constants/mock-player';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/store/theme-provider';

type WaveformSeekbarProps = {
  peaks: number[];
  progress: number;
  durationMs: number;
  onSeek: (progress: number) => void;
};

export function WaveformSeekbar({ peaks, progress, durationMs, onSeek }: WaveformSeekbarProps) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);

  const clampProgress = (value: number) => Math.min(1, Math.max(0, value));

  const seekFromX = (x: number) => {
    if (width <= 0) return;
    onSeek(clampProgress(x / width));
  };

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
  const height = 56;
  const elapsedMs = durationMs * progress;

  return (
    <View style={styles.container}>
      <GestureDetector gesture={gesture}>
        <View style={styles.waveHit} onLayout={onLayout}>
          {width > 0 ? (
            <Svg width={width} height={height}>
              {peaks.map((peak, index) => {
                const barHeight = Math.max(4, peak * height);
                const x = index * (barWidth + gap);
                const y = (height - barHeight) / 2;
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
          ) : null}
        </View>
      </GestureDetector>

      <View style={styles.times}>
        <Text style={[styles.time, { color: colors.textMuted }]}>{formatTrackTime(elapsedMs)}</Text>
        <Text style={[styles.time, { color: colors.textMuted }]}>
          {formatTrackTime(durationMs)}
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
    height: 56,
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
