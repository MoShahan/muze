import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import { FolderListItem } from '@/components/library/folder-list-item';
import { LibraryBrowser } from '@/components/library/library-browser';
import { useFolderRows } from '@/hooks/use-folder-rows';
import { formatCountLabel, matchesLibraryQuery } from '@/lib/library/filter';
import { useLibraryVisibility } from '@/store/library-visibility-provider';

import type { FolderRow } from '@/lib/db/folders';

export default function FoldersScreen() {
  const { isFolderIncluded } = useLibraryVisibility();
  const { folders, isLoading, refresh } = useFolderRows();
  const [query, setQuery] = useState('');

  const filtered = useMemo(
    () =>
      folders.filter(
        (folder) =>
          isFolderIncluded(folder.path) &&
          (matchesLibraryQuery(folder.name, query) || matchesLibraryQuery(folder.path, query)),
      ),
    [folders, query, isFolderIncluded],
  );

  const onPressFolder = useCallback((id: string) => {
    router.push(`/folder/${encodeURIComponent(id)}`);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: FolderRow }) => (
      <FolderListItem
        id={item.id}
        name={item.name}
        path={item.path}
        trackCountLabel={formatCountLabel(item.trackCount, 'track')}
        onPressId={onPressFolder}
      />
    ),
    [onPressFolder],
  );

  return (
    <LibraryBrowser
      title="Folders"
      statusMessage={formatCountLabel(filtered.length, 'folder')}
      searchValue={query}
      onSearchChange={setQuery}
      searchPlaceholder="Search folders"
      data={filtered}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      emptyTitle={
        isLoading ? 'Loading folders…' : query.trim() ? 'No matching folders' : 'No folders yet'
      }
      emptySubtitle={
        isLoading
          ? 'Grouped from device paths after a library scan.'
          : query.trim()
            ? 'Try a different folder name.'
            : 'Scan from Songs first. Folder paths come from file location or MediaStore albums.'
      }
      refreshing={isLoading}
      onRefresh={() => {
        void refresh();
      }}
      onBack={() => router.back()}
    />
  );
}
