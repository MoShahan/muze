import { EncodingType, getInfoAsync, readAsStringAsync } from 'expo-file-system/legacy';
import { parseBuffer } from 'music-metadata';

import type { EmbeddedArtBytes } from '@/lib/metadata/artwork-cache';

export const UNKNOWN_ARTIST = 'Unknown Artist';
export const UNKNOWN_ALBUM = 'Unknown Album';

/** Default header read for text tags (avoids loading whole FLACs). */
export const TAG_HEADER_MAX_BYTES = 512 * 1024;

/**
 * Larger window for FLAC when detecting METADATA_BLOCK_PICTURE —
 * embedded art often sits in early blocks but can exceed 512KB.
 */
export const FLAC_ART_HEADER_MAX_BYTES = 4 * 1024 * 1024;

export type ParsedTrackTags = {
  title: string;
  artist: string;
  album: string;
  albumArtist: string | null;
  trackNumber: number | null;
  year: number | null;
  genre: string | null;
};

export type ParsedTrackTagsDetailed = ParsedTrackTags & {
  container: string | null;
  tagTypes: string[];
  hasEmbeddedArt: boolean;
  /** Present when includeArt is true and a picture was found. */
  art: EmbeddedArtBytes | null;
};

export type ParseTrackTagsOptions = {
  /** When true, parse cover art (uses a larger read for FLAC). */
  includeArt?: boolean;
};

const EXT_MIME: Record<string, string> = {
  mp3: 'audio/mpeg',
  flac: 'audio/flac',
  m4a: 'audio/mp4',
  m4b: 'audio/mp4',
  mp4: 'audio/mp4',
  aac: 'audio/aac',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  opus: 'audio/ogg',
};

function stripExtension(filename: string): string {
  const trimmed = filename.trim();
  const dot = trimmed.lastIndexOf('.');
  if (dot <= 0) {
    return trimmed;
  }
  return trimmed.slice(0, dot);
}

function extensionOf(filename: string): string | null {
  const dot = filename.lastIndexOf('.');
  if (dot <= 0 || dot === filename.length - 1) {
    return null;
  }
  return filename.slice(dot + 1).toLowerCase();
}

export function isFlacFilename(filename: string): boolean {
  return extensionOf(filename) === 'flac';
}

function mimeFromFilename(filename: string): string | undefined {
  const ext = extensionOf(filename);
  return ext ? EXT_MIME[ext] : undefined;
}

function firstNonEmpty(...values: (string | undefined | null)[]): string | null {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) {
      return trimmed;
    }
  }
  return null;
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = globalThis.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** Filename-based fallbacks when tags are missing or unreadable. */
export function tagsFromFilename(filename: string): ParsedTrackTags {
  const title = stripExtension(filename) || 'Unknown Track';
  return {
    title,
    artist: UNKNOWN_ARTIST,
    album: UNKNOWN_ALBUM,
    albumArtist: null,
    trackNumber: null,
    year: null,
    genre: null,
  };
}

function mergeWithFallbacks(filename: string, partial: Partial<ParsedTrackTags>): ParsedTrackTags {
  const fallback = tagsFromFilename(filename);
  return {
    title: firstNonEmpty(partial.title, fallback.title) ?? fallback.title,
    artist: firstNonEmpty(partial.artist, fallback.artist) ?? UNKNOWN_ARTIST,
    album: firstNonEmpty(partial.album, fallback.album) ?? UNKNOWN_ALBUM,
    albumArtist: firstNonEmpty(partial.albumArtist) ?? null,
    trackNumber: partial.trackNumber ?? null,
    year: partial.year ?? null,
    genre: firstNonEmpty(partial.genre) ?? null,
  };
}

async function readTagHeaderBytes(uri: string, maxBytes: number): Promise<Uint8Array> {
  const info = await getInfoAsync(uri);
  const size = info.exists ? info.size : maxBytes;
  const length = Math.min(Math.max(size, 0), maxBytes);

  if (length === 0) {
    return new Uint8Array();
  }

  const base64 = await readAsStringAsync(uri, {
    encoding: EncodingType.Base64,
    length,
    position: 0,
  });

  return base64ToUint8Array(base64);
}

