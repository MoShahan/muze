import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

/** Longest edge for cached album-art thumbnails (plan: ~400px JPEG). */
export const ARTWORK_MAX_EDGE = 400;

export type EmbeddedArtBytes = {
  format: string;
  data: Uint8Array;
};

function safeTrackFileStem(trackId: string): string {
  const cleaned = trackId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return cleaned.length > 0 ? cleaned : 'track';
}

function extensionForFormat(format: string): string {
  const normalized = format.toLowerCase();
  if (normalized.includes('png')) {
    return 'png';
  }
  if (normalized.includes('webp')) {
    return 'webp';
  }
  return 'jpg';
}

function artworkDirectory(): Directory {
  return new Directory(Paths.cache, 'artwork');
}

export function artworkFileExists(path: string | null | undefined): boolean {
  if (!path) {
    return false;
  }
  try {
    return new File(path).exists;
  } catch {
    return false;
  }
}

/**
 * Write embedded art bytes, resize to ~400px JPEG, and return a stable cache URI.
 * Returns null when writing or manipulation fails.
 */
export async function cacheResizedAlbumArt(
  trackId: string,
  art: EmbeddedArtBytes,
): Promise<string | null> {
  if (art.data.byteLength === 0) {
    return null;
  }

  const stem = safeTrackFileStem(trackId);
  const dir = artworkDirectory();
  const rawExt = extensionForFormat(art.format);
  const rawFile = new File(dir, `raw-${stem}.${rawExt}`);
  const outFile = new File(dir, `${stem}.jpg`);

  try {
    if (!dir.exists) {
      dir.create({ intermediates: true, idempotent: true });
    }

    if (rawFile.exists) {
      rawFile.delete();
    }
    rawFile.create();
    await rawFile.write(art.data);

    const context = ImageManipulator.manipulate(rawFile.uri, {
      maxWidth: ARTWORK_MAX_EDGE,
      maxHeight: ARTWORK_MAX_EDGE,
    });
    context.resize({ width: ARTWORK_MAX_EDGE });
    const rendered = await context.renderAsync();
    const saved = await rendered.saveAsync({
      format: SaveFormat.JPEG,
      compress: 0.82,
    });

    if (outFile.exists) {
      outFile.delete();
    }
    const savedFile = new File(saved.uri);
    await savedFile.copy(outFile);

    if (rawFile.exists) {
      rawFile.delete();
    }
    if (savedFile.exists && savedFile.uri !== outFile.uri) {
      savedFile.delete();
    }

    return outFile.uri;
  } catch {
    try {
      if (rawFile.exists) {
        rawFile.delete();
      }
    } catch {
      // Best-effort cleanup.
    }
    return null;
  }
}

/** Remove a cached artwork file if present. */
export function deleteCachedAlbumArt(path: string | null | undefined): void {
  if (!path) {
    return;
  }
  try {
    const file = new File(path);
    if (file.exists) {
      file.delete();
    }
  } catch {
    // Ignore eviction / already-gone files.
  }
}
