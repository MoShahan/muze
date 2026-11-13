import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Spacing } from '@/constants/theme';

type FolderListItemProps = {
  id: string;
  name: string;
  path: string;
  trackCountLabel: string;
  onPressId: (id: string) => void;
};

/** Folders have no cover art — name, path, and count only. */
export const FolderListItem = memo(function FolderListItem({
  id,
  name,
  path,
  trackCountLabel,
  onPressId,
}: FolderListItemProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${name} folder`}
      onPress={() => onPressId(id)}
      style={styles.row}
    >
      <View style={styles.copy}>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {name}
        </AppText>
        <AppText variant="caption" tone="secondary" numberOfLines={1}>
          {path}
        </AppText>
        <AppText variant="caption" tone="muted">
          {trackCountLabel}
        </AppText>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    minHeight: 64,
  },
  copy: {
    flex: 1,
    gap: Spacing.half,
    minWidth: 0,
  },
});
