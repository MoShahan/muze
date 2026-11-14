/**
 * Device file operations for the track editor: tag write, rename, delete.
 * Tag writes and renames stay independent. Android system approval is required
 * for MediaLibrary delete / recreate flows.
 */
import { Directory, File, Paths } from 'expo-file-system';
import { Asset } from 'expo-media-library';

import { applyTagPatchToBytes } from '@/lib/metadata/write-tags';

import type { CachedTrackRow, TrackMetadataUpdate, UpsertTrackInput } from '@/lib/db/tracks';

export type FileOpResult = { ok: true; track: UpsertTrackInput } | { ok: false; message: string };

function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf('.');
  if (dot <= 0 || dot === filename.length - 1) {
    return '';
  }
  return filename.slice(dot);
}

function stemOf(filename: string): string {
  const ext = extensionOf(filename);
  return ext ? filename.slice(0, -ext.length) : filename;
}

/** Keep the original extension when the user clears or omits it. */
export function normalizeFilenameInput(draft: string, previousFilename: string): string {
  const trimmed = draft.trim();
  if (!trimmed) {
    return previousFilename;
  }
  const previousExt = extensionOf(previousFilename);
  if (!previousExt) {
    return trimmed;
  }
  if (extensionOf(trimmed).toLowerCase() === previousExt.toLowerCase()) {
    return trimmed;
  }
  // User typed a stem only, or a different extension — force original extension.
  if (!extensionOf(trimmed)) {
    return `${trimmed}${previousExt}`;
  }
  return `${stemOf(trimmed)}${previousExt}`;
}

async function readTrackBytes(uri: string): Promise<Uint8Array> {
  const file = new File(uri);
  if (!file.exists) {
    throw new Error('Audio file is not readable on this device.');
  }
  return file.bytes();
}

function stagingDirectory(): Directory {
  return new Directory(Paths.cache, 'track-edits');
}

