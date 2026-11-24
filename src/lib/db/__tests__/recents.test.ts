import { countRecents, listRecentTracks, recordRecentPlay } from '@/lib/db/recents';
import { insertTestTrack, openTestDatabase } from '@/test/open-test-db';

import type { SQLiteDatabase } from 'expo-sqlite';

describe('recents', () => {
  let db: SQLiteDatabase;

  beforeEach(async () => {
    jest.useFakeTimers({ now: new Date('2024-01-01T00:00:00.000Z') });
    db = await openTestDatabase();
  });

  afterEach(async () => {
    await db.closeAsync();
    jest.useRealTimers();
  });

  it('upserts play time and lists newest first', async () => {
    await insertTestTrack(db, { id: 't1' });
    await insertTestTrack(db, { id: 't2' });

    await recordRecentPlay(db, 't1');
    jest.setSystemTime(Date.now() + 1000);
    await recordRecentPlay(db, 't2');
    jest.setSystemTime(Date.now() + 1000);
    await recordRecentPlay(db, 't1');

    expect(await countRecents(db)).toBe(2);
    expect((await listRecentTracks(db)).map((track) => track.id)).toEqual(['t1', 't2']);
  });

  it('trims history to the newest 50 plays', async () => {
    for (let index = 1; index <= 55; index += 1) {
      await insertTestTrack(db, { id: `t${index}`, title: `Track ${index}` });
      await recordRecentPlay(db, `t${index}`);
      jest.setSystemTime(Date.now() + 1000);
    }

    expect(await countRecents(db)).toBe(50);
    const listed = await listRecentTracks(db);
    expect(listed).toHaveLength(50);
    expect(listed[0]?.id).toBe('t55');
    expect(listed.some((track) => track.id === 't1')).toBe(false);
  });
});
