import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { NeoCard } from '@/components/ui/neo-card';
import { NeoSurface } from '@/components/ui/neo-surface';
import { Radius, Spacing } from '@/constants/theme';

type LibraryStatusCardProps = {
  title: string;
  subtitle: string;
  /** Optional primary action (Allow access, Open Settings, Rescan, etc.). */
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
  /** Visual emphasis for failures vs ordinary empty states. */
  tone?: 'neutral' | 'error';
};

/** Friendly empty / error card for library lists (not a blank FlashList). */
export function LibraryStatusCard({
  title,
  subtitle,
  actionLabel,
  onAction,
  actionDisabled = false,
  tone = 'neutral',
}: LibraryStatusCardProps) {
  return (
    <NeoCard style={styles.card} variant={tone === 'error' ? 'pressed' : 'raised'}>
      <View style={styles.copy}>
        <AppText variant="bodyStrong">{title}</AppText>
        <AppText variant="subtitle" tone="secondary">
          {subtitle}
        </AppText>
      </View>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={onAction}
          disabled={actionDisabled}
        >
          <NeoSurface variant="pressed" radius={Radius.md} style={styles.action}>
            <AppText variant="label">{actionLabel}</AppText>
          </NeoSurface>
        </Pressable>
      ) : null}
    </NeoCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.three,
  },
  copy: {
    gap: Spacing.two,
  },
  action: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
});
