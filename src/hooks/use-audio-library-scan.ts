/**
 * Library scan orchestration hook.
 *
 * Runs the MediaLibrary audio scan in batches, upserts/caches tags + artwork,
 * then finalizes album/artist groups in SQLite. Exists so screens (mainly Songs)
 * get progress, abort-on-unmount, rescan, and a `libraryRevision` bump without
 * owning scan side effects themselves.
 *
 * Auto-scan runs only when the SQLite library is empty. Once tracks exist, the
 * Songs list is served from cache; pull-to-refresh / `rescan` walks MediaStore again.
 */
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useRef, useState } from 'react';

import { finalizeLibraryScan, getLibraryCounts, type LibraryCounts } from '@/lib/db/library';
import { getCachedTracksByIds, upsertTracks } from '@/lib/db/tracks';
import { scanAudioLibrary, type AudioScanProgress } from '@/lib/media/scan';

type ScanStatus = 'idle' | 'scanning' | 'ready' | 'error';

type UseAudioLibraryScanOptions = {
  /** When false, skip scanning (e.g. permission not granted). */
  enabled: boolean;
};

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

const EMPTY_COUNTS: LibraryCounts = { tracks: 0, albums: 0, artists: 0 };

export function useAudioLibraryScan({ enabled }: UseAudioLibraryScanOptions) {
  const db = useSQLiteContext();
  const dbRef = useRef(db);

  const [status, setStatus] = useState<ScanStatus>('idle');
  const [scannedCount, setScannedCount] = useState(0);
  const [cacheHitCount, setCacheHitCount] = useState(0);
  const [reparsedCount, setReparsedCount] = useState(0);
  const [batchIndex, setBatchIndex] = useState(0);
  const [libraryCounts, setLibraryCounts] = useState<LibraryCounts>(EMPTY_COUNTS);
  /** Bumps after each persisted batch (and again after finalize) so Songs can refresh live. */
  const [libraryRevision, setLibraryRevision] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const runIdRef = useRef(0);

  useEffect(() => {
    dbRef.current = db;
  }, [db]);

  const runScan = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const runId = runIdRef.current + 1;
    runIdRef.current = runId;
    const database = dbRef.current;

    // Defer state updates so callers inside effects do not sync-setState in the effect body.
    await Promise.resolve();
    if (runIdRef.current !== runId || controller.signal.aborted) {
      return null;
    }

    setStatus('scanning');
    setScannedCount(0);
    setCacheHitCount(0);
    setReparsedCount(0);
    setBatchIndex(0);
    setErrorMessage(null);

    const seenIds = new Set<string>();

    try {
      const finalProgress = await scanAudioLibrary({
        signal: controller.signal,
        getCachedTracks: (ids) => getCachedTracksByIds(database, ids),
        persistTracks: (tracks) => upsertTracks(database, tracks),
        onBatch: (batch, progress: AudioScanProgress) => {
          if (runIdRef.current !== runId) {
            return;
          }
          for (const asset of batch) {
            seenIds.add(asset.id);
          }
          setScannedCount(progress.scannedCount);
          setCacheHitCount(progress.cacheHitCount);
          setReparsedCount(progress.reparsedCount);
          setBatchIndex(progress.batchIndex);
          // Show songs as soon as each batch is upserted — do not wait for the full scan.
          setLibraryRevision((value) => value + 1);
        },
      });

      if (runIdRef.current !== runId) {
        return null;
      }

      const counts = await finalizeLibraryScan(database, seenIds);
      if (runIdRef.current !== runId) {
        return null;
      }

      setScannedCount(finalProgress.scannedCount);
      setCacheHitCount(finalProgress.cacheHitCount);
      setReparsedCount(finalProgress.reparsedCount);
      setBatchIndex(finalProgress.batchIndex);
      setLibraryCounts(counts);
      setLibraryRevision((value) => value + 1);
      setStatus('ready');
      return { ...finalProgress, libraryCounts: counts };
    } catch (error) {
      if (isAbortError(error) || runIdRef.current !== runId) {
        return null;
      }
      const message = error instanceof Error ? error.message : 'Audio scan failed';
      setScannedCount(0);
      setCacheHitCount(0);
      setReparsedCount(0);
      setBatchIndex(0);
      setErrorMessage(message);
      setStatus('error');
      return null;
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;

    void (async () => {
      await Promise.resolve();
      if (cancelled) {
        return;
      }

      const counts = await getLibraryCounts(dbRef.current);
      if (cancelled) {
        return;
      }

      // Cached library: show immediately. Full MediaStore walk is pull-to-refresh / rescan only.
      if (counts.tracks > 0) {
        setLibraryCounts(counts);
        setStatus('ready');
        setLibraryRevision((value) => value + 1);
        return;
      }

      await runScan();
    })();

    return () => {
      cancelled = true;
      abortRef.current?.abort();
    };
  }, [enabled, runScan]);

  if (!enabled) {
    return {
      status: 'idle' as const,
      scannedCount: 0,
      cacheHitCount: 0,
      reparsedCount: 0,
      batchIndex: 0,
      count: 0,
      libraryCounts: EMPTY_COUNTS,
      libraryRevision: 0,
      errorMessage: null,
      isScanning: false,
      rescan: runScan,
    };
  }

  return {
    status,
    scannedCount,
    cacheHitCount,
    reparsedCount,
    batchIndex,
    count: scannedCount,
    libraryCounts,
    libraryRevision,
    errorMessage,
    isScanning: status === 'scanning',
    rescan: runScan,
  };
}
