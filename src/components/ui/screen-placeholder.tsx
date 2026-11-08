import { StyleSheet } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { NeoCard } from '@/components/ui/neo-card';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';

type ScreenPlaceholderProps = {
  title: string;
  subtitle?: string;
};

export function ScreenPlaceholder({ title, subtitle }: ScreenPlaceholderProps) {
  return (
    <Screen contentStyle={styles.content}>
      <AppText variant="display">{title}</AppText>
      {subtitle ? (
        <NeoCard>
          <AppText variant="subtitle" tone="secondary">
            {subtitle}
          </AppText>
        </NeoCard>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.three,
  },
});
