import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LibraryFolderVisibilityRow } from '@/components/settings/library-folder-visibility-row';
import { AppText } from '@/components/ui/app-text';
import { Spacing } from '@/constants/theme';
import { listFolders, type FolderRow } from '@/lib/db/folders';
import { useLibraryVisibility } from '@/store/library-visibility-provider';
import { useTheme } from '@/store/theme-provider';

export default function LibraryFoldersScreen() {
  const db = useSQLiteContext();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { isFolderIncluded, setFolderIncluded, revision } = useLibraryVisibility();
  const [folders, setFolders] = useState<FolderRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (cancelled) {
        return;
      }
      setIsLoading(true);
      try {
        const next = await listFolders(db);
        if (!cancelled) {
          setFolders(next);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [db, revision]);

  const hiddenCount = useMemo(
    () => folders.filter((folder) => !isFolderIncluded(folder.path)).length,
    [folders, isFolderIncluded],
  );

  const onIncludedChange = useCallback(
    (path: string, included: boolean) => {
      setFolderIncluded(path, included);
    },
    [setFolderIncluded],
  );

  const renderItem = useCallback(
    ({ item }: { item: FolderRow }) => (
      <LibraryFolderVisibilityRow
        path={item.path}
        name={item.name}
        trackCountLabel={`${item.trackCount} track${item.trackCount === 1 ? '' : 's'}`}
        included={isFolderIncluded(item.path)}
        onIncludedChange={onIncludedChange}
      />
    ),
    [isFolderIncluded, onIncludedChange],
  );

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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          hitSlop={8}
          style={styles.backRow}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
          <AppText variant="label">Back</AppText>
        </Pressable>
        <AppText variant="display">Library folders</AppText>
        <AppText variant="subtitle" tone="secondary">
          Only folders that contain audio are listed. Uncheck any you do not want in Songs, Albums,
          or Artists.
        </AppText>
        <AppText variant="caption" tone="muted">
          {isLoading
            ? 'Loading folders with audio…'
            : folders.length === 0
              ? 'No audio folders yet. Scan from Songs first.'
              : `${folders.length} folder${folders.length === 1 ? '' : 's'} with audio${
                  hiddenCount > 0 ? ` (${hiddenCount} hidden)` : ''
                }`}
        </AppText>
      </View>

      <FlashList
        data={folders}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        style={styles.list}
        contentContainerStyle={{
          paddingHorizontal: Spacing.four,
          paddingBottom: insets.bottom + Spacing.five,
          paddingTop: Spacing.two,
        }}
        ItemSeparatorComponent={ListSeparator}
        ListEmptyComponent={
          isLoading ? null : (
            <View style={styles.empty}>
              <AppText variant="body" tone="secondary">
                Folders appear here after a library scan finds audio files.
              </AppText>
            </View>
          )
        }
      />
    </View>
  );
}

function ListSeparator() {
  return <View style={styles.separator} />;
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
  separator: {
    height: Spacing.two,
  },
  empty: {
    paddingTop: Spacing.five,
  },
});
