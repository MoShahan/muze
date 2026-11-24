import {
  isFlacFilename,
  tagsFromFilename,
  UNKNOWN_ALBUM,
  UNKNOWN_ARTIST,
} from '@/lib/metadata/parse-tags';

describe('tagsFromFilename', () => {
  it('uses the stem as title and Unknown Artist / Album fallbacks', () => {
    expect(tagsFromFilename('My Song.flac')).toEqual({
      title: 'My Song',
      artist: UNKNOWN_ARTIST,
      album: UNKNOWN_ALBUM,
      albumArtist: null,
      trackNumber: null,
      year: null,
      genre: null,
    });
  });

  it('falls back to Unknown Track when the filename is empty', () => {
    expect(tagsFromFilename('').title).toBe('Unknown Track');
  });

  it('keeps names with multiple dots', () => {
    expect(tagsFromFilename('track.01.demo.mp3').title).toBe('track.01.demo');
  });
});

describe('isFlacFilename', () => {
  it.each([
    ['song.flac', true],
    ['song.FLAC', true],
    ['song.mp3', false],
    ['flac', false],
    ['', false],
  ])('%s → %s', (filename, expected) => {
    expect(isFlacFilename(filename)).toBe(expected);
  });
});
