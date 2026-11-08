import { type ReactNode } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';

import { AppText } from './app-text';
import { NeoSurface, type NeoSurfaceVariant } from './neo-surface';

type NeoCardProps = {
  children?: ReactNode;
  variant?: NeoSurfaceVariant;
  style?: StyleProp<ViewStyle>;
};

export function NeoCard({ children, variant = 'raised', style }: NeoCardProps) {
  return (
    <NeoSurface variant={variant} radius={Radius.lg} style={[styles.card, style]}>
      {children}
    </NeoSurface>
  );
}

type NeoCardTitleProps = {
  children: string;
};

export function NeoCardTitle({ children }: NeoCardTitleProps) {
  return <AppText variant="bodyStrong">{children}</AppText>;
}

type NeoCardSubtitleProps = {
  children: string;
};

export function NeoCardSubtitle({ children }: NeoCardSubtitleProps) {
  return (
    <AppText variant="caption" tone="muted">
      {children}
    </AppText>
  );
}

NeoCard.Title = NeoCardTitle;
NeoCard.Subtitle = NeoCardSubtitle;

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.half,
  },
});
