/**
 * Profile display-name hook.
 *
 * Loads the Settings-stored name (default Melophile) for UI that needs it —
 * e.g. the Songs greeting. Exists so greeting/header copy does not query
 * SQLite settings inline or drift from the Settings editor.
 */
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';

import { DEFAULT_DISPLAY_NAME, getDisplayName } from '@/lib/db/settings';

export function useDisplayName() {
  const db = useSQLiteContext();
  const [displayName, setDisplayNameState] = useState(DEFAULT_DISPLAY_NAME);

  const refresh = useCallback(async () => {
    await Promise.resolve();
    const next = await getDisplayName(db);
    setDisplayNameState(next);
    return next;
  }, [db]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (cancelled) {
        return;
      }
      const next = await getDisplayName(db);
      if (!cancelled) {
        setDisplayNameState(next);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [db]);

  return { displayName, refresh };
}
