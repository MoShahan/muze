import { formatCountLabel, formatDurationMs, matchesLibraryQuery } from '@/lib/library/filter';

describe('matchesLibraryQuery', () => {
  it('matches case-insensitive substrings and treats blank as match-all', () => {
    expect(matchesLibraryQuery('Dark Side of the Moon', 'side')).toBe(true);
    expect(matchesLibraryQuery('Dark Side of the Moon', 'SIDE')).toBe(true);
    expect(matchesLibraryQuery('Dark Side of the Moon', '  ')).toBe(true);
    expect(matchesLibraryQuery('Dark Side of the Moon', 'jazz')).toBe(false);
  });
});

describe('format helpers', () => {
  it('formats duration as m:ss', () => {
    expect(formatDurationMs(0)).toBe('0:00');
    expect(formatDurationMs(65_400)).toBe('1:05');
    expect(formatDurationMs(-1000)).toBe('0:00');
  });

  it('formats plural-aware count labels', () => {
    expect(formatCountLabel(1, 'track')).toBe('1 track');
    expect(formatCountLabel(12, 'album')).toBe('12 albums');
    expect(formatCountLabel(0, 'song', 'songs')).toBe('0 songs');
  });
});
