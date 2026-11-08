/** Static mock data for Phase 1 player UI preview. No device library access. */

export type MockTrack = {
  title: string;
  artist: string;
  album: string;
  durationMs: number;
};

export const MOCK_TRACK: MockTrack = {
  title: 'Blinding Lights',
  artist: 'The Weeknd',
  album: 'After Hours',
  durationMs: 3 * 60 * 1000 + 20 * 1000,
};

/**
 * Deterministic sample peaks (0-1) shaped like a real track envelope.
 * Replace with decoded amplitudes later without changing WaveformSeekbar's API.
 */
export const MOCK_WAVEFORM_PEAKS: number[] = [
  0.18, 0.22, 0.2, 0.28, 0.35, 0.42, 0.38, 0.48, 0.55, 0.5, 0.62, 0.58, 0.7, 0.66, 0.72, 0.68, 0.74,
  0.8, 0.76, 0.82, 0.78, 0.7, 0.64, 0.58, 0.52, 0.46, 0.4, 0.36, 0.42, 0.5, 0.58, 0.66, 0.72, 0.78,
  0.84, 0.8, 0.86, 0.9, 0.85, 0.8, 0.76, 0.7, 0.64, 0.6, 0.68, 0.74, 0.8, 0.86, 0.82, 0.78, 0.72,
  0.66, 0.6, 0.54, 0.48, 0.44, 0.5, 0.56, 0.62, 0.7, 0.76, 0.82, 0.78, 0.74, 0.68, 0.62, 0.56, 0.5,
  0.44, 0.4, 0.36, 0.32, 0.38, 0.44, 0.4, 0.34, 0.28, 0.24, 0.2, 0.18,
];

export function formatTrackTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
