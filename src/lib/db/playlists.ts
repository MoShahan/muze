import {
  mapTrackRow,
  TRACK_SELECT_SQL,
  type CachedTrackRow,
  type TrackDbRow,
} from '@/lib/db/tracks';

import type { SQLiteDatabase } from 'expo-sqlite';

export type PlaylistRow = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  trackCount: number;
};

type PlaylistDbRow = {
  id: string;
  name: string;
  created_at: number;
  updated_at: number;
  track_count: number;
};

function mapPlaylist(row: PlaylistDbRow): PlaylistRow {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    trackCount: row.track_count,
  };
}

export function newPlaylistId(): string {
  const random =
    typeof globalThis.crypto?.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `playlist:${random}`;
}

export async function listPlaylists(db: SQLiteDatabase): Promise<PlaylistRow[]> {
  const rows = await db.getAllAsync<PlaylistDbRow>(
    `SELECT p.id, p.name, p.created_at, p.updated_at,
            COUNT(pt.track_id) AS track_count
     FROM playlists p
     LEFT JOIN playlist_tracks pt ON pt.playlist_id = p.id
     GROUP BY p.id
     ORDER BY p.updated_at DESC, p.name COLLATE NOCASE ASC`,
  );
  return rows.map(mapPlaylist);
}

export async function getPlaylistById(
  db: SQLiteDatabase,
  playlistId: string,
): Promise<PlaylistRow | null> {
  const row = await db.getFirstAsync<PlaylistDbRow>(
    `SELECT p.id, p.name, p.created_at, p.updated_at,
            COUNT(pt.track_id) AS track_count
     FROM playlists p
     LEFT JOIN playlist_tracks pt ON pt.playlist_id = p.id
     WHERE p.id = ?
     GROUP BY p.id`,
    [playlistId],
  );
  return row ? mapPlaylist(row) : null;
}

export async function createPlaylist(db: SQLiteDatabase, name: string): Promise<PlaylistRow> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('Playlist name is required');
  }
  const now = Date.now();
  const id = newPlaylistId();
  await db.runAsync(
    `INSERT INTO playlists (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)`,
    [id, trimmed, now, now],
  );
  return {
    id,
    name: trimmed,
    createdAt: now,
    updatedAt: now,
    trackCount: 0,
  };
}

export async function renamePlaylist(
  db: SQLiteDatabase,
  playlistId: string,
  name: string,
): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('Playlist name is required');
  }
  await db.runAsync(`UPDATE playlists SET name = ?, updated_at = ? WHERE id = ?`, [
    trimmed,
    Date.now(),
    playlistId,
  ]);
}

export async function deletePlaylist(db: SQLiteDatabase, playlistId: string): Promise<void> {
  await db.runAsync(`DELETE FROM playlists WHERE id = ?`, [playlistId]);
}

export async function listPlaylistTracks(
  db: SQLiteDatabase,
  playlistId: string,
): Promise<CachedTrackRow[]> {
  const rows = await db.getAllAsync<TrackDbRow>(
    `${TRACK_SELECT_SQL}
     INNER JOIN playlist_tracks pt ON pt.track_id = tracks.id
     WHERE pt.playlist_id = ?
     ORDER BY pt.position ASC, tracks.title COLLATE NOCASE ASC`,
    [playlistId],
  );
  return rows.map(mapTrackRow);
}

export async function listPlaylistTrackIds(
  db: SQLiteDatabase,
  playlistId: string,
): Promise<Set<string>> {
  const rows = await db.getAllAsync<{ track_id: string }>(
    `SELECT track_id FROM playlist_tracks WHERE playlist_id = ?`,
    [playlistId],
  );
  return new Set(rows.map((row) => row.track_id));
}

export async function addTracksToPlaylist(
  db: SQLiteDatabase,
  playlistId: string,
  trackIds: string[],
): Promise<number> {
  if (trackIds.length === 0) {
    return 0;
  }

  const existing = await listPlaylistTrackIds(db, playlistId);
  const toAdd = trackIds.filter((id) => !existing.has(id));
  if (toAdd.length === 0) {
    return 0;
  }

  const maxRow = await db.getFirstAsync<{ max_pos: number | null }>(
    `SELECT MAX(position) AS max_pos FROM playlist_tracks WHERE playlist_id = ?`,
    [playlistId],
  );
  let position = (maxRow?.max_pos ?? -1) + 1;
  const now = Date.now();

  await db.withTransactionAsync(async () => {
    for (const trackId of toAdd) {
      await db.runAsync(
        `INSERT OR IGNORE INTO playlist_tracks (playlist_id, track_id, position)
         VALUES (?, ?, ?)`,
        [playlistId, trackId, position],
      );
      position += 1;
    }
    await db.runAsync(`UPDATE playlists SET updated_at = ? WHERE id = ?`, [now, playlistId]);
  });

  return toAdd.length;
}

export async function removeTrackFromPlaylist(
  db: SQLiteDatabase,
  playlistId: string,
  trackId: string,
): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync(`DELETE FROM playlist_tracks WHERE playlist_id = ? AND track_id = ?`, [
      playlistId,
      trackId,
    ]);
    await db.runAsync(`UPDATE playlists SET updated_at = ? WHERE id = ?`, [Date.now(), playlistId]);
  });
}
