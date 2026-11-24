import { MIN_MUSIC_DURATION_SECONDS, SCAN_BATCH_SIZE, shouldReparseTrack } from '@/lib/media/scan';
import { makeTrack } from '@/test/fixtures';

jest.mock('@/lib/metadata/artwork-cache', () => ({
  artworkFileExists: jest.fn((path: string) => path === '/art/exists.jpg'),
  cacheResizedAlbumArt: jest.fn(),
  deleteCachedAlbumArt: jest.fn(),
}));

const baseAsset = {
  id: '1',
  uri: 'file:///music/1.flac',
  filename: '1.flac',
  durationMs: 180_000,
  creationTimeMs: 1_700_000_000_000,
  modificationTimeMs: 1_700_000_100_000,
  folderPath: 'Music/Album',
};

describe('scan constants', () => {
  it('uses bounded batch size and 30s minimum duration', () => {
    expect(SCAN_BATCH_SIZE).toBe(50);
    expect(MIN_MUSIC_DURATION_SECONDS).toBe(30);
  });
});

describe('shouldReparseTrack', () => {
  it('reparses when there is no cache row', () => {
    expect(shouldReparseTrack(baseAsset, undefined)).toBe(true);
  });

  it('reuses cache when uri, filename, mtime, and art are unchanged', () => {
    const cached = makeTrack({
      id: '1',
      uri: baseAsset.uri,
      filename: baseAsset.filename,
      sourceModifiedAt: baseAsset.modificationTimeMs,
      artworkPath: '',
    });
    expect(shouldReparseTrack(baseAsset, cached)).toBe(false);
  });

  it('reparses when uri or filename changed', () => {
    const cached = makeTrack({
      id: '1',
      uri: baseAsset.uri,
      filename: baseAsset.filename,
      sourceModifiedAt: baseAsset.modificationTimeMs,
      artworkPath: '',
    });
    expect(shouldReparseTrack({ ...baseAsset, uri: 'file:///other.flac' }, cached)).toBe(true);
    expect(shouldReparseTrack({ ...baseAsset, filename: 'other.flac' }, cached)).toBe(true);
  });

  it('reparses when mtime changed', () => {
    const cached = makeTrack({
      id: '1',
      uri: baseAsset.uri,
      filename: baseAsset.filename,
      sourceModifiedAt: baseAsset.modificationTimeMs,
      artworkPath: '',
    });
    expect(
      shouldReparseTrack(
        { ...baseAsset, modificationTimeMs: baseAsset.modificationTimeMs + 1 },
        cached,
      ),
    ).toBe(true);
  });

  it('accepts legacy double-scaled mtime as a cache hit', () => {
    const cached = makeTrack({
      id: '1',
      uri: baseAsset.uri,
      filename: baseAsset.filename,
      sourceModifiedAt: baseAsset.modificationTimeMs * 1000,
      artworkPath: '',
    });
    expect(shouldReparseTrack(baseAsset, cached)).toBe(false);
  });

  it('reparses when artwork was never extracted (null)', () => {
    const cached = makeTrack({
      id: '1',
      uri: baseAsset.uri,
      filename: baseAsset.filename,
      sourceModifiedAt: baseAsset.modificationTimeMs,
      artworkPath: null,
    });
    expect(shouldReparseTrack(baseAsset, cached)).toBe(true);
  });

  it('reparses when cached artwork file was evicted', () => {
    const cached = makeTrack({
      id: '1',
      uri: baseAsset.uri,
      filename: baseAsset.filename,
      sourceModifiedAt: baseAsset.modificationTimeMs,
      artworkPath: '/art/missing.jpg',
    });
    expect(shouldReparseTrack(baseAsset, cached)).toBe(true);
  });

  it('keeps cache when artwork file still exists', () => {
    const cached = makeTrack({
      id: '1',
      uri: baseAsset.uri,
      filename: baseAsset.filename,
      sourceModifiedAt: baseAsset.modificationTimeMs,
      artworkPath: '/art/exists.jpg',
    });
    expect(shouldReparseTrack(baseAsset, cached)).toBe(false);
  });
});
