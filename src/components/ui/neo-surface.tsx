import { type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Radius, neoPressedShadow, neoRaisedShadow } from '@/constants/theme';
import { useTheme } from '@/store/theme-provider';

export type NeoSurfaceVariant = 'raised' | 'pressed' | 'flat' | 'ghost';

type NeoSurfaceProps = {
  children?: ReactNode;
  variant?: NeoSurfaceVariant;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

export function NeoSurface({
  children,
  variant = 'raised',
  radius = Radius.lg,
  style,
}: NeoSurfaceProps) {
  const { colors } = useTheme();

  const backgroundColor =
    variant === 'pressed'
      ? colors.surfacePressed
      : variant === 'flat'
        ? colors.surface
        : variant === 'ghost'
          ? 'transparent'
          : colors.surfaceRaised;

  const shadow =
    variant === 'raised'
      ? neoRaisedShadow(colors)
      : variant === 'pressed'
        ? neoPressedShadow(colors)
        : null;

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor,
          borderRadius: radius,
        },
        shadow,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderCurve: 'continuous',
  },
});
