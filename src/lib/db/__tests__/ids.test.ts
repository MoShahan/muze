import { albumArtistLabel, albumIdFor, artistIdFor, folderIdFor } from '@/lib/db/ids';

describe('ids', () => {
  it('builds stable album ids from normalized title + artist', () => {
    expect(albumIdFor('  Dark Side  ', 'Pink Floyd')).toBe(albumIdFor('dark side', 'pink floyd'));
  });

  it('builds stable artist and folder ids', () => {
    expect(artistIdFor('  Radiohead ')).toBe('artist:radiohead');
    expect(folderIdFor('Music/Albums/OK Computer')).toBe('folder:music/albums/ok computer');
  });

  it('prefers album artist when present', () => {
    expect(albumArtistLabel('Various Artists', 'Guest')).toBe('Various Artists');
    expect(albumArtistLabel(null, 'Guest')).toBe('Guest');
    expect(albumArtistLabel('  ', 'Guest')).toBe('Guest');
  });
});
