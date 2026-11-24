/**
 * Loads cached waveform peaks for the current track, or generates and caches
 * them on first open. Shows a placeholder envelope until real peaks are ready.
 *
 * Full-file decode (especially FLAC) is deferred with requestIdleCallback so
 * opening now-playing stays responsive on large libraries.
 * (InteractionManager was removed in React Native 0.87+.)
 */
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';

import { getWaveformPeaks, setWaveformPeaks } from '@/lib/db/waveforms';
import { extractTrackPeaks } from '@/lib/waveform/extract-peaks';
import { PLACEHOLDER_WAVEFORM_PEAKS } from '@/lib/waveform/peaks';

type UseTrackWaveformOptions = {
  trackId: string | null | undefined;
  uri: string | null | undefined;
};

type UseTrackWaveformResult = {
  peaks: number[];
  isPlaceholder: boolean;
  isLoading: boolean;
};

export function useTrackWaveform({
  trackId,
  uri,
}: UseTrackWaveformOptions): UseTrackWaveformResult {
  const db = useSQLiteContext();
  const [peaks, setPeaks] = useState<number[]>(PLACEHOLDER_WAVEFORM_PEAKS);
  const [isPlaceholder, setIsPlaceholder] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let idleCallbackId: number | null = null;

    void (async () => {
      await Promise.resolve();
      if (cancelled) {
        return;
      }

      if (!trackId || !uri) {
        setPeaks(PLACEHOLDER_WAVEFORM_PEAKS);
        setIsPlaceholder(true);
        setIsLoading(false);
        return;
      }

      setPeaks(PLACEHOLDER_WAVEFORM_PEAKS);
      setIsPlaceholder(true);
      setIsLoading(true);

      try {
        const cached = await getWaveformPeaks(db, trackId);
        if (cancelled) {
          return;
        }
        if (cached) {
          setPeaks(cached);
          setIsPlaceholder(false);
          setIsLoading(false);
          return;
        }

        await new Promise<void>((resolve) => {
          idleCallbackId = requestIdleCallback(() => resolve());
        });
        idleCallbackId = null;
        if (cancelled) {
          return;
        }

        const extracted = await extractTrackPeaks(uri);
        if (cancelled) {
          return;
        }
        setPeaks(extracted);
        setIsPlaceholder(false);
        void setWaveformPeaks(db, trackId, extracted);
      } catch {
        if (!cancelled) {
          // Keep the soft placeholder so seeking UI still works.
          setPeaks(PLACEHOLDER_WAVEFORM_PEAKS);
          setIsPlaceholder(true);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      if (idleCallbackId != null) {
        cancelIdleCallback(idleCallbackId);
      }
    };
  }, [db, trackId, uri]);

  return { peaks, isPlaceholder, isLoading };
}
