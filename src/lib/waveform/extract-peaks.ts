import { normalizePeaks, sanitizePeaks, WAVEFORM_BAR_COUNT } from '@/lib/waveform/peaks';

/**
 * Offline native decode of the whole track into ~150-200 seek bars.
 * Uses expo-audio-waveform when the native module is present (dev rebuild required).
 * Does not use expo-audio sampling (that needs RECORD_AUDIO and is live-only).
 */
export async function extractTrackPeaks(uri: string): Promise<number[]> {
  let extractWaveform: (
    audioUri: string,
    options?: { samples?: number; metric?: 'rms' | 'peak' },
  ) => Promise<number[]>;

  try {
    // Dynamic import so a missing native binary does not crash app startup.
    const mod = await import('expo-audio-waveform');
    extractWaveform = mod.extractWaveform;
  } catch {
    throw new Error('Waveform native module is unavailable. Rebuild the development client.');
  }

  const raw = await extractWaveform(uri, {
    samples: WAVEFORM_BAR_COUNT,
    metric: 'rms',
  });
  const sanitized = sanitizePeaks(raw, WAVEFORM_BAR_COUNT);
  if (sanitized) {
    return sanitized;
  }
  return normalizePeaks(raw.slice(0, WAVEFORM_BAR_COUNT));
}
