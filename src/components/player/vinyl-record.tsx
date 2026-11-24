import { Image } from 'expo-image';
import { useEffect, useId, useMemo } from 'react';
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
import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

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

/** Thin black rim only - a few grooves outside the large center label (~0.76). */
const GROOVE_RATIOS = [0.96, 0.9, 0.84];

/** Degrees: over the grooves while playing; parked just off the rim when paused. */
const ARM_PLAYING_DEG = 26;
const ARM_RESTING_DEG = -22;

/** SVG canvas for the modern industrial tonearm (pivot near top-right of viewBox). */
const ARM_VB_W = 96;
const ARM_VB_H = 220;
const ARM_PIVOT_X = 68;
const ARM_PIVOT_Y = 28;

type TonearmSvgProps = {
  width: number;
  height: number;
  isDark: boolean;
};

/**
 * Sleek modern tonearm matching the reference: matte metal tube from a
 * top-right mount into an angular headshell + stylus. Drawn in local SVG
 * space with the pivot at (ARM_PIVOT_X, ARM_PIVOT_Y).
 */
function TonearmSvg({ width, height, isDark }: TonearmSvgProps) {
  const rawId = useId().replace(/:/g, '');
  const metalId = `armMetal-${rawId}`;
  const headId = `armHead-${rawId}`;
  const shadeId = `armShade-${rawId}`;

  const metal = useMemo(
    () =>
      isDark
        ? { a: '#9A9EA6', b: '#D4D7DE', c: '#6E737C', tip: '#E8EAEE' }
        : { a: '#5A5F68', b: '#8A909A', c: '#3A3E46', tip: '#C4C8D0' },
    [isDark],
  );

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${ARM_VB_W} ${ARM_VB_H}`}>
      <Defs>
        <LinearGradient id={metalId} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={metal.c} />
          <Stop offset="0.35" stopColor={metal.b} />
          <Stop offset="0.55" stopColor={metal.tip} />
          <Stop offset="1" stopColor={metal.a} />
        </LinearGradient>
        <LinearGradient id={headId} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={metal.b} />
          <Stop offset="0.5" stopColor={metal.a} />
          <Stop offset="1" stopColor={metal.c} />
        </LinearGradient>
        <LinearGradient id={shadeId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="rgba(0,0,0,0)" />
          <Stop offset="1" stopColor="rgba(0,0,0,0.35)" />
        </LinearGradient>
      </Defs>

      {/* Soft contact shadow under the whole arm */}
      <Path
        d={`M ${ARM_PIVOT_X + 2} ${ARM_PIVOT_Y + 4}
            C ${ARM_PIVOT_X + 6} ${ARM_PIVOT_Y + 70},
              ${ARM_PIVOT_X - 8} ${ARM_PIVOT_Y + 120},
              ${ARM_PIVOT_X - 28} ${ARM_PIVOT_Y + 168}
            L ${ARM_PIVOT_X - 18} ${ARM_PIVOT_Y + 176}
            C ${ARM_PIVOT_X + 2} ${ARM_PIVOT_Y + 126},
              ${ARM_PIVOT_X + 14} ${ARM_PIVOT_Y + 74},
              ${ARM_PIVOT_X + 10} ${ARM_PIVOT_Y + 6}
            Z`}
        fill="rgba(0,0,0,0.28)"
      />

      {/* Mount plate */}
      <Circle cx={ARM_PIVOT_X} cy={ARM_PIVOT_Y} r={16} fill={metal.c} />
      <Circle cx={ARM_PIVOT_X} cy={ARM_PIVOT_Y} r={13.5} fill={`url(#${metalId})`} />
      <Circle
        cx={ARM_PIVOT_X}
        cy={ARM_PIVOT_Y}
        r={13.5}
        fill="none"
        stroke={metal.tip}
        strokeWidth={0.6}
        opacity={0.35}
      />
      <Circle cx={ARM_PIVOT_X} cy={ARM_PIVOT_Y} r={7} fill={metal.c} />
      <Circle cx={ARM_PIVOT_X} cy={ARM_PIVOT_Y} r={4.2} fill={`url(#${metalId})`} />
      <Circle cx={ARM_PIVOT_X} cy={ARM_PIVOT_Y} r={1.6} fill={metal.tip} opacity={0.7} />

      {/* Counterweight stub (short, modern - sits behind the mount) */}
      <G>
        <Rect
          x={ARM_PIVOT_X - 5}
          y={ARM_PIVOT_Y - 26}
          width={10}
          height={18}
          rx={3}
          fill={`url(#${metalId})`}
        />
        <Rect
          x={ARM_PIVOT_X - 7}
          y={ARM_PIVOT_Y - 30}
          width={14}
          height={8}
          rx={3.5}
          fill={metal.a}
        />
        <Rect
          x={ARM_PIVOT_X - 5}
          y={ARM_PIVOT_Y - 28}
          width={6}
          height={4}
          rx={1.5}
          fill={metal.tip}
          opacity={0.35}
        />
      </G>

      {/* Main tube - gentle S-curve into the grooves */}
      <Path
        d={`M ${ARM_PIVOT_X} ${ARM_PIVOT_Y + 12}
            C ${ARM_PIVOT_X + 4} ${ARM_PIVOT_Y + 55},
              ${ARM_PIVOT_X + 2} ${ARM_PIVOT_Y + 95},
              ${ARM_PIVOT_X - 10} ${ARM_PIVOT_Y + 132}
            C ${ARM_PIVOT_X - 18} ${ARM_PIVOT_Y + 152},
              ${ARM_PIVOT_X - 26} ${ARM_PIVOT_Y + 162},
              ${ARM_PIVOT_X - 34} ${ARM_PIVOT_Y + 168}`}
        stroke={`url(#${metalId})`}
        strokeWidth={7}
        strokeLinecap="round"
        fill="none"
      />
      {/* Specular ridge along the tube */}
      <Path
        d={`M ${ARM_PIVOT_X - 1.5} ${ARM_PIVOT_Y + 14}
            C ${ARM_PIVOT_X + 2} ${ARM_PIVOT_Y + 56},
              ${ARM_PIVOT_X} ${ARM_PIVOT_Y + 96},
              ${ARM_PIVOT_X - 12} ${ARM_PIVOT_Y + 132}
            C ${ARM_PIVOT_X - 19} ${ARM_PIVOT_Y + 150},
              ${ARM_PIVOT_X - 26} ${ARM_PIVOT_Y + 160},
              ${ARM_PIVOT_X - 33} ${ARM_PIVOT_Y + 166}`}
        stroke={metal.tip}
        strokeWidth={1.6}
        strokeLinecap="round"
        fill="none"
        opacity={0.45}
      />
      {/* Underside shade on the tube */}
      <Path
        d={`M ${ARM_PIVOT_X + 1.8} ${ARM_PIVOT_Y + 14}
            C ${ARM_PIVOT_X + 5.5} ${ARM_PIVOT_Y + 56},
              ${ARM_PIVOT_X + 3.5} ${ARM_PIVOT_Y + 96},
              ${ARM_PIVOT_X - 8} ${ARM_PIVOT_Y + 132}
            C ${ARM_PIVOT_X - 16} ${ARM_PIVOT_Y + 150},
              ${ARM_PIVOT_X - 24} ${ARM_PIVOT_Y + 160},
              ${ARM_PIVOT_X - 32} ${ARM_PIVOT_Y + 166}`}
        stroke={metal.c}
        strokeWidth={1.4}
        strokeLinecap="round"
        fill="none"
        opacity={0.55}
      />

      {/* Hinge collar before the headshell */}
      <Circle cx={ARM_PIVOT_X - 32} cy={ARM_PIVOT_Y + 166} r={4.2} fill={metal.a} />
      <Circle cx={ARM_PIVOT_X - 32} cy={ARM_PIVOT_Y + 166} r={2.4} fill={`url(#${metalId})`} />

      {/* Angular industrial headshell (reference: tapered gray block) */}
      <G transform={`rotate(-28 ${ARM_PIVOT_X - 32} ${ARM_PIVOT_Y + 166})`}>
        <Path
          d={`M ${ARM_PIVOT_X - 38} ${ARM_PIVOT_Y + 158}
              L ${ARM_PIVOT_X - 18} ${ARM_PIVOT_Y + 162}
              L ${ARM_PIVOT_X - 14} ${ARM_PIVOT_Y + 186}
              L ${ARM_PIVOT_X - 22} ${ARM_PIVOT_Y + 190}
              L ${ARM_PIVOT_X - 40} ${ARM_PIVOT_Y + 178}
              Z`}
          fill={`url(#${headId})`}
        />
        <Path
          d={`M ${ARM_PIVOT_X - 38} ${ARM_PIVOT_Y + 158}
              L ${ARM_PIVOT_X - 18} ${ARM_PIVOT_Y + 162}
              L ${ARM_PIVOT_X - 14} ${ARM_PIVOT_Y + 186}
              L ${ARM_PIVOT_X - 22} ${ARM_PIVOT_Y + 190}
              L ${ARM_PIVOT_X - 40} ${ARM_PIVOT_Y + 178}
              Z`}
          fill={`url(#${shadeId})`}
        />
        {/* Headshell face highlight */}
        <Path
          d={`M ${ARM_PIVOT_X - 34} ${ARM_PIVOT_Y + 162}
              L ${ARM_PIVOT_X - 22} ${ARM_PIVOT_Y + 164.5}
              L ${ARM_PIVOT_X - 20} ${ARM_PIVOT_Y + 178}
              L ${ARM_PIVOT_X - 30} ${ARM_PIVOT_Y + 176}
              Z`}
          fill={metal.tip}
          opacity={0.28}
        />
        {/* Cartridge window detail */}
        <Rect
          x={ARM_PIVOT_X - 31}
          y={ARM_PIVOT_Y + 168}
          width={10}
          height={8}
          rx={1.2}
          fill={metal.c}
          opacity={0.55}
        />
        {/* Stylus */}
        <Path
          d={`M ${ARM_PIVOT_X - 20} ${ARM_PIVOT_Y + 186}
              L ${ARM_PIVOT_X - 16} ${ARM_PIVOT_Y + 198}
              L ${ARM_PIVOT_X - 18.5} ${ARM_PIVOT_Y + 198.5}
              L ${ARM_PIVOT_X - 23} ${ARM_PIVOT_Y + 188}
              Z`}
          fill={metal.tip}
        />
        <Circle cx={ARM_PIVOT_X - 17} cy={ARM_PIVOT_Y + 198.2} r={1.3} fill="#F2F4F7" />
      </G>
    </Svg>
  );
}

