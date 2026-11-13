import { AssetField, MediaType, Query } from 'expo-media-library';

import { folderPathFromUri } from '@/lib/media/folder-path';
import {
  artworkFileExists,
  cacheResizedAlbumArt,
  deleteCachedAlbumArt,
} from '@/lib/metadata/artwork-cache';
import { parseTrackTagsBatch } from '@/lib/metadata/parse-tags';

import type { CachedTrackRow, UpsertTrackInput } from '@/lib/db/tracks';

/** Device audio asset from MediaLibrary, with parsed tags (or filename fallbacks). */
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
  /** Device folder path / MediaStore album folder label when known. */
  folderPath: string | null;
  title: string;
  artist: string;
  album: string;
  albumArtist: string | null;
  trackNumber: number | null;
  year: number | null;
  genre: string | null;
  /** App-cache JPEG path when embedded art was cached. */
  artworkPath: string | null;
  /** True when tags/art came from SQLite cache without re-parse. */
  fromCache: boolean;
};

type RawScannedAudioAsset = Omit<
  ScannedAudioAsset,
  | 'title'
  | 'artist'
  | 'album'
  | 'albumArtist'
  | 'trackNumber'
  | 'year'
  | 'genre'
  | 'artworkPath'
  | 'fromCache'
>;

export type AudioScanProgress = {
  /** Total assets processed so far. */
  scannedCount: number;
  /** Assets reused from SQLite + artwork cache. */
  cacheHitCount: number;
  /** Assets that were tag-parsed this run. */
  reparsedCount: number;
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
  /** Look up cached metadata for this page of MediaStore ids. */
  getCachedTracks?: (ids: string[]) => Promise<Map<string, CachedTrackRow>>;
  /** Persist parsed metadata + artwork paths after each batch. */
  persistTracks?: (tracks: UpsertTrackInput[]) => Promise<void>;
  /**
   * Called once per batch. The batch array is only valid for this call —
   * do not retain it if you want to avoid holding the full library in memory.
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

function fromCachedRow(asset: RawScannedAudioAsset, cached: CachedTrackRow): ScannedAudioAsset {
  return {
    ...asset,
    // Prefer freshly derived folder path so folder browse stays current without a full re-parse.
    folderPath: asset.folderPath ?? cached.folderPath,
    title: cached.title,
    artist: cached.artist,
    album: cached.album,
    albumArtist: cached.albumArtist,
    trackNumber: cached.trackNumber,
    year: cached.year,
    genre: cached.genre,
    artworkPath: cached.artworkPath,
    fromCache: true,
  };
}

/**
 * Re-parse when missing, uri changed, mtime changed, or cached artwork file was evicted.
 */
export function shouldReparseTrack(
  asset: RawScannedAudioAsset,
  cached: CachedTrackRow | undefined,
): boolean {
  if (!cached) {
    return true;
  }
  if (cached.uri !== asset.uri || cached.filename !== asset.filename) {
    return true;
  }
  if (cached.sourceModifiedAt !== asset.modificationTimeMs) {
    return true;
  }
  if (cached.artworkPath && !artworkFileExists(cached.artworkPath)) {
    return true;
  }
  return false;
}

function toUpsertInput(asset: ScannedAudioAsset): UpsertTrackInput {
  return {
    id: asset.id,
    uri: asset.uri,
    filename: asset.filename,
    title: asset.title,
    artist: asset.artist,
    album: asset.album,
    albumArtist: asset.albumArtist,
    trackNumber: asset.trackNumber,
    year: asset.year,
    genre: asset.genre,
    durationMs: asset.durationMs,
    artworkPath: asset.artworkPath,
    folderPath: asset.folderPath,
    dateAdded: asset.creationTimeMs,
    sourceModifiedAt: asset.modificationTimeMs,
  };
}

async function resolveFolderPath(
  asset: { getAlbums: () => Promise<{ getTitle: () => Promise<string> }[]> },
  uri: string,
  filename: string,
): Promise<string | null> {
  const fromUri = folderPathFromUri(uri, filename);
  if (fromUri) {
    return fromUri;
  }
  try {
    const albums = await asset.getAlbums();
    if (albums[0]) {
      const title = (await albums[0].getTitle()).trim();
      return title.length > 0 ? title : null;
    }
  } catch {
    // Album lookup is best-effort on opaque content:// URIs.
  }
  return null;
}

/**
 * Query one page of audio assets from the device media library.
 * Reuses SQLite-cached tags/art when the file is unchanged; otherwise re-parses
 * (including embedded art) and writes a ~400px JPEG into app cache.
 */
export async function queryAudioAssetPage(
  offset: number,
  limit: number = SCAN_BATCH_SIZE,
  signal?: AbortSignal,
  options?: Pick<ScanAudioLibraryOptions, 'getCachedTracks' | 'persistTracks'>,
): Promise<{ assets: ScannedAudioAsset[]; cacheHits: number; reparsed: number }> {
  assertNotAborted(signal);

  const assets = await new Query()
    .eq(AssetField.MEDIA_TYPE, MediaType.AUDIO)
    .orderBy({ key: AssetField.CREATION_TIME, ascending: false })
    .limit(limit)
    .offset(offset)
    .exe();

  assertNotAborted(signal);

  const page: RawScannedAudioAsset[] = await Promise.all(
    assets.map(async (asset) => {
      const info = await asset.getInfo();
      const folderPath = await resolveFolderPath(asset, info.uri, info.filename);
      return {
        id: info.id,
        uri: info.uri,
        filename: info.filename,
        durationMs: secondsToMs(info.duration),
        creationTimeMs: optionalSecondsToMs(info.creationTime),
        modificationTimeMs: optionalSecondsToMs(info.modificationTime),
        folderPath,
      } satisfies RawScannedAudioAsset;
    }),
  );

  assertNotAborted(signal);

  const cachedMap = options?.getCachedTracks
    ? await options.getCachedTracks(page.map((item) => item.id))
    : new Map<string, CachedTrackRow>();

  const cachedAssets: ScannedAudioAsset[] = [];
  const toParse: RawScannedAudioAsset[] = [];

  for (const asset of page) {
    const cached = cachedMap.get(asset.id);
    if (shouldReparseTrack(asset, cached)) {
      toParse.push(asset);
    } else if (cached) {
      cachedAssets.push(fromCachedRow(asset, cached));
    } else {
      toParse.push(asset);
    }
  }

  assertNotAborted(signal);

  const tagged = await parseTrackTagsBatch(toParse, {
    signal,
    concurrency: 2,
    includeArt: true,
  });

  const parsedAssets: ScannedAudioAsset[] = [];
  for (const item of tagged) {
    assertNotAborted(signal);
    const previous = cachedMap.get(item.id);
    let artworkPath: string | null = null;

    if (item.tags.art) {
      artworkPath = await cacheResizedAlbumArt(item.id, item.tags.art);
      // Drop raw picture bytes ASAP after caching.
      item.tags.art = null;
    } else if (previous?.artworkPath) {
      deleteCachedAlbumArt(previous.artworkPath);
    }

    parsedAssets.push({
      id: item.id,
      uri: item.uri,
      filename: item.filename,
      durationMs: item.durationMs,
      creationTimeMs: item.creationTimeMs,
      modificationTimeMs: item.modificationTimeMs,
      folderPath: item.folderPath,
      title: item.tags.title,
      artist: item.tags.artist,
      album: item.tags.album,
      albumArtist: item.tags.albumArtist,
      trackNumber: item.tags.trackNumber,
      year: item.tags.year,
      genre: item.tags.genre,
      artworkPath,
      fromCache: false,
    });
  }

  const merged = [...cachedAssets, ...parsedAssets];
  // Keep MediaLibrary page order.
  const byId = new Map(merged.map((asset) => [asset.id, asset]));
  const ordered = page
    .map((raw) => byId.get(raw.id))
    .filter((asset): asset is ScannedAudioAsset => asset != null);

  if (options?.persistTracks) {
    await options.persistTracks(ordered.map(toUpsertInput));
  }

  return {
    assets: ordered,
    cacheHits: cachedAssets.length,
    reparsed: parsedAssets.length,
  };
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
  let cacheHitCount = 0;
  let reparsedCount = 0;
  let batchIndex = 0;

  while (true) {
    assertNotAborted(options.signal);

    const page = await queryAudioAssetPage(offset, batchSize, options.signal, {
      getCachedTracks: options.getCachedTracks,
      persistTracks: options.persistTracks,
    });

    if (page.assets.length === 0) {
      return {
        scannedCount,
        cacheHitCount,
        reparsedCount,
        batchIndex,
        batchSize,
        done: true,
      };
    }

    scannedCount += page.assets.length;
    cacheHitCount += page.cacheHits;
    reparsedCount += page.reparsed;
    const isLast = page.assets.length < batchSize;
    const progress: AudioScanProgress = {
      scannedCount,
      cacheHitCount,
      reparsedCount,
      batchIndex,
      batchSize,
      done: isLast,
    };

    await options.onBatch(page.assets, progress);
    page.assets.length = 0;

    await yieldToUi();

    if (isLast) {
      return progress;
    }

    offset += batchSize;
    batchIndex += 1;
  }
}
