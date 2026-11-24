import { Platform } from 'react-native';

import { SCAN_BATCH_SIZE, scanAudioLibrary } from '@/lib/media/scan';
import { makeTrack } from '@/test/fixtures';
import { mockMediaState } from '@/test/mocks/expo-media-library';

const TOTAL = 1000;

jest.mock('@/lib/metadata/parse-tags', () => ({
  parseTrackTagsBatch: jest.fn(async () => []),
}));

jest.mock('@/lib/metadata/artwork-cache', () => ({
  artworkFileExists: jest.fn(() => true),
  cacheResizedAlbumArt: jest.fn(),
  deleteCachedAlbumArt: jest.fn(),
}));

function rawModificationTime(index: number): number {
  // Android keeps MediaStore ms; iOS helpers scale seconds → ms.
  return Platform.OS === 'android' ? 1_700_000_100_000 + index : 1_700_000_100 + index;
}

function cachedModificationTime(index: number): number {
  const raw = rawModificationTime(index);
  return Platform.OS === 'android' ? raw : raw * 1000;
}

function buildAssets(count: number) {
  return Array.from({ length: count }, (_, index) => {
    const id = String(index + 1);
    return {
      getInfo: async () => ({
        id,
        uri: `file:///music/${id}.flac`,
        filename: `${id}.flac`,
        duration: Platform.OS === 'android' ? 180_000 : 180,
        creationTime: Platform.OS === 'android' ? 1_700_000_000_000 + index : 1_700_000_000 + index,
        modificationTime: rawModificationTime(index),
      }),
    };
  });
}

describe('scanAudioLibrary responsiveness', () => {
  beforeEach(() => {
    mockMediaState.assets = buildAssets(TOTAL);
  });

  it('pages ~1000 cached assets without accumulating the full library', async () => {
    const cached = new Map(
      mockMediaState.assets.map((_, index) => {
        const id = String(index + 1);
        return [
          id,
          makeTrack({
            id,
            uri: `file:///music/${id}.flac`,
            filename: `${id}.flac`,
            sourceModifiedAt: cachedModificationTime(index),
            artworkPath: '',
          }),
        ] as const;
      }),
    );

    const batchSizes: number[] = [];
    let maxBatchLive = 0;

    const started = Date.now();
    const finalProgress = await scanAudioLibrary({
      pageSize: SCAN_BATCH_SIZE,
      getCachedTracks: async (ids) => {
        const map = new Map();
        for (const id of ids) {
          const row = cached.get(id);
          if (row) {
            map.set(id, row);
          }
        }
        return map;
      },
      persistTracks: async () => undefined,
      onBatch: async (batch, progress) => {
        batchSizes.push(batch.length);
        maxBatchLive = Math.max(maxBatchLive, batch.length);
        expect(progress.batchSize).toBe(SCAN_BATCH_SIZE);
      },
    });
    const elapsedMs = Date.now() - started;

    expect(finalProgress.scannedCount).toBe(TOTAL);
    expect(finalProgress.cacheHitCount).toBe(TOTAL);
    expect(finalProgress.reparsedCount).toBe(0);
    expect(finalProgress.done).toBe(true);
    expect(batchSizes.reduce((sum, size) => sum + size, 0)).toBe(TOTAL);
    expect(batchSizes).toHaveLength(Math.ceil(TOTAL / SCAN_BATCH_SIZE));
    expect(maxBatchLive).toBeLessThanOrEqual(SCAN_BATCH_SIZE);
    expect(elapsedMs).toBeLessThan(5000);
  });
});
