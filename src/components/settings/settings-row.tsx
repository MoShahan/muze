import { type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Spacing } from '@/constants/theme';

type SettingsRowProps = {
  title: string;
  detail?: string;
  hint?: string;
  onPress?: () => void;
  trailing?: ReactNode;
  accessibilityLabel?: string;
};

/** Flat settings row: title/hint on the left, detail or custom trailing on the right. */
export function SettingsRow({
  title,
  detail,
  hint,
  onPress,
  trailing,
  accessibilityLabel,
}: SettingsRowProps) {
  const content = (
    <View style={styles.row}>
      <View style={styles.copy}>
        <AppText variant="bodyStrong">{title}</AppText>
        {hint ? (
          <AppText variant="caption" tone="muted">
            {hint}
          </AppText>
        ) : null}
      </View>
      {trailing ??
        (detail != null ? (
          <AppText variant="label" tone="secondary">
            {detail}
          </AppText>
        ) : null)}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
        onPress={onPress}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
  },
  copy: {
    flex: 1,
    gap: Spacing.half,
    minWidth: 0,
  },
});
