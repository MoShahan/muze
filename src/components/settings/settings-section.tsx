import { Children, Fragment, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/store/theme-provider';

type SettingsSectionProps = {
  title: string;
  children: ReactNode;
};

/** Section label + flat rows separated by hairline dividers (no card shadows). */
export function SettingsSection({ title, children }: SettingsSectionProps) {
  const { colors } = useTheme();
  const items = Children.toArray(children).filter(Boolean);

  return (
    <View style={styles.section}>
      <AppText variant="section" tone="muted">
        {title}
      </AppText>
      <View>
        {items.map((child, index) => (
          <Fragment key={index}>
            {index > 0 ? (
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
            ) : null}
            {child}
          </Fragment>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.two,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
});
