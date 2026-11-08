import { Text, type StyleProp, type TextProps, type TextStyle } from 'react-native';

import { Typography, type TypographyVariant } from '@/constants/theme';
import { useTheme } from '@/store/theme-provider';

type TextTone = 'default' | 'secondary' | 'muted' | 'accent';

type AppTextProps = Omit<TextProps, 'style'> & {
  children: TextProps['children'];
  variant?: TypographyVariant;
  tone?: TextTone;
  style?: StyleProp<TextStyle>;
};

export function AppText({
  children,
  variant = 'body',
  tone = 'default',
  style,
  ...rest
}: AppTextProps) {
  const { colors } = useTheme();

  const color =
    tone === 'secondary'
      ? colors.textSecondary
      : tone === 'muted'
        ? colors.textMuted
        : tone === 'accent'
          ? colors.accent
          : colors.text;

  return (
    <Text {...rest} style={[Typography[variant], { color }, style]}>
      {children}
    </Text>
  );
}
