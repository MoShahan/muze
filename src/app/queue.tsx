import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { QueueTrackRow } from '@/components/player/queue-track-row';
import { AppText } from '@/components/ui/app-text';
import { Spacing } from '@/constants/theme';
import { usePlayback, type PlaybackTrack } from '@/store/playback-provider';
import { useTheme } from '@/store/theme-provider';

type QueueRow =
  | { kind: 'header'; id: string; title: string }
  | { kind: 'track'; id: string; track: PlaybackTrack; index: number; isCurrent: boolean };

export default function QueueScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { queue, queueIndex, currentTrack, reorderQueue, removeFromQueue, playQueueIndex } =
    usePlayback();

  const rows = useMemo((): QueueRow[] => {
    if (queue.length === 0) {
      return [];
    }
    const next: QueueRow[] = [];
    const current = queue[queueIndex];
    if (current) {
      next.push({ kind: 'header', id: 'header-now', title: 'Now playing' });
      next.push({
        kind: 'track',
        id: `now-${current.id}-${queueIndex}`,
        track: current,
        index: queueIndex,
        isCurrent: true,
      });
    }
    const upcoming = queue
      .map((track, index) => ({ track, index }))
      .filter((item) => item.index !== queueIndex);
    if (upcoming.length > 0) {
      next.push({ kind: 'header', id: 'header-up-next', title: 'Up next' });
      for (const item of upcoming) {
        next.push({
          kind: 'track',
          id: `up-${item.track.id}-${item.index}`,
          track: item.track,
          index: item.index,
          isCurrent: false,
        });
      }
    }
    return next;
  }, [queue, queueIndex]);

  const upcomingIndexes = useMemo(
    () => queue.map((_, index) => index).filter((index) => index !== queueIndex),
    [queue, queueIndex],
  );

  const onMove = useCallback(
    (index: number, direction: -1 | 1) => {
      const position = upcomingIndexes.indexOf(index);
      if (position < 0) {
        return;
      }
      const swapWith = upcomingIndexes[position + direction];
      if (swapWith == null) {
        return;
      }
      reorderQueue(index, swapWith);
    },
    [upcomingIndexes, reorderQueue],
  );

  const renderItem = useCallback(
    ({ item }: { item: QueueRow }) => {
      if (item.kind === 'header') {
        return (
          <AppText variant="caption" tone="muted" style={styles.sectionTitle}>
            {item.title}
          </AppText>
        );
      }

      const upcomingPosition = upcomingIndexes.indexOf(item.index);
      const canMoveUp = !item.isCurrent && upcomingPosition > 0;
      const canMoveDown =
        !item.isCurrent && upcomingPosition >= 0 && upcomingPosition < upcomingIndexes.length - 1;

      return (
        <QueueTrackRow
          title={item.track.title}
          artist={item.track.artist}
          artworkUri={item.track.artworkUri}
          isCurrent={item.isCurrent}
          canMoveUp={canMoveUp}
          canMoveDown={canMoveDown}
          onPress={
            item.isCurrent
              ? undefined
              : () => {
                  playQueueIndex(item.index);
                }
          }
          onMoveUp={canMoveUp ? () => onMove(item.index, -1) : undefined}
          onMoveDown={canMoveDown ? () => onMove(item.index, 1) : undefined}
          onRemove={
            item.isCurrent
              ? undefined
              : () => {
                  removeFromQueue(item.index);
                }
          }
        />
      );
    },
    [onMove, playQueueIndex, removeFromQueue, upcomingIndexes],
  );

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: colors.canvas,
          paddingTop: insets.top + Spacing.three,
          paddingBottom: insets.bottom + Spacing.four,
        },
      ]}
    >
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close queue"
          hitSlop={12}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
              return;
            }
            router.replace('/');
          }}
          style={styles.side}
        >
          <Ionicons name="chevron-down" size={24} color={colors.textSecondary} />
        </Pressable>
        <AppText variant="label" tone="muted" style={styles.title}>
          QUEUE
        </AppText>
        <View style={styles.side} />
      </View>

      {queue.length === 0 || !currentTrack ? (
        <View style={styles.empty}>
          <AppText variant="subtitle">Nothing in the queue</AppText>
          <AppText variant="caption" tone="secondary">
            Play a song from your library to build an Up next list.
          </AppText>
        </View>
      ) : (
        <FlashList
          data={rows}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          getItemType={(item) => item.kind}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
  },
  side: {
    width: 40,
    alignItems: 'center',
  },
  title: {
    letterSpacing: 1.4,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.five,
  },
  sectionTitle: {
    paddingTop: Spacing.three,
    paddingBottom: Spacing.one,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
});
