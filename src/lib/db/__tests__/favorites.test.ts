import { countFavorites, isFavorite, listFavoriteTracks, toggleFavorite } from '@/lib/db/favorites';
import { insertTestTrack, openTestDatabase } from '@/test/open-test-db';

import type { SQLiteDatabase } from 'expo-sqlite';

describe('favorites', () => {
  let db: SQLiteDatabase;

  beforeEach(async () => {
    jest.useFakeTimers({ now: new Date('2024-01-01T00:00:00.000Z') });
    db = await openTestDatabase();
    await insertTestTrack(db, { id: 't1', title: 'One' });
    await insertTestTrack(db, { id: 't2', title: 'Two' });
  });

  afterEach(async () => {
    await db.closeAsync();
    jest.useRealTimers();
  });

  it('toggles favorite state and lists newest first', async () => {
    expect(await isFavorite(db, 't1')).toBe(false);
    expect(await toggleFavorite(db, 't1')).toBe(true);
    jest.setSystemTime(Date.now() + 1000);
    expect(await toggleFavorite(db, 't2')).toBe(true);
    expect(await countFavorites(db)).toBe(2);

    const listed = await listFavoriteTracks(db);
    expect(listed.map((track) => track.id)).toEqual(['t2', 't1']);

    expect(await toggleFavorite(db, 't1')).toBe(false);
    expect(await countFavorites(db)).toBe(1);
    expect(await isFavorite(db, 't1')).toBe(false);
  });
});
