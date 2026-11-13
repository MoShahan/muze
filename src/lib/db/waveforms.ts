import { sanitizePeaks, WAVEFORM_BAR_COUNT } from '@/lib/waveform/peaks';

import type { SQLiteDatabase } from 'expo-sqlite';

export type WaveformRow = {
  trackId: string;
  peaks: number[];
  updatedAt: number;
};

export async function getWaveformPeaks(
  db: SQLiteDatabase,
  trackId: string,
): Promise<number[] | null> {
  const row = await db.getFirstAsync<{ peaks: string }>(
    'SELECT peaks FROM waveforms WHERE track_id = ?',
    [trackId],
  );
  if (!row?.peaks) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(row.peaks);
    return sanitizePeaks(parsed, WAVEFORM_BAR_COUNT);
  } catch {
    return null;
  }
}

export async function setWaveformPeaks(
  db: SQLiteDatabase,
  trackId: string,
  peaks: number[],
): Promise<void> {
  const sanitized = sanitizePeaks(peaks, WAVEFORM_BAR_COUNT);
  if (!sanitized) {
    return;
  }
  await db.runAsync(
    `INSERT INTO waveforms (track_id, peaks, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(track_id) DO UPDATE SET peaks = excluded.peaks, updated_at = excluded.updated_at`,
    [trackId, JSON.stringify(sanitized), Date.now()],
  );
}
