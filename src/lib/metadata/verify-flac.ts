import { AssetField, MediaType, Query } from 'expo-media-library';

import {
  hasVorbisTags,
  isFlacFilename,
  parseTrackTagsDetailed,
  UNKNOWN_ALBUM,
  UNKNOWN_ARTIST,
} from '@/lib/metadata/parse-tags';

export type FlacVerifySample = {
  filename: string;
  title: string;
  artist: string;
  album: string;
  tagTypes: string[];
  hasVorbis: boolean;
  hasEmbeddedArt: boolean;
  artFormat: string | null;
  artByteLength: number | null;
};

export type FlacVerifyReport = {
  examined: number;
  vorbisTagsOk: number;
  embeddedArtFound: number;
  parseFallbackOnly: number;
  samples: FlacVerifySample[];
};

export type VerifyFlacOptions = {
  /** Max FLAC files to examine from the device library. Default 40. */
  maxFiles?: number;
  signal?: AbortSignal;
  onProgress?: (examined: number) => void;
};

const DEFAULT_MAX_FILES = 40;
const QUERY_PAGE = 50;
const SAMPLE_LIMIT = 5;

function assertNotAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw new DOMException('FLAC verify aborted', 'AbortError');
  }
}

/**
 * Probe a representative set of device FLAC files for Vorbis comments and embedded art.
 * Use from Settings on a real library; does not cache artwork (that is a later TODO).
 */
export async function verifyFlacTagAndArtParsing(
  options: VerifyFlacOptions = {},
): Promise<FlacVerifyReport> {
  const maxFiles = options.maxFiles ?? DEFAULT_MAX_FILES;
  let offset = 0;
  let examined = 0;
  let vorbisTagsOk = 0;
  let embeddedArtFound = 0;
  let parseFallbackOnly = 0;
  const samples: FlacVerifySample[] = [];

  while (examined < maxFiles) {
    assertNotAborted(options.signal);

    const assets = await new Query()
      .eq(AssetField.MEDIA_TYPE, MediaType.AUDIO)
      .orderBy({ key: AssetField.CREATION_TIME, ascending: false })
      .limit(QUERY_PAGE)
      .offset(offset)
      .exe();

    if (assets.length === 0) {
      break;
    }

    for (const asset of assets) {
      assertNotAborted(options.signal);
      if (examined >= maxFiles) {
        break;
      }

      const info = await asset.getInfo();
      if (!isFlacFilename(info.filename)) {
        continue;
      }

      const detailed = await parseTrackTagsDetailed(info.uri, info.filename, {
        includeArt: true,
      });

      const hasVorbis = hasVorbisTags(detailed.tagTypes);
      const looksLikeFallbackOnly =
        !hasVorbis && detailed.artist === UNKNOWN_ARTIST && detailed.album === UNKNOWN_ALBUM;

      examined += 1;
      if (hasVorbis) {
        vorbisTagsOk += 1;
      }
      if (detailed.hasEmbeddedArt) {
        embeddedArtFound += 1;
      }
      if (looksLikeFallbackOnly) {
        parseFallbackOnly += 1;
      }

      if (samples.length < SAMPLE_LIMIT) {
        samples.push({
          filename: info.filename,
          title: detailed.title,
          artist: detailed.artist,
          album: detailed.album,
          tagTypes: detailed.tagTypes,
          hasVorbis,
          hasEmbeddedArt: detailed.hasEmbeddedArt,
          artFormat: detailed.art?.format ?? null,
          artByteLength: detailed.art?.data.byteLength ?? null,
        });
      }

      options.onProgress?.(examined);
    }

    if (assets.length < QUERY_PAGE) {
      break;
    }
    offset += QUERY_PAGE;
  }

  return {
    examined,
    vorbisTagsOk,
    embeddedArtFound,
    parseFallbackOnly,
    samples,
  };
}
