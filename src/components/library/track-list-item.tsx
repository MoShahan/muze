import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { LibraryArtwork } from '@/components/library/library-artwork';
import { AppText } from '@/components/ui/app-text';
import { Spacing } from '@/constants/theme';

const ART_SIZE = 48;

type TrackListItemProps = {
  id: string;
  title: string;
  artist: string;
  durationLabel: string;
  artworkUri: string | null;
  onPressId: (id: string) => void;
  onLongPressId?: (id: string) => void;
  trailingLabel?: string;
};

export const TrackListItem = memo(function TrackListItem({
  id,
  title,
  artist,
  durationLabel,
  artworkUri,
  onPressId,
  onLongPressId,
  trailingLabel,
}: TrackListItemProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title} by ${artist}`}
      onPress={() => onPressId(id)}
      onLongPress={onLongPressId ? () => onLongPressId(id) : undefined}
      style={styles.row}
    >
      <LibraryArtwork uri={artworkUri} size={ART_SIZE} round />
      <View style={styles.copy}>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {title}
        </AppText>
        <AppText variant="caption" tone="secondary" numberOfLines={1}>
          {artist}
        </AppText>
      </View>
      <AppText variant="caption" tone="muted">
        {trailingLabel ?? durationLabel}
      </AppText>
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
