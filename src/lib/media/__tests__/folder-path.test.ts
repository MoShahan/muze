import { folderDisplayName, folderPathFromUri } from '@/lib/media/folder-path';

describe('folderPathFromUri', () => {
  it('returns the parent path for file URIs', () => {
    expect(
      folderPathFromUri('file:///storage/emulated/0/Music/Album/track.flac', 'track.flac'),
    ).toBe('Music/Album');
  });

  it('returns null for opaque content URIs', () => {
    expect(folderPathFromUri('content://media/external/audio/media/12', 'track.flac')).toBeNull();
  });

  it('returns null for empty or root-only paths', () => {
    expect(folderPathFromUri('', 'track.flac')).toBeNull();
    expect(folderPathFromUri('file:///', 'track.flac')).toBeNull();
  });

  it('strips the filename even when casing differs', () => {
    expect(folderPathFromUri('file:///Music/Band/Track.FLAC', 'track.flac')).toBe('Music/Band');
  });
});

describe('folderDisplayName', () => {
  it('returns the last path segment', () => {
    expect(folderDisplayName('Music/Album One')).toBe('Album One');
  });

  it('returns the whole path when there is no slash', () => {
    expect(folderDisplayName('Singles')).toBe('Singles');
  });
});
