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

export type ScanAudioAssetsOptions = {
  /** Page size for Query limit/offset. Default 100. */
  pageSize?: number;
  /** Optional callback after each page (useful for progress UI later). */
  onPage?: (page: ScannedAudioAsset[], accumulatedCount: number) => void;
};

const DEFAULT_PAGE_SIZE = 100;

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

/**
 * Query one page of audio assets from the device media library.
 * Requires audio library permission (see `@/lib/media/permissions`).
 */
export async function queryAudioAssetPage(
  offset: number,
  limit: number = DEFAULT_PAGE_SIZE,
): Promise<ScannedAudioAsset[]> {
  const assets = await new Query()
    .eq(AssetField.MEDIA_TYPE, MediaType.AUDIO)
    .orderBy({ key: AssetField.CREATION_TIME, ascending: false })
    .limit(limit)
    .offset(offset)
    .exe();

  const page: ScannedAudioAsset[] = [];
  for (const asset of assets) {
    const info = await asset.getInfo();
    page.push({
      id: info.id,
      uri: info.uri,
      filename: info.filename,
      durationMs: secondsToMs(info.duration),
      creationTimeMs: optionalSecondsToMs(info.creationTime),
      modificationTimeMs: optionalSecondsToMs(info.modificationTime),
    });
  }
  return page;
}

/**
 * Scan all device audio assets (`MediaType.AUDIO`) via Expo SDK 58 MediaLibrary Query.
 * Does not parse tags or write SQLite — that is later Phase 3 work.
 */
export async function scanAudioAssets(
  options: ScanAudioAssetsOptions = {},
): Promise<ScannedAudioAsset[]> {
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;
  const results: ScannedAudioAsset[] = [];
  let offset = 0;

  while (true) {
    const page = await queryAudioAssetPage(offset, pageSize);
    if (page.length === 0) {
      break;
    }
    results.push(...page);
    options.onPage?.(page, results.length);
    if (page.length < pageSize) {
      break;
    }
    offset += pageSize;
  }

  return results;
}
