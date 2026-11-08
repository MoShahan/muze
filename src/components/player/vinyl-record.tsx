import { useEffect } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Spacing, neoRaisedShadow } from '@/constants/theme';
import { useTheme } from '@/store/theme-provider';

type VinylRecordProps = {
  isPlaying: boolean;
  label?: string;
};

const GROOVE_RATIOS = [0.92, 0.84, 0.76, 0.68, 0.6, 0.52];

export function VinylRecord({ isPlaying, label = 'MUZE' }: VinylRecordProps) {
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const size = Math.min(width * 0.72, 300);
  const labelSize = size * 0.38;
  const spindleSize = size * 0.06;
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (!isPlaying) {
      cancelAnimation(rotation);
      return;
    }

    rotation.set(
      withRepeat(
        withTiming(rotation.get() + 360, {
          duration: 14000,
          easing: Easing.linear,
        }),
        -1,
        false,
      ),
    );
  }, [isPlaying, rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.get()}deg` }],
  }));

  const discColor = isDark ? '#121417' : '#1A1D22';
  const grooveColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.08)';

  return (
    <View style={[styles.wrap, { width: size, height: size }, neoRaisedShadow(colors)]}>
      <Animated.View
        style={[
          styles.disc,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: discColor,
          },
          animatedStyle,
        ]}
      >
        {GROOVE_RATIOS.map((ratio) => {
          const grooveSize = size * ratio;
          return (
            <View
              key={ratio}
              pointerEvents="none"
              style={[
                styles.groove,
                {
                  width: grooveSize,
                  height: grooveSize,
                  borderRadius: grooveSize / 2,
                  borderColor: grooveColor,
                },
              ]}
            />
          );
        })}

        <View
          style={[
            styles.label,
            {
              width: labelSize,
              height: labelSize,
              borderRadius: labelSize / 2,
              backgroundColor: colors.surfaceRaised,
            },
          ]}
        >
          <Text style={[styles.labelText, { color: colors.text }]}>{label}</Text>
          <View
            style={[
              styles.spindle,
              {
                width: spindleSize,
                height: spindleSize,
                borderRadius: spindleSize / 2,
                backgroundColor: discColor,
              },
            ]}
          />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
  },
  disc: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  groove: {
    position: 'absolute',
    borderWidth: StyleSheet.hairlineWidth,
  },
  label: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  labelText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
  },
  spindle: {
    position: 'absolute',
  },
});
