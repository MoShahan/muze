import {
  clearPlaybackResumeState,
  getPlaybackResumeState,
  getTrackSort,
  setPlaybackResumeState,
  setTrackSort,
} from '@/lib/db/settings';
import { insertTestTrack, openTestDatabase } from '@/test/open-test-db';

import type { SQLiteDatabase } from 'expo-sqlite';

describe('settings resume / sort', () => {
  let db: SQLiteDatabase;

  beforeEach(async () => {
    db = await openTestDatabase();
    await insertTestTrack(db, { id: 'track-1' });
  });

  afterEach(async () => {
    await db.closeAsync();
  });

  it('persists and clears playback resume state', async () => {
    expect(await getPlaybackResumeState(db)).toBeNull();

    await setPlaybackResumeState(db, { trackId: 'track-1', positionMs: 12_345.6 });
    expect(await getPlaybackResumeState(db)).toEqual({
      trackId: 'track-1',
      positionMs: 12_346,
    });

    await clearPlaybackResumeState(db);
    expect(await getPlaybackResumeState(db)).toBeNull();
  });

  it('clears resume when track id is blank', async () => {
    await setPlaybackResumeState(db, { trackId: 'track-1', positionMs: 100 });
    await setPlaybackResumeState(db, { trackId: '  ', positionMs: 100 });
    expect(await getPlaybackResumeState(db)).toBeNull();
  });

  it('persists track sort preference', async () => {
    expect(await getTrackSort(db)).toBe('title');
    await setTrackSort(db, 'duration');
    expect(await getTrackSort(db)).toBe('duration');
  });
});
