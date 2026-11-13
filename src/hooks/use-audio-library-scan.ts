import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useRef, useState } from 'react';

import { finalizeLibraryScan, type LibraryCounts } from '@/lib/db/library';
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
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [scannedCount, setScannedCount] = useState(0);
  const [cacheHitCount, setCacheHitCount] = useState(0);
  const [reparsedCount, setReparsedCount] = useState(0);
  const [batchIndex, setBatchIndex] = useState(0);
  const [libraryCounts, setLibraryCounts] = useState<LibraryCounts>(EMPTY_COUNTS);
  const [sampleTitles, setSampleTitles] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const runIdRef = useRef(0);

  const runScan = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const runId = runIdRef.current + 1;
    runIdRef.current = runId;

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
    setLibraryCounts(EMPTY_COUNTS);
    setSampleTitles([]);
    setErrorMessage(null);

    const seenIds = new Set<string>();

    try {
      const finalProgress = await scanAudioLibrary({
        signal: controller.signal,
        getCachedTracks: (ids) => getCachedTracksByIds(db, ids),
        persistTracks: (tracks) => upsertTracks(db, tracks),
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
          setSampleTitles((prev) => {
            if (prev.length >= 3) {
              return prev;
            }
            const next = [...prev];
            for (const asset of batch) {
              if (next.length >= 3) {
                break;
              }
              const artMark = asset.artworkPath ? ' · art' : '';
              next.push(`${asset.title} · ${asset.artist}${artMark}`);
            }
            return next;
          });
        },
      });

      if (runIdRef.current !== runId) {
        return null;
      }

      const counts = await finalizeLibraryScan(db, seenIds);
      if (runIdRef.current !== runId) {
        return null;
      }

      setScannedCount(finalProgress.scannedCount);
      setCacheHitCount(finalProgress.cacheHitCount);
      setReparsedCount(finalProgress.reparsedCount);
      setBatchIndex(finalProgress.batchIndex);
      setLibraryCounts(counts);
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
      setLibraryCounts(EMPTY_COUNTS);
      setSampleTitles([]);
      setErrorMessage(message);
      setStatus('error');
      return null;
    }
  }, [db]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    void runScan();

    return () => {
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
      sampleTitles: [] as string[],
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
    sampleTitles,
    errorMessage,
    isScanning: status === 'scanning',
    rescan: runScan,
  };
}
