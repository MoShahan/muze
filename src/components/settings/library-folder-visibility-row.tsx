import { memo } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { NeoCard } from '@/components/ui/neo-card';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/store/theme-provider';

type LibraryFolderVisibilityRowProps = {
  path: string;
  name: string;
  trackCountLabel: string;
  included: boolean;
  onIncludedChange: (path: string, included: boolean) => void;
};

export const LibraryFolderVisibilityRow = memo(function LibraryFolderVisibilityRow({
  path,
  name,
  trackCountLabel,
  included,
  onIncludedChange,
}: LibraryFolderVisibilityRowProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: included }}
      accessibilityLabel={`${name}. ${included ? 'Shown' : 'Hidden'} in library`}
      onPress={() => onIncludedChange(path, !included)}
    >
      <NeoCard style={styles.row}>
        <View style={styles.copy}>
          <NeoCard.Title>{name}</NeoCard.Title>
          <NeoCard.Subtitle>{path}</NeoCard.Subtitle>
          <AppText variant="caption" tone="muted">
            {trackCountLabel}
          </AppText>
        </View>
        <Switch
          value={included}
          onValueChange={(next) => onIncludedChange(path, next)}
          trackColor={{ false: colors.border, true: colors.accentMuted }}
          thumbColor={included ? colors.accent : colors.surfaceRaised}
        />
      </NeoCard>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  copy: {
    flex: 1,
    gap: Spacing.half,
    minWidth: 0,
  },
});