function emptyDetailed(filename: string): ParsedTrackTagsDetailed {
  return {
    ...tagsFromFilename(filename),
    container: null,
    tagTypes: [],
    hasEmbeddedArt: false,
    art: null,
  };
}

/**
 * Parse embedded tags (and optionally album art) from a device audio URI.
 * On failure or empty tags, falls back to filename / Unknown Artist / Unknown Album.
 */
export async function parseTrackTagsDetailed(
  uri: string,
  filename: string,
  options: ParseTrackTagsOptions = {},
): Promise<ParsedTrackTagsDetailed> {
  const includeArt = options.includeArt === true;
  const fallback = emptyDetailed(filename);
  const maxBytes =
    includeArt && isFlacFilename(filename) ? FLAC_ART_HEADER_MAX_BYTES : TAG_HEADER_MAX_BYTES;

  try {
    const bytes = await readTagHeaderBytes(uri, maxBytes);
    if (bytes.byteLength === 0) {
      return fallback;
    }

    const metadata = await parseBuffer(bytes, mimeFromFilename(filename), {
      duration: false,
      skipCovers: !includeArt,
    });

    const common = metadata.common;
    const tags = mergeWithFallbacks(filename, {
      title: common.title,
      artist: firstNonEmpty(common.artist, common.artists?.join(', ')) ?? undefined,
      album: common.album,
      albumArtist: firstNonEmpty(common.albumartist) ?? undefined,
      trackNumber: typeof common.track?.no === 'number' ? common.track.no : null,
      year: typeof common.year === 'number' ? common.year : null,
      genre: firstNonEmpty(common.genre?.[0]) ?? undefined,
    });

    const picture = includeArt ? (common.picture?.[0] ?? null) : null;
    const art =
      picture && picture.data.byteLength > 0
        ? { format: picture.format, data: picture.data }
        : null;

    return {
      ...tags,
      container: metadata.format.container ?? null,
      tagTypes: metadata.format.tagTypes ?? [],
      hasEmbeddedArt: art != null,
      art,
    };
  } catch {
    // Hermes / unreadable content:// / unsupported format → safe fallbacks.
    return fallback;
  }
}

export async function parseTrackTags(uri: string, filename: string): Promise<ParsedTrackTags> {
  const detailed = await parseTrackTagsDetailed(uri, filename, { includeArt: false });
  return {
    title: detailed.title,
    artist: detailed.artist,
    album: detailed.album,
    albumArtist: detailed.albumArtist,
    trackNumber: detailed.trackNumber,
    year: detailed.year,
    genre: detailed.genre,
  };
}

/** True when music-metadata reported Vorbis comments (typical for FLAC). */
export function hasVorbisTags(tagTypes: string[]): boolean {
  return tagTypes.some((type) => type.toLowerCase().includes('vorbis'));
}

type BatchParseOptions = {
  concurrency?: number;
  signal?: AbortSignal;
  includeArt?: boolean;
};

/** Parse tags for a batch with limited concurrency to avoid memory spikes. */
export async function parseTrackTagsBatch<T extends { uri: string; filename: string }>(
  items: T[],
  options?: BatchParseOptions,
): Promise<(T & { tags: ParsedTrackTagsDetailed })[]> {
  const concurrency = options?.concurrency ?? 3;
  const includeArt = options?.includeArt === true;
  const results: (T & { tags: ParsedTrackTagsDetailed })[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (true) {
      if (options?.signal?.aborted) {
        throw new DOMException('Tag parse aborted', 'AbortError');
      }
      const index = nextIndex;
      nextIndex += 1;
      if (index >= items.length) {
        return;
      }
      const item = items[index];
      const tags = await parseTrackTagsDetailed(item.uri, item.filename, { includeArt });
      results[index] = { ...item, tags };
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}
