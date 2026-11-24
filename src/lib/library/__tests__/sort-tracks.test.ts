import {
  DEFAULT_TRACK_SORT,
  isTrackSortKey,
  sortTracks,
  TRACK_SORT_OPTIONS,
} from '@/lib/library/sort-tracks';
import { makeTrack } from '@/test/fixtures';

const tracks = [
  makeTrack({
    id: '1',
    title: 'Banana',
    artist: 'Zebra',
    dateAdded: 100,
    durationMs: 200_000,
  }),
  makeTrack({
    id: '2',
    title: 'Apple',
    artist: 'Alpha',
    dateAdded: 300,
    durationMs: 100_000,
  }),
  makeTrack({
    id: '3',
    title: 'Cherry',
    artist: 'Alpha',
    dateAdded: 200,
    durationMs: 150_000,
  }),
];

describe('isTrackSortKey / defaults', () => {
  it('accepts supported keys only', () => {
    expect(isTrackSortKey('title')).toBe(true);
    expect(isTrackSortKey('artist')).toBe(true);
    expect(isTrackSortKey('dateAdded')).toBe(true);
    expect(isTrackSortKey('duration')).toBe(true);
    expect(isTrackSortKey('album')).toBe(false);
    expect(isTrackSortKey(null)).toBe(false);
  });

  it('exposes four options and defaults to title', () => {
    expect(TRACK_SORT_OPTIONS).toHaveLength(4);
    expect(DEFAULT_TRACK_SORT).toBe('title');
  });
});

describe('sortTracks', () => {
  it('sorts by title then artist', () => {
    expect(sortTracks(tracks, 'title').map((track) => track.id)).toEqual(['2', '1', '3']);
  });

  it('sorts by artist then title', () => {
    expect(sortTracks(tracks, 'artist').map((track) => track.id)).toEqual(['2', '3', '1']);
  });

  it('sorts by date added newest first', () => {
    expect(sortTracks(tracks, 'dateAdded').map((track) => track.id)).toEqual(['2', '3', '1']);
  });

  it('sorts by duration ascending', () => {
    expect(sortTracks(tracks, 'duration').map((track) => track.id)).toEqual(['2', '3', '1']);
  });

  it('does not mutate the input array', () => {
    const original = [...tracks];
    sortTracks(tracks, 'title');
    expect(tracks.map((track) => track.id)).toEqual(original.map((track) => track.id));
  });
});
