import type { SQLiteDatabase } from 'expo-sqlite';

export type AlbumRow = {
  id: string;
  title: string;
  artist: string;
  artworkPath: string | null;
  trackCount: number;
};

type AlbumDbRow = {
  id: string;
  title: string;
  artist: string;
  artwork_path: string | null;
  track_count: number;
};

function mapRow(row: AlbumDbRow): AlbumRow {
  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    artworkPath: row.artwork_path,
    trackCount: row.track_count,
  };
}

export async function countAlbums(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM albums');
  return row?.count ?? 0;
}

export async function listAlbums(db: SQLiteDatabase): Promise<AlbumRow[]> {
  const rows = await db.getAllAsync<AlbumDbRow>(
    `SELECT id, title, artist, artwork_path, track_count
     FROM albums
     ORDER BY title COLLATE NOCASE ASC, artist COLLATE NOCASE ASC`,
  );
  return rows.map(mapRow);
}

export async function getAlbumById(db: SQLiteDatabase, id: string): Promise<AlbumRow | null> {
  const row = await db.getFirstAsync<AlbumDbRow>(
    `SELECT id, title, artist, artwork_path, track_count
     FROM albums
     WHERE id = ?`,
    [id],
  );
  return row ? mapRow(row) : null;
}

/** Albums that include at least one track credited to this performing artist. */
export async function listAlbumsForArtist(
  db: SQLiteDatabase,
  artistName: string,
): Promise<AlbumRow[]> {
  const rows = await db.getAllAsync<AlbumDbRow>(
    `SELECT DISTINCT a.id, a.title, a.artist, a.artwork_path, a.track_count
     FROM albums a
     INNER JOIN tracks t
       ON t.album = a.title
      AND COALESCE(NULLIF(TRIM(t.album_artist), ''), t.artist) = a.artist
     WHERE t.artist = ?
     ORDER BY a.title COLLATE NOCASE ASC, a.artist COLLATE NOCASE ASC`,
    [artistName],
  );
  return rows.map(mapRow);
}
