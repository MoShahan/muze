import {
  addTracksToPlaylist,
  createPlaylist,
  deletePlaylist,
  listPlaylists,
  listPlaylistTracks,
  removeTrackFromPlaylist,
  renamePlaylist,
} from '@/lib/db/playlists';
import { insertTestTrack, openTestDatabase } from '@/test/open-test-db';

import type { SQLiteDatabase } from 'expo-sqlite';

describe('playlists', () => {
  let db: SQLiteDatabase;

  beforeEach(async () => {
    db = await openTestDatabase();
    await insertTestTrack(db, { id: 't1', title: 'One' });
    await insertTestTrack(db, { id: 't2', title: 'Two' });
    await insertTestTrack(db, { id: 't3', title: 'Three' });
  });

  afterEach(async () => {
    await db.closeAsync();
  });

  it('rejects empty playlist names', async () => {
    await expect(createPlaylist(db, '   ')).rejects.toThrow('Playlist name is required');
  });

  it('creates, renames, and lists playlists', async () => {
    const playlist = await createPlaylist(db, ' Focus ');
    expect(playlist.name).toBe('Focus');
    expect(playlist.trackCount).toBe(0);

    await renamePlaylist(db, playlist.id, 'Deep Focus');
    const listed = await listPlaylists(db);
    expect(listed).toHaveLength(1);
    expect(listed[0]?.name).toBe('Deep Focus');
  });

  it('adds tracks with dedupe and preserves order', async () => {
    const playlist = await createPlaylist(db, 'Mix');
    expect(await addTracksToPlaylist(db, playlist.id, ['t1', 't2'])).toBe(2);
    expect(await addTracksToPlaylist(db, playlist.id, ['t2', 't3'])).toBe(1);

    const tracks = await listPlaylistTracks(db, playlist.id);
    expect(tracks.map((track) => track.id)).toEqual(['t1', 't2', 't3']);
  });

  it('removes tracks and deletes the playlist (cascade)', async () => {
    const playlist = await createPlaylist(db, 'Temp');
    await addTracksToPlaylist(db, playlist.id, ['t1', 't2']);
    await removeTrackFromPlaylist(db, playlist.id, 't1');
    expect((await listPlaylistTracks(db, playlist.id)).map((track) => track.id)).toEqual(['t2']);

    await deletePlaylist(db, playlist.id);
    expect(await listPlaylists(db)).toEqual([]);
    const orphanLinks = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) AS count FROM playlist_tracks',
    );
    expect(orphanLinks?.count).toBe(0);
  });
});
