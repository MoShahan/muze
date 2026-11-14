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

export type TrackDbRow = {
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

export function mapTrackRow(row: TrackDbRow): CachedTrackRow {
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
    // Preserve null (never extracted) vs '' (checked, no art) for scan reparse logic.
    artworkPath: row.artwork_path,
    folderPath: row.folder_path,
    dateAdded: row.date_added,
    sourceModifiedAt: row.source_modified_at,
    updatedAt: row.updated_at,
  };
}

/** Display URI for expo-image; treats empty string as missing. */
export function artworkDisplayUri(path: string | null | undefined): string | null {
  if (!path) {
    return null;
  }
  if (
    path.startsWith('file://') ||
    path.startsWith('content://') ||
    path.startsWith('http://') ||
    path.startsWith('https://')
  ) {
    return path;
  }
  return `file://${path}`;
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
    map.set(row.id, mapTrackRow(row));
  }
  return map;
}

/** Shared SELECT body; join as `tracks` when combining with other tables. */
export const TRACK_SELECT_SQL = `SELECT tracks.id, tracks.uri, tracks.filename, tracks.title, tracks.artist, tracks.album,
            tracks.album_artist, tracks.track_number, tracks.year, tracks.genre,
            tracks.duration_ms, tracks.artwork_path, tracks.folder_path, tracks.date_added,
            tracks.source_modified_at, tracks.updated_at
     FROM tracks`;

const TRACK_SELECT = `SELECT id, uri, filename, title, artist, album, album_artist, track_number, year, genre,
            duration_ms, artwork_path, folder_path, date_added, source_modified_at, updated_at
     FROM tracks`;

export async function listTracks(db: SQLiteDatabase): Promise<CachedTrackRow[]> {
  const rows = await db.getAllAsync<TrackDbRow>(
    `${TRACK_SELECT}
     ORDER BY title COLLATE NOCASE ASC, artist COLLATE NOCASE ASC`,
  );
  return rows.map(mapTrackRow);
}

/** Tracks that still need cover extraction (`artwork_path IS NULL`). */
export async function countTracksMissingArtwork(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) AS count FROM tracks WHERE artwork_path IS NULL`,
  );
  return row?.count ?? 0;
}

export async function getTrackById(
  db: SQLiteDatabase,
  trackId: string,
): Promise<CachedTrackRow | null> {
  const row = await db.getFirstAsync<TrackDbRow>(`${TRACK_SELECT} WHERE id = ?`, [trackId]);
  return row ? mapTrackRow(row) : null;
}

export type TrackMetadataUpdate = {
  title: string;
  artist: string;
  album: string;
  albumArtist: string | null;
  trackNumber: number | null;
  year: number | null;
  genre: string | null;
};

/** Update embedded-tag fields in SQLite only (after a successful file tag write). */
export async function updateTrackMetadata(
  db: SQLiteDatabase,
  trackId: string,
  metadata: TrackMetadataUpdate,
): Promise<void> {
  await db.runAsync(
    `UPDATE tracks SET
       title = ?, artist = ?, album = ?, album_artist = ?, track_number = ?, year = ?, genre = ?,
       updated_at = ?
     WHERE id = ?`,
    [
      metadata.title,
      metadata.artist,
      metadata.album,
      metadata.albumArtist,
      metadata.trackNumber,
      metadata.year,
      metadata.genre,
      Date.now(),
      trackId,
    ],
  );
}

/**
 * Replace a track row with a new MediaStore identity after create+delete rename/tag replace.
 * Migrates favorites / playlist_tracks / recents / waveforms to the new id.
 */
export async function replaceTrackIdentity(
  db: SQLiteDatabase,
  oldId: string,
  next: UpsertTrackInput,
): Promise<void> {
  if (oldId === next.id) {
    await upsertTracks(db, [next]);
    return;
  }

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO tracks (
        id, uri, filename, title, artist, album, album_artist, track_number, year, genre,
        duration_ms, artwork_path, folder_path, date_added, source_modified_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        next.id,
        next.uri,
        next.filename,
        next.title,
        next.artist,
        next.album,
        next.albumArtist,
        next.trackNumber,
        next.year,
        next.genre,
        next.durationMs,
        next.artworkPath,
        next.folderPath,
        next.dateAdded,
        next.sourceModifiedAt,
        Date.now(),
      ],
    );

    await db.runAsync(`UPDATE favorites SET track_id = ? WHERE track_id = ?`, [next.id, oldId]);
    await db.runAsync(`UPDATE playlist_tracks SET track_id = ? WHERE track_id = ?`, [
      next.id,
      oldId,
    ]);
    await db.runAsync(`UPDATE recents SET track_id = ? WHERE track_id = ?`, [next.id, oldId]);
    await db.runAsync(`UPDATE waveforms SET track_id = ? WHERE track_id = ?`, [next.id, oldId]);
    await db.runAsync(`DELETE FROM tracks WHERE id = ?`, [oldId]);
  });
}

/** Delete track row; dependent favorites/playlists/recents/waveforms cascade. */
export async function deleteTrackRow(db: SQLiteDatabase, trackId: string): Promise<void> {
  await db.runAsync(`DELETE FROM tracks WHERE id = ?`, [trackId]);
}

/** Album tracks ordered by disc track number when present. */
export async function listTracksForAlbum(
  db: SQLiteDatabase,
  albumTitle: string,
  albumArtist: string,
): Promise<CachedTrackRow[]> {
  const rows = await db.getAllAsync<TrackDbRow>(
    `${TRACK_SELECT}
     WHERE album = ?
       AND COALESCE(NULLIF(TRIM(album_artist), ''), artist) = ?
     ORDER BY (track_number IS NULL), track_number ASC, title COLLATE NOCASE ASC`,
    [albumTitle, albumArtist],
  );
  return rows.map(mapTrackRow);
}

export async function listTracksForArtist(
  db: SQLiteDatabase,
  artistName: string,
): Promise<CachedTrackRow[]> {
  const rows = await db.getAllAsync<TrackDbRow>(
    `${TRACK_SELECT}
     WHERE artist = ?
     ORDER BY album COLLATE NOCASE ASC, (track_number IS NULL), track_number ASC, title COLLATE NOCASE ASC`,
    [artistName],
  );
  return rows.map(mapTrackRow);
}

export async function listTracksForFolder(
  db: SQLiteDatabase,
  folderPath: string,
): Promise<CachedTrackRow[]> {
  const rows = await db.getAllAsync<TrackDbRow>(
    `${TRACK_SELECT}
     WHERE folder_path = ?
     ORDER BY filename COLLATE NOCASE ASC, title COLLATE NOCASE ASC`,
    [folderPath],
  );
  return rows.map(mapTrackRow);
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
