import { pruneTracksNotIn, rebuildLibraryGroups } from '@/lib/db/library';
import { insertTestTrack, openTestDatabase } from '@/test/open-test-db';

import type { SQLiteDatabase } from 'expo-sqlite';

describe('library grouping / prune', () => {
  let db: SQLiteDatabase;

  beforeEach(async () => {
    db = await openTestDatabase();
    await insertTestTrack(db, {
      id: '1',
      title: 'A',
      artist: 'Beta',
      album: 'Zebra',
      artworkPath: '/art.jpg',
    });
    await insertTestTrack(db, {
      id: '2',
      title: 'B',
      artist: 'Beta',
      album: 'Zebra',
      artworkPath: '',
    });
    await insertTestTrack(db, {
      id: '3',
      title: 'C',
      artist: 'Alpha',
      album: 'Apple',
      artworkPath: null,
    });
  });

  afterEach(async () => {
    await db.closeAsync();
  });

  it('rebuilds albums and artists from tracks', async () => {
    const counts = await rebuildLibraryGroups(db);
    expect(counts).toEqual({ tracks: 3, albums: 2, artists: 2 });

    const albums = await db.getAllAsync<{ title: string; track_count: number }>(
      'SELECT title, track_count FROM albums ORDER BY title COLLATE NOCASE ASC',
    );
    expect(albums).toEqual([
      { title: 'Apple', track_count: 1 },
      { title: 'Zebra', track_count: 2 },
    ]);

    const artists = await db.getAllAsync<{
      name: string;
      track_count: number;
      album_count: number;
    }>('SELECT name, track_count, album_count FROM artists ORDER BY name COLLATE NOCASE ASC');
    expect(artists).toEqual([
      { name: 'Alpha', track_count: 1, album_count: 1 },
      { name: 'Beta', track_count: 2, album_count: 1 },
    ]);
  });

  it('prunes tracks not in the keep set', async () => {
    const deleted = await pruneTracksNotIn(db, ['1', '3']);
    expect(deleted).toBe(1);
    const remaining = await db.getAllAsync<{ id: string }>('SELECT id FROM tracks ORDER BY id');
    expect(remaining.map((row) => row.id)).toEqual(['1', '3']);
  });

  it('deletes all tracks when keep set is empty', async () => {
    const deleted = await pruneTracksNotIn(db, []);
    expect(deleted).toBe(3);
    const count = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM tracks');
    expect(count?.count).toBe(0);
  });
});
