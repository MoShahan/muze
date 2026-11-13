import { AssetField, MediaType, Query } from 'expo-media-library';

/** Device audio asset as returned by MediaLibrary (no tag parsing yet). */
export type ScannedAudioAsset = {
  id: string;
  uri: string;
  filename: string;
  /** Duration in milliseconds (MediaLibrary reports seconds). */
  durationMs: number;
  /** Creation time in milliseconds, when available. */
  creationTimeMs: number | null;
  /** Modification time in milliseconds, when available. */
  modificationTimeMs: number | null;
};

export type AudioScanProgress = {
  /** Total assets processed so far. */
  scannedCount: number;
  /** Zero-based batch index. */
  batchIndex: number;
  /** Size requested for each Query page. */
  batchSize: number;
  /** True when the last batch has been delivered. */
  done: boolean;
};

export type ScanAudioLibraryOptions = {
  /** Page size for Query limit/offset. Default 50. */
  pageSize?: number;
  /** Cancel mid-scan (e.g. screen unmount). */
  signal?: AbortSignal;
  /**
   * Called once per batch. The batch array is only valid for this call —
   * do not retain it if you want to avoid holding the full library in memory.
   * Persist or process here (SQLite upsert comes in a later task).
   */
  onBatch: (batch: ScannedAudioAsset[], progress: AudioScanProgress) => void | Promise<void>;
};

/** Default bounded page size for MediaLibrary queries. */
export const SCAN_BATCH_SIZE = 50;

function secondsToMs(value: number | null | undefined): number {
  if (value == null || Number.isNaN(value)) {
    return 0;
  }
  return Math.max(0, Math.round(value * 1000));
}

function optionalSecondsToMs(value: number | null | undefined): number | null {
  if (value == null || Number.isNaN(value)) {
    return null;
  }
  return Math.round(value * 1000);
}

function assertNotAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw new DOMException('Audio scan aborted', 'AbortError');
  }
}

/** Yield so React can paint progress between batches. */
function yieldToUi(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

/**
 * Query one page of audio assets from the device media library.
 * Requires audio library permission (see `@/lib/media/permissions`).
 */
export async function queryAudioAssetPage(
  offset: number,
  limit: number = SCAN_BATCH_SIZE,
  signal?: AbortSignal,
): Promise<ScannedAudioAsset[]> {
  assertNotAborted(signal);

  const assets = await new Query()
    .eq(AssetField.MEDIA_TYPE, MediaType.AUDIO)
    .orderBy({ key: AssetField.CREATION_TIME, ascending: false })
    .limit(limit)
    .offset(offset)
    .exe();

  assertNotAborted(signal);

  // Resolve info for this page only (parallel within the batch, not the whole library).
  const page = await Promise.all(
    assets.map(async (asset) => {
      const info = await asset.getInfo();
      return {
        id: info.id,
        uri: info.uri,
        filename: info.filename,
        durationMs: secondsToMs(info.duration),
        creationTimeMs: optionalSecondsToMs(info.creationTime),
        modificationTimeMs: optionalSecondsToMs(info.modificationTime),
      } satisfies ScannedAudioAsset;
    }),
  );

  return page;
}

/**
 * Scan device audio in bounded batches. Never accumulates the full library in one array.
 * Callers should process/persist each batch inside `onBatch`, then let it go out of scope.
 */
export async function scanAudioLibrary(
  options: ScanAudioLibraryOptions,
): Promise<AudioScanProgress> {
  const batchSize = options.pageSize ?? SCAN_BATCH_SIZE;
  let offset = 0;
  let scannedCount = 0;
  let batchIndex = 0;

  while (true) {
    assertNotAborted(options.signal);

    const batch = await queryAudioAssetPage(offset, batchSize, options.signal);
    if (batch.length === 0) {
      const progress: AudioScanProgress = {
        scannedCount,
        batchIndex,
        batchSize,
        done: true,
      };
      return progress;
    }

    scannedCount += batch.length;
    const isLast = batch.length < batchSize;
    const progress: AudioScanProgress = {
      scannedCount,
      batchIndex,
      batchSize,
      done: isLast,
    };

    await options.onBatch(batch, progress);
    // Drop local reference; caller must not retain `batch` if avoiding full-library memory.
    batch.length = 0;

    await yieldToUi();

    if (isLast) {
      return progress;
    }

    offset += batchSize;
    batchIndex += 1;
  }
}
