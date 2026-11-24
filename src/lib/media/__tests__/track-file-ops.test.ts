import { normalizeFilenameInput } from '@/lib/media/track-file-ops';

describe('normalizeFilenameInput', () => {
  it('returns the previous filename when draft is empty', () => {
    expect(normalizeFilenameInput('  ', 'song.flac')).toBe('song.flac');
  });

  it('keeps a draft that already has the same extension', () => {
    expect(normalizeFilenameInput('new-name.flac', 'song.flac')).toBe('new-name.flac');
  });

  it('appends the original extension when the draft has none', () => {
    expect(normalizeFilenameInput('new-name', 'song.flac')).toBe('new-name.flac');
  });

  it('forces the original extension when the draft uses a different one', () => {
    expect(normalizeFilenameInput('new-name.mp3', 'song.flac')).toBe('new-name.flac');
  });

  it('returns the trimmed draft when the previous filename has no extension', () => {
    expect(normalizeFilenameInput(' renamed ', 'song')).toBe('renamed');
  });
});
