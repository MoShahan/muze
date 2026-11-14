import { Image } from 'expo-image';
import { useEffect } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Spacing, neoRaisedShadow } from '@/constants/theme';
import { artworkDisplayUri } from '@/lib/db/tracks';
import { useTheme } from '@/store/theme-provider';

type VinylRecordProps = {
  isPlaying: boolean;
  /** Cached album art for the disc center label. */
  artworkUri?: string | null;
  /** Fallback center text when art is missing. */
  label?: string;
};

const GROOVE_RATIOS = [0.92, 0.84, 0.76, 0.68, 0.6, 0.52];

/** Degrees: over the grooves while playing; just outside the disc when paused. */
const ARM_PLAYING_DEG = 32;
const ARM_RESTING_DEG = -6;

export function VinylRecord({ isPlaying, artworkUri, label = 'MUZE' }: VinylRecordProps) {
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const size = Math.min(width * 0.72, 300);
  const labelSize = size * 0.38;
  const spindleSize = size * 0.06;
  const artUri = artworkDisplayUri(artworkUri);
  const rotation = useSharedValue(0);
  const armDown = useSharedValue(isPlaying ? 1 : 0);

  useEffect(() => {
    armDown.set(withTiming(isPlaying ? 1 : 0, { duration: 420, easing: Easing.out(Easing.cubic) }));
  }, [armDown, isPlaying]);

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

  const armStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: `${interpolate(armDown.get(), [0, 1], [ARM_RESTING_DEG, ARM_PLAYING_DEG])}deg`,
      },
    ],
  }));

  const discColor = isDark ? '#121417' : '#1A1D22';
  const grooveColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.08)';
  const armColor = isDark ? '#C8CAD0' : '#4A4E56';
  const armMuted = isDark ? '#8A8E96' : '#6B7078';
  const pivotSize = size * 0.11;
  const armLength = size * 0.52;
  // Extra side room so the parked arm tip can sit just outside the disc without clipping.
  const sidePad = pivotSize * 1.1;

  return (
    <View style={[styles.wrap, { width: size + sidePad * 2, height: size }]}>
      <View style={[styles.discShadow, { width: size, height: size }, neoRaisedShadow(colors)]}>
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
            {artUri ? (
              <Image
                source={{ uri: artUri }}
                style={{
                  width: labelSize,
                  height: labelSize,
                  borderRadius: labelSize / 2,
                }}
                contentFit="cover"
                recyclingKey={artUri}
                transition={160}
              />
            ) : (
              <Text style={[styles.labelText, { color: colors.text }]}>{label}</Text>
            )}
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

      {/* Tonearm pivots from top-right; does not rotate with the disc. */}
      <View
        pointerEvents="none"
        style={[
          styles.armAnchor,
          {
            top: 0,
            right: 0,
            width: pivotSize,
            height: pivotSize,
          },
        ]}
      >
        <View
          style={[
            styles.armPivot,
            {
              width: pivotSize,
              height: pivotSize,
              borderRadius: pivotSize / 2,
              backgroundColor: colors.surfaceRaised,
              borderColor: armMuted,
            },
            neoRaisedShadow(colors),
          ]}
        />
        <Animated.View style={[styles.armSwing, armStyle]}>
          <View
            style={[
              styles.armShaft,
              {
                width: 5,
                height: armLength,
                backgroundColor: armColor,
                borderRadius: 2.5,
              },
            ]}
          />
          <View
            style={[
              styles.armHead,
              {
                backgroundColor: armMuted,
                borderColor: armColor,
              },
            ]}
          />
          <View style={[styles.armNeedle, { backgroundColor: armColor }]} />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  discShadow: {
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
    overflow: 'hidden',
  },
  labelText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
  },
  spindle: {
    position: 'absolute',
    zIndex: 1,
  },
  armAnchor: {
    position: 'absolute',
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  armPivot: {
    borderWidth: StyleSheet.hairlineWidth,
    zIndex: 2,
  },
  armSwing: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 5,
    marginLeft: -2.5,
    alignItems: 'center',
    transformOrigin: 'top',
  },
  armShaft: {
    boxShadow: '1px 2px 4px rgba(0,0,0,0.35)',
  },
  armHead: {
    width: 18,
    height: 28,
    marginTop: -4,
    borderRadius: 4,
    borderCurve: 'continuous',
    borderWidth: StyleSheet.hairlineWidth,
    transform: [{ rotate: '18deg' }],
  },
  armNeedle: {
    width: 2,
    height: 14,
    marginTop: -2,
    borderRadius: 1,
  },
});
