import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Spacing } from '@/constants/theme';

type ArtistListItemProps = {
  id: string;
  name: string;
  detailLabel: string;
  onPressId: (id: string) => void;
};

/** Artists have no portrait in tags — name + counts only (no art placeholder). */
export const ArtistListItem = memo(function ArtistListItem({
  id,
  name,
  detailLabel,
  onPressId,
}: ArtistListItemProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={name}
      onPress={() => onPressId(id)}
      style={styles.row}
    >
      <View style={styles.copy}>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {name}
        </AppText>
        <AppText variant="caption" tone="secondary" numberOfLines={1}>
          {detailLabel}
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
    minHeight: 56,
  },
  copy: {
    flex: 1,
    gap: Spacing.half,
    minWidth: 0,
  },
});
