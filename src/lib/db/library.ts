import { albumArtistLabel, albumIdFor, artistIdFor } from '@/lib/db/ids';

import type { SQLiteDatabase } from 'expo-sqlite';

type TrackGroupSourceRow = {
  id: string;
  title: string;
  artist: string;
  album: string;
  album_artist: string | null;
  artwork_path: string | null;
};

export type LibraryCounts = {
  tracks: number;
  albums: number;
  artists: number;
};

export async function countTracks(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM tracks');
  return row?.count ?? 0;
}

export async function getLibraryCounts(db: SQLiteDatabase): Promise<LibraryCounts> {
  const [tracks, albums, artists] = await Promise.all([
    countTracks(db),
    db.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM albums'),
    db.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM artists'),
  ]);

  return {
    tracks,
    albums: albums?.count ?? 0,
    artists: artists?.count ?? 0,
  };
}

/**
 * Remove track rows that were not seen in the latest full library scan.
 * Cascades clean playlist/favorites/recents/waveform rows for those ids.
 */
export async function pruneTracksNotIn(
  db: SQLiteDatabase,
  keepIds: Iterable<string>,
): Promise<number> {
  const keep = keepIds instanceof Set ? keepIds : new Set(keepIds);

  if (keep.size === 0) {
    const existing = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) AS count FROM tracks',
    );
    await db.runAsync('DELETE FROM tracks');
    return existing?.count ?? 0;
  }

  const existingRows = await db.getAllAsync<{ id: string }>('SELECT id FROM tracks');
  const toDelete = existingRows.map((row) => row.id).filter((id) => !keep.has(id));
  if (toDelete.length === 0) {
    return 0;
  }

  await db.withTransactionAsync(async () => {
    const chunkSize = 200;
    for (let i = 0; i < toDelete.length; i += chunkSize) {
      const chunk = toDelete.slice(i, i + chunkSize);
      const placeholders = chunk.map(() => '?').join(', ');
      await db.runAsync(`DELETE FROM tracks WHERE id IN (${placeholders})`, chunk);
    }
  });

  return toDelete.length;
}

/**
 * Rebuild `albums` and `artists` from current `tracks` tag fields.
 * MediaStore folder albums are intentionally ignored.
 */
export async function rebuildLibraryGroups(db: SQLiteDatabase): Promise<LibraryCounts> {
  const tracks = await db.getAllAsync<TrackGroupSourceRow>(
    `SELECT id, title, artist, album, album_artist, artwork_path FROM tracks`,
  );

  type AlbumAgg = {
    id: string;
    title: string;
    artist: string;
    artworkPath: string | null;
    trackCount: number;
  };
  type ArtistAgg = {
    id: string;
    name: string;
    trackCount: number;
    albumKeys: Set<string>;
  };

  const albums = new Map<string, AlbumAgg>();
  const artists = new Map<string, ArtistAgg>();

  for (const track of tracks) {
    const albumArtist = albumArtistLabel(track.album_artist, track.artist);
    const albumId = albumIdFor(track.album, albumArtist);
    const existingAlbum = albums.get(albumId);
    if (existingAlbum) {
      existingAlbum.trackCount += 1;
      if (!existingAlbum.artworkPath && track.artwork_path) {
        existingAlbum.artworkPath = track.artwork_path;
      }
    } else {
      albums.set(albumId, {
        id: albumId,
        title: track.album,
        artist: albumArtist,
        artworkPath: track.artwork_path,
        trackCount: 1,
      });
    }

    const artistId = artistIdFor(track.artist);
    const existingArtist = artists.get(artistId);
    if (existingArtist) {
      existingArtist.trackCount += 1;
      existingArtist.albumKeys.add(albumId);
    } else {
      artists.set(artistId, {
        id: artistId,
        name: track.artist,
        trackCount: 1,
        albumKeys: new Set([albumId]),
      });
    }
  }

  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM albums');
    await db.runAsync('DELETE FROM artists');

    for (const album of albums.values()) {
      await db.runAsync(
        `INSERT INTO albums (id, title, artist, artwork_path, track_count)
         VALUES (?, ?, ?, ?, ?)`,
        [album.id, album.title, album.artist, album.artworkPath, album.trackCount],
      );
    }

    for (const artist of artists.values()) {
      await db.runAsync(
        `INSERT INTO artists (id, name, track_count, album_count)
         VALUES (?, ?, ?, ?)`,
        [artist.id, artist.name, artist.trackCount, artist.albumKeys.size],
      );
    }
  });

  return {
    tracks: tracks.length,
    albums: albums.size,
    artists: artists.size,
  };
}

/** After a full scan: drop missing tracks, then refresh album/artist groups. */
export async function finalizeLibraryScan(
  db: SQLiteDatabase,
  scannedTrackIds: Iterable<string>,
): Promise<LibraryCounts> {
  await pruneTracksNotIn(db, scannedTrackIds);
  return rebuildLibraryGroups(db);
}
