import { updateBuffer, type TagPatch } from 'music-metadata';

import type { TrackMetadataUpdate } from '@/lib/db/tracks';

export type WriteTagsResult = { ok: true; bytes: Uint8Array } | { ok: false; message: string };

/** Build a music-metadata patch from editor fields (does not touch filename). */
export function metadataToTagPatch(metadata: TrackMetadataUpdate): TagPatch {
  const patch: TagPatch = {
    title: metadata.title,
    artist: metadata.artist,
    album: metadata.album,
    albumartist: metadata.albumArtist,
    genre: metadata.genre,
  };

  if (metadata.trackNumber != null && Number.isFinite(metadata.trackNumber)) {
    patch.track = { no: metadata.trackNumber, of: null };
  } else {
    patch.track = null;
  }

  if (metadata.year != null && Number.isFinite(metadata.year)) {
    patch.year = metadata.year;
  } else {
    patch.year = null;
  }

  return patch;
}

/** Rewrite tags in-memory without re-encoding audio. */
export async function applyTagPatchToBytes(
  source: Uint8Array,
  metadata: TrackMetadataUpdate,
): Promise<WriteTagsResult> {
  try {
    const bytes = await updateBuffer(source, metadataToTagPatch(metadata));
    return { ok: true, bytes };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'This audio format does not support tag edits.';
    return { ok: false, message };
  }
}