async function writeStagingFile(filename: string, bytes: Uint8Array): Promise<File> {
  const dir = stagingDirectory();
  if (!dir.exists) {
    dir.create({ intermediates: true, idempotent: true });
  }
  const safeName = filename.replace(/[\\/:*?"<>|]/g, '_');
  const out = new File(dir, safeName);
  if (out.exists) {
    out.delete();
  }
  out.create();
  await out.write(bytes);
  return out;
}

async function createAssetFromStaging(staging: File): Promise<Asset> {
  return Asset.create(staging.uri);
}

function toUpsertFromAsset(
  previous: CachedTrackRow,
  asset: Asset,
  filename: string,
  uri: string,
  metadata: TrackMetadataUpdate,
): UpsertTrackInput {
  return {
    id: asset.id,
    uri,
    filename,
    title: metadata.title,
    artist: metadata.artist,
    album: metadata.album,
    albumArtist: metadata.albumArtist,
    trackNumber: metadata.trackNumber,
    year: metadata.year,
    genre: metadata.genre,
    durationMs: previous.durationMs,
    artworkPath: previous.artworkPath,
    folderPath: previous.folderPath,
    dateAdded: previous.dateAdded,
    sourceModifiedAt: Date.now(),
  };
}

/**
 * Write metadata tags into the audio file (no filename change).
 * Tries in-place write; falls back to MediaStore recreate + delete (system prompt).
 */
export async function writeTrackTagsOnDevice(
  track: CachedTrackRow,
  metadata: TrackMetadataUpdate,
): Promise<FileOpResult> {
  try {
    const source = await readTrackBytes(track.uri);
    const patched = await applyTagPatchToBytes(source, metadata);
    if (!patched.ok) {
      return patched;
    }

    // Prefer in-place write so the MediaStore id stays stable.
    try {
      const file = new File(track.uri);
      await file.write(patched.bytes);
      return {
        ok: true,
        track: {
          id: track.id,
          uri: track.uri,
          filename: track.filename,
          title: metadata.title,
          artist: metadata.artist,
          album: metadata.album,
          albumArtist: metadata.albumArtist,
          trackNumber: metadata.trackNumber,
          year: metadata.year,
          genre: metadata.genre,
          durationMs: track.durationMs,
          artworkPath: track.artworkPath,
          folderPath: track.folderPath,
          dateAdded: track.dateAdded,
          sourceModifiedAt: Date.now(),
        },
      };
    } catch {
      // content:// or permission — recreate via MediaLibrary.
    }

    const staging = await writeStagingFile(track.filename, patched.bytes);
    const created = await createAssetFromStaging(staging);
    const uri = await created.getUri();
    const filename = await created.getFilename();

    try {
      await new Asset(track.id).delete();
    } catch {
      // User may have denied delete of the old copy; keep going with the new asset.
    }

    try {
      if (staging.exists) {
        staging.delete();
      }
    } catch {
      // Cache cleanup is best-effort.
    }

    return {
      ok: true,
      track: toUpsertFromAsset(track, created, filename, uri, metadata),
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Could not write tags to the audio file.';
    return { ok: false, message };
  }
}

/**
 * Rename the on-disk filename only (does not change title/artist tags).
 * Uses MediaStore create + delete so Android can show the required approval UI.
 */
export async function renameTrackFileOnDevice(
  track: CachedTrackRow,
  nextFilenameRaw: string,
): Promise<FileOpResult> {
  const nextFilename = normalizeFilenameInput(nextFilenameRaw, track.filename);
  if (nextFilename === track.filename) {
    return {
      ok: true,
      track: {
        id: track.id,
        uri: track.uri,
        filename: track.filename,
        title: track.title,
        artist: track.artist,
        album: track.album,
        albumArtist: track.albumArtist,
        trackNumber: track.trackNumber,
        year: track.year,
        genre: track.genre,
        durationMs: track.durationMs,
        artworkPath: track.artworkPath,
        folderPath: track.folderPath,
        dateAdded: track.dateAdded,
        sourceModifiedAt: track.sourceModifiedAt,
      },
    };
  }

  try {
    // Try a simple File.rename when the URI is a real filesystem path.
    try {
      const file = new File(track.uri);
      if (file.exists) {
        file.rename(nextFilename);
        const renamedUri = file.uri;
        return {
          ok: true,
          track: {
            id: track.id,
            uri: renamedUri,
            filename: nextFilename,
            title: track.title,
            artist: track.artist,
            album: track.album,
            albumArtist: track.albumArtist,
            trackNumber: track.trackNumber,
            year: track.year,
            genre: track.genre,
            durationMs: track.durationMs,
            artworkPath: track.artworkPath,
            folderPath: track.folderPath,
            dateAdded: track.dateAdded,
            sourceModifiedAt: Date.now(),
          },
        };
      }
    } catch {
      // Fall through to MediaStore recreate.
    }

    const source = await readTrackBytes(track.uri);
    const staging = await writeStagingFile(nextFilename, source);
    const created = await createAssetFromStaging(staging);
    const uri = await created.getUri();
    const filename = await created.getFilename();

    try {
      await new Asset(track.id).delete();
    } catch {
      // Old file may remain if the user denies delete.
    }

    try {
      if (staging.exists) {
        staging.delete();
      }
    } catch {
      // ignore
    }

    return {
      ok: true,
      track: toUpsertFromAsset(track, created, filename || nextFilename, uri, {
        title: track.title,
        artist: track.artist,
        album: track.album,
        albumArtist: track.albumArtist,
        trackNumber: track.trackNumber,
        year: track.year,
        genre: track.genre,
      }),
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Could not rename the audio file on this device.';
    return { ok: false, message };
  }
}

/** Delete the device audio file after the user confirms in-app (Android shows system approval). */
export async function deleteTrackFileOnDevice(
  trackId: string,
): Promise<FileOpResult | { ok: true }> {
  try {
    await new Asset(trackId).delete();
    return { ok: true };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Could not delete the file. Android may have denied the request.';
    return { ok: false, message };
  }
}
