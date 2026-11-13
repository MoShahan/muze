import type { SQLiteDatabase } from 'expo-sqlite';

/** Cached track metadata used to skip re-parsing unchanged files. */
export type CachedTrackRow = {
  id: string;
  uri: string;
  filename: string;
  title: string;
  artist: string;
  album: string;
  albumArtist: string | null;
  trackNumber: number | null;
  year: number | null;
  genre: string | null;
  durationMs: number;
  artworkPath: string | null;
  folderPath: string | null;
  dateAdded: number | null;
  sourceModifiedAt: number | null;
  updatedAt: number;
};

export type UpsertTrackInput = {
  id: string;
  uri: string;
  filename: string;
  title: string;
  artist: string;
  album: string;
  albumArtist: string | null;
  trackNumber: number | null;
  year: number | null;
  genre: string | null;
  durationMs: number;
  artworkPath: string | null;
  folderPath: string | null;
  dateAdded: number | null;
  sourceModifiedAt: number | null;
};

type TrackDbRow = {
  id: string;
  uri: string;
  filename: string;
  title: string;
  artist: string;
  album: string;
  album_artist: string | null;
  track_number: number | null;
  year: number | null;
  genre: string | null;
  duration_ms: number;
  artwork_path: string | null;
  folder_path: string | null;
  date_added: number | null;
  source_modified_at: number | null;
  updated_at: number;
};

function mapRow(row: TrackDbRow): CachedTrackRow {
  return {
    id: row.id,
    uri: row.uri,
    filename: row.filename,
    title: row.title,
    artist: row.artist,
    album: row.album,
    albumArtist: row.album_artist,
    trackNumber: row.track_number,
    year: row.year,
    genre: row.genre,
    durationMs: row.duration_ms,
    artworkPath: row.artwork_path,
    folderPath: row.folder_path,
    dateAdded: row.date_added,
    sourceModifiedAt: row.source_modified_at,
    updatedAt: row.updated_at,
  };
}

/** Load cached track rows for the given MediaStore ids. */
export async function getCachedTracksByIds(
  db: SQLiteDatabase,
  ids: string[],
): Promise<Map<string, CachedTrackRow>> {
  const map = new Map<string, CachedTrackRow>();
  if (ids.length === 0) {
    return map;
  }

  const placeholders = ids.map(() => '?').join(', ');
  const rows = await db.getAllAsync<TrackDbRow>(
    `SELECT id, uri, filename, title, artist, album, album_artist, track_number, year, genre,
            duration_ms, artwork_path, folder_path, date_added, source_modified_at, updated_at
     FROM tracks
     WHERE id IN (${placeholders})`,
    ids,
  );

  for (const row of rows) {
    map.set(row.id, mapRow(row));
  }
  return map;
}

export async function listTracks(db: SQLiteDatabase): Promise<CachedTrackRow[]> {
  const rows = await db.getAllAsync<TrackDbRow>(
    `SELECT id, uri, filename, title, artist, album, album_artist, track_number, year, genre,
            duration_ms, artwork_path, folder_path, date_added, source_modified_at, updated_at
     FROM tracks
     ORDER BY title COLLATE NOCASE ASC, artist COLLATE NOCASE ASC`,
  );
  return rows.map(mapRow);
}

/** Upsert parsed metadata + artwork cache paths for a scan batch. */
export async function upsertTracks(db: SQLiteDatabase, tracks: UpsertTrackInput[]): Promise<void> {
  if (tracks.length === 0) {
    return;
  }

  const updatedAt = Date.now();
  await db.withTransactionAsync(async () => {
    for (const track of tracks) {
      await db.runAsync(
        `INSERT INTO tracks (
          id, uri, filename, title, artist, album, album_artist, track_number, year, genre,
          duration_ms, artwork_path, folder_path, date_added, source_modified_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          uri = excluded.uri,
          filename = excluded.filename,
          title = excluded.title,
          artist = excluded.artist,
          album = excluded.album,
          album_artist = excluded.album_artist,
          track_number = excluded.track_number,
          year = excluded.year,
          genre = excluded.genre,
          duration_ms = excluded.duration_ms,
          artwork_path = excluded.artwork_path,
          folder_path = excluded.folder_path,
          date_added = excluded.date_added,
          source_modified_at = excluded.source_modified_at,
          updated_at = excluded.updated_at`,
        [
          track.id,
          track.uri,
          track.filename,
          track.title,
          track.artist,
          track.album,
          track.albumArtist,
          track.trackNumber,
          track.year,
          track.genre,
          track.durationMs,
          track.artworkPath,
          track.folderPath,
          track.dateAdded,
          track.sourceModifiedAt,
          updatedAt,
        ],
      );
    }
  });
}
