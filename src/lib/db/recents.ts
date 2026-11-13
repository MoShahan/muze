import {
  mapTrackRow,
  TRACK_SELECT_SQL,
  type CachedTrackRow,
  type TrackDbRow,
} from '@/lib/db/tracks';

import type { SQLiteDatabase } from 'expo-sqlite';

const MAX_RECENTS = 50;

export async function countRecents(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>(`SELECT COUNT(*) AS count FROM recents`);
  return row?.count ?? 0;
}

export async function listRecentTracks(
  db: SQLiteDatabase,
  limit = MAX_RECENTS,
): Promise<CachedTrackRow[]> {
  const rows = await db.getAllAsync<TrackDbRow>(
    `${TRACK_SELECT_SQL}
     INNER JOIN recents r ON r.track_id = tracks.id
     ORDER BY r.played_at DESC
     LIMIT ?`,
    [limit],
  );
  return rows.map(mapTrackRow);
}

/** Upsert play time and trim to the newest MAX_RECENTS rows. */
export async function recordRecentPlay(db: SQLiteDatabase, trackId: string): Promise<void> {
  const playedAt = Date.now();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO recents (track_id, played_at) VALUES (?, ?)
       ON CONFLICT(track_id) DO UPDATE SET played_at = excluded.played_at`,
      [trackId, playedAt],
    );
    await db.runAsync(
      `DELETE FROM recents
       WHERE track_id NOT IN (
         SELECT track_id FROM (
           SELECT track_id FROM recents ORDER BY played_at DESC LIMIT ?
         )
       )`,
      [MAX_RECENTS],
    );
  });
}
