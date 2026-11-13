import { EncodingType, getInfoAsync, readAsStringAsync } from 'expo-file-system/legacy';
import { parseBuffer } from 'music-metadata';

export const UNKNOWN_ARTIST = 'Unknown Artist';
export const UNKNOWN_ALBUM = 'Unknown Album';

/** How many leading bytes to read for tag parsing (avoids loading whole FLACs). */
export const TAG_HEADER_MAX_BYTES = 512 * 1024;

export type ParsedTrackTags = {
  title: string;
  artist: string;
  album: string;
  albumArtist: string | null;
  trackNumber: number | null;
  year: number | null;
  genre: string | null;
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

async function readTagHeaderBytes(uri: string): Promise<Uint8Array> {
  const info = await getInfoAsync(uri);
  const size = info.exists ? info.size : TAG_HEADER_MAX_BYTES;
  const length = Math.min(Math.max(size, 0), TAG_HEADER_MAX_BYTES);

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

/**
 * Parse embedded tags from a device audio URI.
 * On failure or empty tags, falls back to filename / Unknown Artist / Unknown Album.
 */
export async function parseTrackTags(uri: string, filename: string): Promise<ParsedTrackTags> {
  const fallback = tagsFromFilename(filename);

  try {
    const bytes = await readTagHeaderBytes(uri);
    if (bytes.byteLength === 0) {
      return fallback;
    }

    const metadata = await parseBuffer(bytes, mimeFromFilename(filename), {
      duration: false,
      skipCovers: true,
    });

    const common = metadata.common;
    return mergeWithFallbacks(filename, {
      title: common.title,
      artist: firstNonEmpty(common.artist, common.artists?.join(', ')) ?? undefined,
      album: common.album,
      albumArtist: firstNonEmpty(common.albumartist) ?? undefined,
      trackNumber: typeof common.track?.no === 'number' ? common.track.no : null,
      year: typeof common.year === 'number' ? common.year : null,
      genre: firstNonEmpty(common.genre?.[0]) ?? undefined,
    });
  } catch {
    // Hermes / unreadable content:// / unsupported format → safe fallbacks.
    return fallback;
  }
}

/** Parse tags for a batch with limited concurrency to avoid memory spikes. */
export async function parseTrackTagsBatch<T extends { uri: string; filename: string }>(
  items: T[],
  options?: { concurrency?: number; signal?: AbortSignal },
): Promise<(T & { tags: ParsedTrackTags })[]> {
  const concurrency = options?.concurrency ?? 3;
  const results: (T & { tags: ParsedTrackTags })[] = new Array(items.length);
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
      const tags = await parseTrackTags(item.uri, item.filename);
      results[index] = { ...item, tags };
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}
