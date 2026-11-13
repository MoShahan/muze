import {
  mapTrackRow,
  TRACK_SELECT_SQL,
  type CachedTrackRow,
  type TrackDbRow,
} from '@/lib/db/tracks';

import type { SQLiteDatabase } from 'expo-sqlite';

export async function countFavorites(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>(`SELECT COUNT(*) AS count FROM favorites`);
  return row?.count ?? 0;
}

export async function listFavoriteTracks(db: SQLiteDatabase): Promise<CachedTrackRow[]> {
  const rows = await db.getAllAsync<TrackDbRow>(
    `${TRACK_SELECT_SQL}
     INNER JOIN favorites f ON f.track_id = tracks.id
     ORDER BY f.created_at DESC, tracks.title COLLATE NOCASE ASC`,
  );
  return rows.map(mapTrackRow);
}

export async function isFavorite(db: SQLiteDatabase, trackId: string): Promise<boolean> {
  const row = await db.getFirstAsync<{ track_id: string }>(
    `SELECT track_id FROM favorites WHERE track_id = ?`,
    [trackId],
  );
  return row != null;
}

export async function addFavorite(db: SQLiteDatabase, trackId: string): Promise<void> {
  await db.runAsync(`INSERT OR IGNORE INTO favorites (track_id, created_at) VALUES (?, ?)`, [
    trackId,
    Date.now(),
  ]);
}

export async function removeFavorite(db: SQLiteDatabase, trackId: string): Promise<void> {
  await db.runAsync(`DELETE FROM favorites WHERE track_id = ?`, [trackId]);
}

/** Returns the new favorited state. */
export async function toggleFavorite(db: SQLiteDatabase, trackId: string): Promise<boolean> {
  const currentlyFavorite = await isFavorite(db, trackId);
  if (currentlyFavorite) {
    await removeFavorite(db, trackId);
    return false;
  }
  await addFavorite(db, trackId);
  return true;
}
