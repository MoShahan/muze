import { rebuildLibraryGroups } from '@/lib/db/library';
import {
  deleteTrackRow,
  replaceTrackIdentity,
  type CachedTrackRow,
  type TrackMetadataUpdate,
} from '@/lib/db/tracks';
import {
  deleteTrackFileOnDevice,
  renameTrackFileOnDevice,
  writeTrackTagsOnDevice,
} from '@/lib/media/track-file-ops';
import { deleteCachedAlbumArt } from '@/lib/metadata/artwork-cache';

import type { SQLiteDatabase } from 'expo-sqlite';

export type TrackEditSaveInput = {
  track: CachedTrackRow;
  metadata: TrackMetadataUpdate;
  filename: string;
  metadataChanged: boolean;
  filenameChanged: boolean;
};

export type TrackEditSaveReport = {
  metadata: { attempted: boolean; ok: boolean; message?: string };
  filename: { attempted: boolean; ok: boolean; message?: string };
  /** Final track id after possible MediaStore recreate. */
  trackId: string;
};

/**
 * Apply editor changes as two independent operations (tags vs rename).
 * Updates SQLite only after each device write succeeds.
 */
export async function saveTrackEdits(
  db: SQLiteDatabase,
  input: TrackEditSaveInput,
): Promise<TrackEditSaveReport> {
  let current = input.track;
  const report: TrackEditSaveReport = {
    metadata: { attempted: false, ok: true },
    filename: { attempted: false, ok: true },
    trackId: current.id,
  };

  if (input.metadataChanged) {
    report.metadata.attempted = true;
    const result = await writeTrackTagsOnDevice(current, input.metadata);
    if (!result.ok) {
      report.metadata = { attempted: true, ok: false, message: result.message };
    } else {
      await replaceTrackIdentity(db, current.id, result.track);
      current = {
        ...current,
        id: result.track.id,
        uri: result.track.uri,
        filename: result.track.filename,
        title: result.track.title,
        artist: result.track.artist,
        album: result.track.album,
        albumArtist: result.track.albumArtist,
        trackNumber: result.track.trackNumber,
        year: result.track.year,
        genre: result.track.genre,
        sourceModifiedAt: result.track.sourceModifiedAt,
        updatedAt: Date.now(),
      };
      report.trackId = current.id;
      report.metadata = { attempted: true, ok: true };
      await rebuildLibraryGroups(db);
    }
  }

  if (input.filenameChanged) {
    report.filename.attempted = true;
    const result = await renameTrackFileOnDevice(current, input.filename);
    if (!result.ok) {
      report.filename = { attempted: true, ok: false, message: result.message };
    } else {
      await replaceTrackIdentity(db, current.id, result.track);
      report.trackId = result.track.id;
      report.filename = { attempted: true, ok: true };
      await rebuildLibraryGroups(db);
    }
  }

  return report;
}

/** Confirm-friendly delete: device file first, then SQLite + artwork cache. */
export async function deleteTrackEverywhere(
  db: SQLiteDatabase,
  track: CachedTrackRow,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const fileResult = await deleteTrackFileOnDevice(track.id);
  if (!fileResult.ok) {
    return fileResult;
  }

  deleteCachedAlbumArt(track.artworkPath);
  await deleteTrackRow(db, track.id);
  await rebuildLibraryGroups(db);
  return { ok: true };
}
