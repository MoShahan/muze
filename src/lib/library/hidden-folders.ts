/**
 * Folder-visibility filters for Songs / Albums / Artists.
 * Hidden paths live in settings; folder browse itself still lists every folder
 * so the user can unhide them. Albums/artists are rebuilt from the visible subset.
 */
import { albumArtistLabel, albumIdFor, artistIdFor } from '@/lib/db/ids';

import type { AlbumRow } from '@/lib/db/albums';
import type { ArtistRow } from '@/lib/db/artists';
import type { CachedTrackRow } from '@/lib/db/tracks';

/** Drop tracks whose folder path is in the hidden set. Null/empty folder paths stay visible. */
export function filterTracksExcludingFolders(
  tracks: CachedTrackRow[],
  hiddenFolderPaths: ReadonlySet<string>,
): CachedTrackRow[] {
  if (hiddenFolderPaths.size === 0) {
    return tracks;
  }
  return tracks.filter((track) => {
    const path = track.folderPath?.trim();
    if (!path) {
      return true;
    }
    return !hiddenFolderPaths.has(path);
  });
}

/** Build album rows from a visible track subset (counts match what Songs shows). */
export function albumsFromTracks(tracks: CachedTrackRow[]): AlbumRow[] {
  type Agg = {
    id: string;
    title: string;
    artist: string;
    artworkPath: string | null;
    trackCount: number;
  };
  const albums = new Map<string, Agg>();

  for (const track of tracks) {
    const artist = albumArtistLabel(track.albumArtist, track.artist);
    const id = albumIdFor(track.album, artist);
    const existing = albums.get(id);
    if (existing) {
      existing.trackCount += 1;
      if (!existing.artworkPath && track.artworkPath && track.artworkPath.length > 0) {
        existing.artworkPath = track.artworkPath;
      }
    } else {
      albums.set(id, {
        id,
        title: track.album,
        artist,
        artworkPath: track.artworkPath,
        trackCount: 1,
      });
    }
  }

  return [...albums.values()].sort((a, b) => {
    const titleCmp = a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
    if (titleCmp !== 0) {
      return titleCmp;
    }
    return a.artist.localeCompare(b.artist, undefined, { sensitivity: 'base' });
  });
}

/** Build artist rows from a visible track subset. */
export function artistsFromTracks(tracks: CachedTrackRow[]): ArtistRow[] {
  type Agg = {
    id: string;
    name: string;
    trackCount: number;
    albumKeys: Set<string>;
  };
  const artists = new Map<string, Agg>();

  for (const track of tracks) {
    const albumArtist = albumArtistLabel(track.albumArtist, track.artist);
    const albumId = albumIdFor(track.album, albumArtist);
    const id = artistIdFor(track.artist);
    const existing = artists.get(id);
    if (existing) {
      existing.trackCount += 1;
      existing.albumKeys.add(albumId);
    } else {
      artists.set(id, {
        id,
        name: track.artist,
        trackCount: 1,
        albumKeys: new Set([albumId]),
      });
    }
  }

  return [...artists.values()]
    .map((artist) => ({
      id: artist.id,
      name: artist.name,
      trackCount: artist.trackCount,
      albumCount: artist.albumKeys.size,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
}
