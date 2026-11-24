import { moveQueueItem, shuffleTracksKeepingCurrent } from '@/lib/library/playback-queue';
import { makePlaybackTrack } from '@/test/fixtures';

describe('shuffleTracksKeepingCurrent', () => {
  it('returns a copy for empty or single-item queues', () => {
    expect(shuffleTracksKeepingCurrent([], null)).toEqual([]);
    const one = [makePlaybackTrack({ id: 'a' })];
    expect(shuffleTracksKeepingCurrent(one, 'a')).toEqual(one);
    expect(shuffleTracksKeepingCurrent(one, 'a')).not.toBe(one);
  });

  it('keeps the current track first and preserves the multiset', () => {
    const tracks = [
      makePlaybackTrack({ id: 'a' }),
      makePlaybackTrack({ id: 'b' }),
      makePlaybackTrack({ id: 'c' }),
      makePlaybackTrack({ id: 'd' }),
    ];
    jest.spyOn(Math, 'random').mockReturnValue(0);

    const shuffled = shuffleTracksKeepingCurrent(tracks, 'c');

    expect(shuffled[0]?.id).toBe('c');
    expect(shuffled.map((track) => track.id).sort()).toEqual(['a', 'b', 'c', 'd']);
    expect(shuffled).not.toBe(tracks);

    jest.restoreAllMocks();
  });

  it('shuffles the whole list when current id is missing', () => {
    const tracks = [
      makePlaybackTrack({ id: 'a' }),
      makePlaybackTrack({ id: 'b' }),
      makePlaybackTrack({ id: 'c' }),
    ];
    jest.spyOn(Math, 'random').mockReturnValue(0);

    const shuffled = shuffleTracksKeepingCurrent(tracks, 'missing');
    expect(shuffled).toHaveLength(3);
    expect(shuffled.map((track) => track.id).sort()).toEqual(['a', 'b', 'c']);

    jest.restoreAllMocks();
  });
});

describe('moveQueueItem', () => {
  const items = ['a', 'b', 'c', 'd'];

  it('moves an item forward and backward', () => {
    expect(moveQueueItem(items, 0, 2)).toEqual(['b', 'c', 'a', 'd']);
    expect(moveQueueItem(items, 3, 1)).toEqual(['a', 'd', 'b', 'c']);
  });

  it('returns a copy for no-op or out-of-range indexes', () => {
    expect(moveQueueItem(items, 1, 1)).toEqual(items);
    expect(moveQueueItem(items, -1, 2)).toEqual(items);
    expect(moveQueueItem(items, 1, 99)).toEqual(items);
    expect(moveQueueItem(items, 1, 1)).not.toBe(items);
  });
});
