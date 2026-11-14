import { Ionicons } from '@expo/vector-icons';
import { FlashList, type ListRenderItem } from '@shopify/flash-list';
import { type ReactElement, type ReactNode } from 'react';
import { Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LibrarySearchField } from '@/components/library/library-search-field';
import { LibraryStatusCard } from '@/components/library/library-status-card';
import { MINI_PLAYER_HEIGHT } from '@/components/player/mini-player';
import { AppText } from '@/components/ui/app-text';
import { Spacing } from '@/constants/theme';
import { usePlayback } from '@/store/playback-provider';
import { useTheme } from '@/store/theme-provider';

type LibraryBrowserProps<T> = {
  title: string;
  subtitle?: string | null;
  greeting?: string | null;
  statusMessage?: string | null;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  data: readonly T[];
  keyExtractor: (item: T) => string;
  renderItem: ListRenderItem<T>;
  emptyTitle: string;
  emptySubtitle: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  emptyTone?: 'neutral' | 'error';
  refreshing?: boolean;
  onRefresh?: () => void;
  headerExtra?: ReactNode;
  onBack?: () => void;
};

export function LibraryBrowser<T>({
  title,
  subtitle,
  greeting,
  statusMessage,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  data,
  keyExtractor,
  renderItem,
  emptyTitle,
  emptySubtitle,
  emptyActionLabel,
  onEmptyAction,
  emptyTone = 'neutral',
  refreshing = false,
  onRefresh,
  headerExtra,
  onBack,
}: LibraryBrowserProps<T>): ReactElement {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { currentTrack } = usePlayback();
  const miniPlayerPad = currentTrack ? MINI_PLAYER_HEIGHT + Spacing.three : 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.canvas }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + Spacing.three,
            paddingHorizontal: Spacing.four,
          },
        ]}
      >
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={onBack}
            hitSlop={8}
            style={styles.backRow}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
            <AppText variant="label">Back</AppText>
          </Pressable>
        ) : null}
        {greeting ? (
          <AppText variant="caption" tone="muted">
            {greeting}
          </AppText>
        ) : null}
        <AppText variant="display" numberOfLines={2}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="subtitle" tone="secondary" numberOfLines={2}>
            {subtitle}
          </AppText>
        ) : null}
        {statusMessage ? (
          <AppText variant="caption" tone="secondary">
            {statusMessage}
          </AppText>
        ) : null}
        <LibrarySearchField
          value={searchValue}
          onChangeText={onSearchChange}
          placeholder={searchPlaceholder}
        />
        {headerExtra}
      </View>

      <FlashList
        data={data}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        style={styles.list}
        contentContainerStyle={{
          paddingHorizontal: Spacing.four,
          paddingBottom: insets.bottom + Spacing.five + miniPlayerPad,
          paddingTop: Spacing.two,
        }}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
            />
          ) : undefined
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <LibraryStatusCard
              title={emptyTitle}
              subtitle={emptySubtitle}
              actionLabel={emptyActionLabel}
              onAction={onEmptyAction}
              tone={emptyTone}
            />
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    gap: Spacing.two,
    paddingBottom: Spacing.two,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half,
    alignSelf: 'flex-start',
  },
  list: {
    flex: 1,
  },
  empty: {
    paddingTop: Spacing.five,
    gap: Spacing.two,
  },
});
