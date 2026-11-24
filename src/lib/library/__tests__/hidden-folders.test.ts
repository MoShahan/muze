import {
  albumsFromTracks,
  artistsFromTracks,
  filterTracksExcludingFolders,
} from '@/lib/library/hidden-folders';
import { makeTrack } from '@/test/fixtures';

describe('filterTracksExcludingFolders', () => {
  it('returns all tracks when nothing is hidden', () => {
    const tracks = [makeTrack({ id: '1' }), makeTrack({ id: '2' })];
    expect(filterTracksExcludingFolders(tracks, new Set())).toEqual(tracks);
  });

  it('drops tracks in hidden folders and keeps null/empty folder paths', () => {
    const tracks = [
      makeTrack({ id: '1', folderPath: 'Music/Keep' }),
      makeTrack({ id: '2', folderPath: 'Music/Hide' }),
      makeTrack({ id: '3', folderPath: null }),
      makeTrack({ id: '4', folderPath: '' }),
    ];
    const visible = filterTracksExcludingFolders(tracks, new Set(['Music/Hide']));
    expect(visible.map((track) => track.id)).toEqual(['1', '3', '4']);
  });
});

describe('albumsFromTracks / artistsFromTracks', () => {
  const tracks = [
    makeTrack({
      id: '1',
      title: 'A',
      artist: 'Beta',
      album: 'Zebra',
      albumArtist: null,
      artworkPath: '/art/a.jpg',
    }),
    makeTrack({
      id: '2',
      title: 'B',
      artist: 'Beta',
      album: 'Zebra',
      albumArtist: null,
      artworkPath: '',
    }),
    makeTrack({
      id: '3',
      title: 'C',
      artist: 'Alpha',
      album: 'Apple',
      albumArtist: 'Alpha',
      artworkPath: null,
    }),
  ];

  it('groups albums with counts, preferred artwork, and title sort', () => {
    const albums = albumsFromTracks(tracks);
    expect(albums).toHaveLength(2);
    expect(albums[0]?.title).toBe('Apple');
    expect(albums[1]?.title).toBe('Zebra');
    expect(albums[1]?.trackCount).toBe(2);
    expect(albums[1]?.artworkPath).toBe('/art/a.jpg');
  });

  it('groups artists with track and album counts, sorted by name', () => {
    const artists = artistsFromTracks(tracks);
    expect(artists.map((artist) => artist.name)).toEqual(['Alpha', 'Beta']);
    expect(artists[1]?.trackCount).toBe(2);
    expect(artists[1]?.albumCount).toBe(1);
  });
});
