/** Stable browse ids derived from tag fields (not MediaStore folder albums). */

function normalizeKeyPart(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Album key: title + album artist (falls back to track artist). */
export function albumIdFor(title: string, albumArtistOrArtist: string): string {
  return `album:${normalizeKeyPart(albumArtistOrArtist)}|${normalizeKeyPart(title)}`;
}

export function artistIdFor(name: string): string {
  return `artist:${normalizeKeyPart(name)}`;
}

/** Prefer album artist when present; otherwise the track artist. */
export function albumArtistLabel(albumArtist: string | null | undefined, artist: string): string {
  const trimmed = albumArtist?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : artist;
}