export function VinylRecord({ isPlaying, artworkUri, label = 'MUZE' }: VinylRecordProps) {
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();
  // Leave side margin so the parked arm can clear the disc without leaving the screen.
  const size = Math.min(width * 0.76, 320);
  const labelSize = size * 0.76;
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
  const armDrawH = size * 0.72;
  const armDrawW = armDrawH * (ARM_VB_W / ARM_VB_H);
  const pivotDrawX = armDrawW * (ARM_PIVOT_X / ARM_VB_W);
  const pivotDrawY = armDrawH * (ARM_PIVOT_Y / ARM_VB_H);
  // Pivot on the upper-right rim; rest swing parks just outside without leaving the screen.
  const pivotOnDiscX = size * 0.86;
  const pivotOnDiscY = size * 0.05;
  // Cap pad to remaining screen margin so the wrap never wider than the display.
  const parkPad = Math.min(size * 0.1, Math.max(0, (width - size) / 2));

  return (
    <View style={[styles.wrap, { width: size + parkPad * 2, height: size }]}>
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

      {/* Tonearm pivots from top-right of the disc; does not rotate with the disc. */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.armSwing,
          {
            width: armDrawW,
            height: armDrawH,
            left: parkPad + pivotOnDiscX - pivotDrawX + 24,
            top: pivotOnDiscY - pivotDrawY,
            transformOrigin: `${pivotDrawX}px ${pivotDrawY}px`,
          },
          armStyle,
        ]}
      >
        <TonearmSvg width={armDrawW} height={armDrawH} isDark={isDark} />
      </Animated.View>
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
  armSwing: {
    position: 'absolute',
    zIndex: 3,
  },
});
