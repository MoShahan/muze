import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';

import { getLibraryCounts, type LibraryCounts } from '@/lib/db/library';

const EMPTY_COUNTS: LibraryCounts = { tracks: 0, albums: 0, artists: 0 };

/** Read current Songs / Albums / Artists row counts from SQLite. */
export function useLibraryCounts(enabled: boolean = true) {
  const db = useSQLiteContext();
  const [counts, setCounts] = useState<LibraryCounts>(EMPTY_COUNTS);
  const [isLoading, setIsLoading] = useState(enabled);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setCounts(EMPTY_COUNTS);
      setIsLoading(false);
      return EMPTY_COUNTS;
    }

    setIsLoading(true);
    try {
      const next = await getLibraryCounts(db);
      setCounts(next);
      return next;
    } finally {
      setIsLoading(false);
    }
  }, [db, enabled]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      await Promise.resolve();
      if (cancelled) {
        return;
      }

      if (!enabled) {
        setCounts(EMPTY_COUNTS);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const next = await getLibraryCounts(db);
        if (!cancelled) {
          setCounts(next);
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
  }, [db, enabled]);

  return { counts, isLoading, refresh };
}
