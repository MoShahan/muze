import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { LibraryArtwork } from '@/components/library/library-artwork';
import { AppText } from '@/components/ui/app-text';
import { Spacing } from '@/constants/theme';

const ART_SIZE = 48;

type ArtistListItemProps = {
  id: string;
  name: string;
  detailLabel: string;
  onPressId: (id: string) => void;
};

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
      <LibraryArtwork uri={null} size={ART_SIZE} round />
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
    gap: Spacing.three,
    paddingVertical: Spacing.two,
    minHeight: 64,
  },
  copy: {
    flex: 1,
    gap: Spacing.half,
    minWidth: 0,
  },
});
