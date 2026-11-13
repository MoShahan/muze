/** Target bar count for the now-playing seek waveform (plan: ~150-200). */
export const WAVEFORM_BAR_COUNT = 180;

/**
 * Soft placeholder envelope shown while real peaks are generated/cached.
 * Values are 0-1; shape is intentionally gentle so it reads as “loading,” not a track.
 */
export function createPlaceholderPeaks(barCount: number = WAVEFORM_BAR_COUNT): number[] {
  const peaks: number[] = [];
  for (let i = 0; i < barCount; i += 1) {
    const t = i / Math.max(1, barCount - 1);
    const wave = 0.28 + 0.18 * Math.sin(t * Math.PI * 4) + 0.08 * Math.sin(t * Math.PI * 11);
    peaks.push(Math.min(0.55, Math.max(0.12, wave)));
  }
  return peaks;
}

export const PLACEHOLDER_WAVEFORM_PEAKS = createPlaceholderPeaks();

/** Normalize a peak array to 0-1 using the loudest bar (silence → zeros). */
export function normalizePeaks(peaks: number[]): number[] {
  if (peaks.length === 0) {
    return [];
  }
  let max = 0;
  for (const peak of peaks) {
    if (peak > max) {
      max = peak;
    }
  }
  if (max <= 0) {
    return peaks.map(() => 0);
  }
  return peaks.map((peak) => Math.min(1, Math.max(0, peak / max)));
}

/**
 * Downsample an arbitrary-length amplitude series into `barCount` peak bars.
 * Each bar is the max absolute sample in its bucket (then normalized).
 */
export function downsampleToPeaks(samples: ArrayLike<number>, barCount: number): number[] {
  const count = Math.max(1, barCount);
  if (samples.length === 0) {
    return Array.from({ length: count }, () => 0);
  }

  const peaks = new Array<number>(count).fill(0);
  for (let i = 0; i < samples.length; i += 1) {
    const bucket = Math.min(count - 1, Math.floor((i / samples.length) * count));
    const value = Math.abs(samples[i] ?? 0);
    if (value > peaks[bucket]) {
      peaks[bucket] = value;
    }
  }
  return normalizePeaks(peaks);
}

/** Ensure peaks are a finite 0-1 array of the expected length. */
export function sanitizePeaks(
  peaks: unknown,
  barCount: number = WAVEFORM_BAR_COUNT,
): number[] | null {
  if (!Array.isArray(peaks) || peaks.length === 0) {
    return null;
  }
  const numeric = peaks
    .map((value) => (typeof value === 'number' && Number.isFinite(value) ? value : 0))
    .map((value) => Math.min(1, Math.max(0, value)));
  if (numeric.length === barCount) {
    return numeric;
  }
  return downsampleToPeaks(numeric, barCount);
}
