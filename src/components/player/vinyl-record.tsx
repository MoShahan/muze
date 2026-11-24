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
import Svg, { Circle, Ellipse, Line, Path, Rect } from 'react-native-svg';

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

/** Groove rings sit outside the enlarged center label (~0.52). */
const GROOVE_RATIOS = [0.96, 0.9, 0.84, 0.76, 0.68, 0.6];

/** Degrees: over the grooves while playing; just outside the disc when paused. */
const ARM_PLAYING_DEG = 32;
const ARM_RESTING_DEG = -6;

const ARM_SVG_W = 52;
const COUNTER_H = 30;

export function VinylRecord({ isPlaying, artworkUri, label = 'MUZE' }: VinylRecordProps) {
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const size = Math.min(width * 0.72, 300);
  const labelSize = size * 0.52;
  const spindleSize = size * 0.055;
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
  const armHighlight = isDark ? '#E4E6EC' : '#7A8088';
  const pivotSize = size * 0.11;
  const armLength = size * 0.52;
  const svgHeight = armLength + COUNTER_H;
  // Extra side room so the parked arm tip can sit just outside the disc without clipping.
  const sidePad = pivotSize * 1.1;
  const shaftEnd = COUNTER_H + armLength - 34;
  const headY = shaftEnd;
  const tipY = svgHeight - 4;

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
        <Animated.View
          style={[
            styles.armSwing,
            {
              width: ARM_SVG_W,
              marginLeft: -ARM_SVG_W / 2,
              marginTop: -COUNTER_H,
              // Rotate around the pivot collar, not the counterweight tip.
              transformOrigin: `${ARM_SVG_W / 2}px ${COUNTER_H}px`,
            },
            armStyle,
          ]}
        >
          <Svg width={ARM_SVG_W} height={svgHeight} viewBox={`0 0 ${ARM_SVG_W} ${svgHeight}`}>
            {/* Counterweight behind the pivot */}
            <Ellipse cx={26} cy={11} rx={11} ry={8} fill={armMuted} />
            <Ellipse cx={24} cy={10} rx={7} ry={5} fill={armHighlight} opacity={0.35} />
            <Rect x={22} y={16} width={8} height={COUNTER_H - 18} rx={2.5} fill={armColor} />

            {/* Pivot collar */}
            <Circle cx={26} cy={COUNTER_H} r={5.5} fill={armMuted} />
            <Circle cx={26} cy={COUNTER_H} r={3} fill={armColor} />

            {/* Tapered shaft */}
            <Path
              d={`M 22 ${COUNTER_H + 4}
                  L 30 ${COUNTER_H + 4}
                  L 28 ${shaftEnd}
                  L 24 ${shaftEnd}
                  Z`}
              fill={armColor}
            />
            <Path
              d={`M 24 ${COUNTER_H + 6}
                  L 27 ${COUNTER_H + 6}
                  L 26.2 ${shaftEnd - 4}
                  L 24.8 ${shaftEnd - 4}
                  Z`}
              fill={armHighlight}
              opacity={0.28}
            />

            {/* Headshell */}
            <Path
              d={`M 21 ${headY}
                  L 33 ${headY + 4}
                  L 34 ${headY + 18}
                  L 28 ${headY + 22}
                  L 20 ${headY + 14}
                  Z`}
              fill={armMuted}
              stroke={armColor}
              strokeWidth={1}
            />
            <Path
              d={`M 24 ${headY + 6}
                  L 30 ${headY + 8}
                  L 30.5 ${headY + 15}
                  L 26 ${headY + 17}
                  Z`}
              fill={armHighlight}
              opacity={0.25}
            />

            {/* Stylus */}
            <Line
              x1={30}
              y1={headY + 20}
              x2={34}
              y2={tipY}
              stroke={armColor}
              strokeWidth={1.6}
              strokeLinecap="round"
            />
            <Circle cx={34} cy={tipY} r={1.4} fill={armHighlight} />
          </Svg>
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
    alignItems: 'center',
  },
});
