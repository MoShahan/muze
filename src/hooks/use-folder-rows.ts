/**
 * Loads folder rows from SQLite and reloads when library visibility revision changes.
 */
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';

import { listFolders, type FolderRow } from '@/lib/db/folders';
import { useLibraryVisibility } from '@/store/library-visibility-provider';

type UseFolderRowsResult = {
  folders: FolderRow[];
  isLoading: boolean;
  refresh: () => Promise<void>;
};

export function useFolderRows(): UseFolderRowsResult {
  const db = useSQLiteContext();
  const { revision } = useLibraryVisibility();
  const [folders, setFolders] = useState<FolderRow[]>([]);
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
  }, [db, revision]);

  return { folders, isLoading, refresh };
}
