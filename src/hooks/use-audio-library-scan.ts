import { useCallback, useEffect, useState } from 'react';

import { scanAudioAssets, type ScannedAudioAsset } from '@/lib/media/scan';

type ScanStatus = 'idle' | 'scanning' | 'ready' | 'error';

type UseAudioLibraryScanOptions = {
  /** When false, skip scanning (e.g. permission not granted). */
  enabled: boolean;
};

export function useAudioLibraryScan({ enabled }: UseAudioLibraryScanOptions) {
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [assets, setAssets] = useState<ScannedAudioAsset[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const runScan = useCallback(async () => {
    setStatus('scanning');
    setErrorMessage(null);
    try {
      const next = await scanAudioAssets();
      setAssets(next);
      setStatus('ready');
      return next;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Audio scan failed';
      setAssets([]);
      setErrorMessage(message);
      setStatus('error');
      return [];
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;
    void (async () => {
      setStatus('scanning');
      setErrorMessage(null);
      try {
        const next = await scanAudioAssets();
        if (!cancelled) {
          setAssets(next);
          setStatus('ready');
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : 'Audio scan failed';
          setAssets([]);
          setErrorMessage(message);
          setStatus('error');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  if (!enabled) {
    return {
      status: 'idle' as const,
      assets: [] as ScannedAudioAsset[],
      count: 0,
      errorMessage: null,
      isScanning: false,
      rescan: runScan,
    };
  }

  return {
    status,
    assets,
    count: assets.length,
    errorMessage,
    isScanning: status === 'scanning',
    rescan: runScan,
  };
}
