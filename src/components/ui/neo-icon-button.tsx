import { Ionicons } from '@expo/vector-icons';
import { type ReactNode } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { NeoSurface, type NeoSurfaceVariant } from '@/components/ui/neo-surface';
import { useTheme } from '@/store/theme-provider';

type NeoIconButtonSize = 'sm' | 'md' | 'lg';

type NeoIconButtonProps = {
  label: string;
  onPress: () => void;
  size?: NeoIconButtonSize;
  color?: string;
  variant?: NeoSurfaceVariant;
  style?: StyleProp<ViewStyle>;
  icon?: keyof typeof Ionicons.glyphMap;
  children?: ReactNode;
  disabled?: boolean;
};

const SIZE_MAP: Record<NeoIconButtonSize, { box: number; icon: number }> = {
  sm: { box: 40, icon: 18 },
  md: { box: 48, icon: 22 },
  lg: { box: 72, icon: 28 },
};

export function NeoIconButton({
  label,
  onPress,
  size = 'md',
  color,
  variant = 'raised',
  style,
  icon,
  children,
  disabled = false,
}: NeoIconButtonProps) {
  const { colors } = useTheme();
  const dims = SIZE_MAP[size];
  const iconColor = disabled ? colors.textMuted : (color ?? colors.text);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      hitSlop={8}
      onPress={onPress}
      disabled={disabled}
      style={[style, disabled ? styles.disabled : null]}
    >
      <NeoSurface
        variant={variant}
        radius={dims.box / 2}
        style={[styles.button, { width: dims.box, height: dims.box }]}
      >
        {children ?? (icon ? <Ionicons name={icon} size={dims.icon} color={iconColor} /> : null)}
      </NeoSurface>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.45,
  },
});
