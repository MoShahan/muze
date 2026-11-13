import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { FolderListItem } from '@/components/library/folder-list-item';
import { LibraryBrowser } from '@/components/library/library-browser';
import { listFolders, type FolderRow } from '@/lib/db/folders';
import { matchesLibraryQuery } from '@/lib/library/filter';
import { useLibraryVisibility } from '@/store/library-visibility-provider';

export default function FoldersScreen() {
  const db = useSQLiteContext();
  const { isFolderIncluded, revision: visibilityRevision } = useLibraryVisibility();
  const [folders, setFolders] = useState<FolderRow[]>([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const next = await listFolders(db);
      setFolders(next);
    } finally {
      setIsLoading(false);
    }
  }, [db]);

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
  }, [db, visibilityRevision]);

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
        trackCountLabel={`${item.trackCount} track${item.trackCount === 1 ? '' : 's'}`}
        onPressId={onPressFolder}
      />
    ),
    [onPressFolder],
  );

  return (
    <LibraryBrowser
      title="Folders"
      statusMessage={`${filtered.length} folder${filtered.length === 1 ? '' : 's'}`}
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
