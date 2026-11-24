import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { LibraryArtwork } from '@/components/library/library-artwork';
import { AppText } from '@/components/ui/app-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/store/theme-provider';

const ART_SIZE = 48;

type QueueTrackRowProps = {
  title: string;
  artist: string;
  artworkUri: string | null | undefined;
  isCurrent?: boolean;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onPress?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onRemove?: () => void;
};

export const QueueTrackRow = memo(function QueueTrackRow({
  title,
  artist,
  artworkUri,
  isCurrent = false,
  canMoveUp = false,
  canMoveDown = false,
  onPress,
  onMoveUp,
  onMoveDown,
  onRemove,
}: QueueTrackRowProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          isCurrent ? `Now playing ${title} by ${artist}` : `Play ${title} by ${artist}`
        }
        onPress={onPress}
        disabled={!onPress}
        style={styles.main}
      >
        <LibraryArtwork uri={artworkUri ?? null} size={ART_SIZE} round />
        <View style={styles.copy}>
          <AppText variant="bodyStrong" numberOfLines={1} tone={isCurrent ? 'accent' : 'default'}>
            {title}
          </AppText>
          <AppText variant="caption" tone="secondary" numberOfLines={1}>
            {isCurrent ? `Now playing · ${artist}` : artist}
          </AppText>
        </View>
      </Pressable>

      {!isCurrent ? (
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Move ${title} up`}
            hitSlop={8}
            disabled={!canMoveUp}
            onPress={onMoveUp}
            style={styles.iconHit}
          >
            <Ionicons
              name="chevron-up"
              size={20}
              color={canMoveUp ? colors.textSecondary : colors.textMuted}
            />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Move ${title} down`}
            hitSlop={8}
            disabled={!canMoveDown}
            onPress={onMoveDown}
            style={styles.iconHit}
          >
            <Ionicons
              name="chevron-down"
              size={20}
              color={canMoveDown ? colors.textSecondary : colors.textMuted}
            />
          </Pressable>
          {onRemove ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Remove ${title} from queue`}
              hitSlop={8}
              onPress={onRemove}
              style={styles.iconHit}
            >
              <Ionicons name="close" size={18} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    minHeight: 64,
  },
  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    minWidth: 0,
  },
  copy: {
    flex: 1,
    gap: Spacing.half,
    minWidth: 0,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconHit: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
