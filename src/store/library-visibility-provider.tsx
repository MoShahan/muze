/**
 * Hidden-folder preference for library lists.
 *
 * Tracks stay in SQLite; unchecked folders are only filtered out of Songs,
 * Albums, Artists, and Folders browse until re-enabled in Settings.
 */
import { useSQLiteContext } from 'expo-sqlite';
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { getHiddenFolderPaths, setHiddenFolderPaths } from '@/lib/db/settings';

type LibraryVisibilityContextValue = {
  /** Folder paths excluded from library lists. */
  hiddenFolderPaths: ReadonlySet<string>;
  /** Bumps when the hidden set changes so list hooks can refresh. */
  revision: number;
  isLoading: boolean;
  isFolderIncluded: (folderPath: string) => boolean;
  setFolderIncluded: (folderPath: string, included: boolean) => void;
};

const LibraryVisibilityContext = createContext<LibraryVisibilityContextValue | null>(null);

export function LibraryVisibilityProvider({ children }: PropsWithChildren) {
  const db = useSQLiteContext();
  const [hiddenList, setHiddenList] = useState<string[]>([]);
  const [revision, setRevision] = useState(0);
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
        const stored = await getHiddenFolderPaths(db);
        if (!cancelled) {
          setHiddenList(stored);
          setRevision((value) => value + 1);
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
  }, [db]);

  const hiddenFolderPaths = useMemo(() => new Set(hiddenList), [hiddenList]);

  const isFolderIncluded = useCallback(
    (folderPath: string) => !hiddenFolderPaths.has(folderPath.trim()),
    [hiddenFolderPaths],
  );

  const setFolderIncluded = useCallback(
    (folderPath: string, included: boolean) => {
      const path = folderPath.trim();
      if (!path) {
        return;
      }
      setHiddenList((prev) => {
        const next = new Set(prev);
        if (included) {
          next.delete(path);
        } else {
          next.add(path);
        }
        const sorted = [...next].sort((a, b) =>
          a.localeCompare(b, undefined, { sensitivity: 'base' }),
        );
        void setHiddenFolderPaths(db, sorted);
        return sorted;
      });
      setRevision((value) => value + 1);
    },
    [db],
  );

  const value: LibraryVisibilityContextValue = {
    hiddenFolderPaths,
    revision,
    isLoading,
    isFolderIncluded,
    setFolderIncluded,
  };

  return (
    <LibraryVisibilityContext.Provider value={value}>{children}</LibraryVisibilityContext.Provider>
  );
}

export function useLibraryVisibility(): LibraryVisibilityContextValue {
  const value = use(LibraryVisibilityContext);
  if (!value) {
    throw new Error('useLibraryVisibility must be used within LibraryVisibilityProvider');
  }
  return value;
}
