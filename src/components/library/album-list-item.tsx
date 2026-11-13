import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { LibraryArtwork } from '@/components/library/library-artwork';
import { AppText } from '@/components/ui/app-text';
import { Spacing } from '@/constants/theme';

const ART_SIZE = 56;

type AlbumListItemProps = {
  id: string;
  title: string;
  artist: string;
  trackCountLabel: string;
  artworkUri: string | null;
  onPressId: (id: string) => void;
};

export const AlbumListItem = memo(function AlbumListItem({
  id,
  title,
  artist,
  trackCountLabel,
  artworkUri,
  onPressId,
}: AlbumListItemProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title} by ${artist}`}
      onPress={() => onPressId(id)}
      style={styles.row}
    >
      <LibraryArtwork uri={artworkUri} size={ART_SIZE} />
      <View style={styles.copy}>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {title}
        </AppText>
        <AppText variant="caption" tone="secondary" numberOfLines={1}>
          {artist} · {trackCountLabel}
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
    minHeight: 72,
  },
  copy: {
    flex: 1,
    gap: Spacing.half,
    minWidth: 0,
  },
});
