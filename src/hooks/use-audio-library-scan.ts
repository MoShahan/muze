import { useCallback, useEffect, useRef, useState } from 'react';

import { scanAudioLibrary, type AudioScanProgress } from '@/lib/media/scan';

type ScanStatus = 'idle' | 'scanning' | 'ready' | 'error';

type UseAudioLibraryScanOptions = {
  /** When false, skip scanning (e.g. permission not granted). */
  enabled: boolean;
};

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

export function useAudioLibraryScan({ enabled }: UseAudioLibraryScanOptions) {
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [scannedCount, setScannedCount] = useState(0);
  const [batchIndex, setBatchIndex] = useState(0);
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
    setBatchIndex(0);
    setErrorMessage(null);

    try {
      const finalProgress = await scanAudioLibrary({
        signal: controller.signal,
        onBatch: (_batch, progress: AudioScanProgress) => {
          if (runIdRef.current !== runId) {
            return;
          }
          // Only keep counters — do not store every asset in React state.
          setScannedCount(progress.scannedCount);
          setBatchIndex(progress.batchIndex);
        },
      });

      if (runIdRef.current !== runId) {
        return null;
      }

      setScannedCount(finalProgress.scannedCount);
      setBatchIndex(finalProgress.batchIndex);
      setStatus('ready');
      return finalProgress;
    } catch (error) {
      if (isAbortError(error) || runIdRef.current !== runId) {
        return null;
      }
      const message = error instanceof Error ? error.message : 'Audio scan failed';
      setScannedCount(0);
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

    void runScan();

    return () => {
      abortRef.current?.abort();
    };
  }, [enabled, runScan]);

  if (!enabled) {
    return {
      status: 'idle' as const,
      scannedCount: 0,
      batchIndex: 0,
      count: 0,
      errorMessage: null,
      isScanning: false,
      rescan: runScan,
    };
  }

  return {
    status,
    scannedCount,
    batchIndex,
    count: scannedCount,
    errorMessage,
    isScanning: status === 'scanning',
    rescan: runScan,
  };
}
