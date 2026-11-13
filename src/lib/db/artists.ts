import type { SQLiteDatabase } from 'expo-sqlite';

export type ArtistRow = {
  id: string;
  name: string;
  trackCount: number;
  albumCount: number;
};

type ArtistDbRow = {
  id: string;
  name: string;
  track_count: number;
  album_count: number;
};

function mapRow(row: ArtistDbRow): ArtistRow {
  return {
    id: row.id,
    name: row.name,
    trackCount: row.track_count,
    albumCount: row.album_count,
  };
}

export async function countArtists(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM artists');
  return row?.count ?? 0;
}

export async function listArtists(db: SQLiteDatabase): Promise<ArtistRow[]> {
  const rows = await db.getAllAsync<ArtistDbRow>(
    `SELECT id, name, track_count, album_count
     FROM artists
     ORDER BY name COLLATE NOCASE ASC`,
  );
  return rows.map(mapRow);
}

export async function getArtistById(db: SQLiteDatabase, id: string): Promise<ArtistRow | null> {
  const row = await db.getFirstAsync<ArtistDbRow>(
    `SELECT id, name, track_count, album_count
     FROM artists
     WHERE id = ?`,
    [id],
  );
  return row ? mapRow(row) : null;
}
