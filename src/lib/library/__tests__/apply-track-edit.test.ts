import { deleteTrackEverywhere, saveTrackEdits } from '@/lib/library/apply-track-edit';
import { makeTrack } from '@/test/fixtures';

const mockWriteTrackTagsOnDevice = jest.fn();
const mockRenameTrackFileOnDevice = jest.fn();
const mockDeleteTrackFileOnDevice = jest.fn();
const mockReplaceTrackIdentity = jest.fn();
const mockDeleteTrackRow = jest.fn();
const mockRebuildLibraryGroups = jest.fn();
const mockDeleteCachedAlbumArt = jest.fn();

jest.mock('@/lib/media/track-file-ops', () => ({
  writeTrackTagsOnDevice: (...args: unknown[]) => mockWriteTrackTagsOnDevice(...args),
  renameTrackFileOnDevice: (...args: unknown[]) => mockRenameTrackFileOnDevice(...args),
  deleteTrackFileOnDevice: (...args: unknown[]) => mockDeleteTrackFileOnDevice(...args),
}));

jest.mock('@/lib/db/tracks', () => ({
  replaceTrackIdentity: (...args: unknown[]) => mockReplaceTrackIdentity(...args),
  deleteTrackRow: (...args: unknown[]) => mockDeleteTrackRow(...args),
}));

jest.mock('@/lib/db/library', () => ({
  rebuildLibraryGroups: (...args: unknown[]) => mockRebuildLibraryGroups(...args),
}));

jest.mock('@/lib/metadata/artwork-cache', () => ({
  deleteCachedAlbumArt: (...args: unknown[]) => mockDeleteCachedAlbumArt(...args),
}));

const db = {} as never;

const metadata = {
  title: 'Edited',
  artist: 'Artist',
  album: 'Album',
  albumArtist: null,
  trackNumber: 1,
  year: 2020,
  genre: 'Rock',
};

describe('saveTrackEdits', () => {
  beforeEach(() => {
    mockWriteTrackTagsOnDevice.mockReset();
    mockRenameTrackFileOnDevice.mockReset();
    mockReplaceTrackIdentity.mockReset();
    mockRebuildLibraryGroups.mockReset();
  });

  it('updates SQLite after a successful tag write', async () => {
    const track = makeTrack({ id: 'old' });
    const next = {
      ...track,
      id: 'new',
      uri: 'file:///music/new.flac',
      title: 'Edited',
    };
    mockWriteTrackTagsOnDevice.mockResolvedValue({ ok: true, track: next });

    const report = await saveTrackEdits(db, {
      track,
      metadata,
      filename: track.filename,
      metadataChanged: true,
      filenameChanged: false,
    });

    expect(report.metadata).toEqual({ attempted: true, ok: true });
    expect(report.trackId).toBe('new');
    expect(mockReplaceTrackIdentity).toHaveBeenCalledWith(db, 'old', next);
    expect(mockRebuildLibraryGroups).toHaveBeenCalledWith(db);
  });

  it('does not touch SQLite when tag write fails', async () => {
    mockWriteTrackTagsOnDevice.mockResolvedValue({ ok: false, message: 'denied' });

    const report = await saveTrackEdits(db, {
      track: makeTrack(),
      metadata,
      filename: 'song.flac',
      metadataChanged: true,
      filenameChanged: false,
    });

    expect(report.metadata).toEqual({ attempted: true, ok: false, message: 'denied' });
    expect(mockReplaceTrackIdentity).not.toHaveBeenCalled();
    expect(mockRebuildLibraryGroups).not.toHaveBeenCalled();
  });

  it('reports rename failure independently of a successful tag write', async () => {
    const track = makeTrack({ id: '1' });
    mockWriteTrackTagsOnDevice.mockResolvedValue({ ok: true, track });
    mockRenameTrackFileOnDevice.mockResolvedValue({ ok: false, message: 'rename denied' });

    const report = await saveTrackEdits(db, {
      track,
      metadata,
      filename: 'renamed.flac',
      metadataChanged: true,
      filenameChanged: true,
    });

    expect(report.metadata.ok).toBe(true);
    expect(report.filename).toEqual({
      attempted: true,
      ok: false,
      message: 'rename denied',
    });
  });

  it('updates identity after a successful rename', async () => {
    const track = makeTrack({ id: 'old' });
    const renamed = { ...track, id: 'renamed', filename: 'renamed.flac' };
    mockRenameTrackFileOnDevice.mockResolvedValue({ ok: true, track: renamed });

    const report = await saveTrackEdits(db, {
      track,
      metadata,
      filename: 'renamed.flac',
      metadataChanged: false,
      filenameChanged: true,
    });

    expect(report.filename).toEqual({ attempted: true, ok: true });
    expect(report.trackId).toBe('renamed');
    expect(mockReplaceTrackIdentity).toHaveBeenCalledWith(db, 'old', renamed);
  });
});

describe('deleteTrackEverywhere', () => {
  beforeEach(() => {
    mockDeleteTrackFileOnDevice.mockReset();
    mockDeleteTrackRow.mockReset();
    mockRebuildLibraryGroups.mockReset();
    mockDeleteCachedAlbumArt.mockReset();
  });

  it('stops before SQLite when device delete fails', async () => {
    mockDeleteTrackFileOnDevice.mockResolvedValue({ ok: false, message: 'not allowed' });

    const result = await deleteTrackEverywhere(db, makeTrack({ artworkPath: '/art.jpg' }));

    expect(result).toEqual({ ok: false, message: 'not allowed' });
    expect(mockDeleteTrackRow).not.toHaveBeenCalled();
    expect(mockDeleteCachedAlbumArt).not.toHaveBeenCalled();
  });

  it('deletes SQLite row and artwork after a successful device delete', async () => {
    mockDeleteTrackFileOnDevice.mockResolvedValue({ ok: true });
    const track = makeTrack({ id: '1', artworkPath: '/art.jpg' });

    const result = await deleteTrackEverywhere(db, track);

    expect(result).toEqual({ ok: true });
    expect(mockDeleteCachedAlbumArt).toHaveBeenCalledWith('/art.jpg');
    expect(mockDeleteTrackRow).toHaveBeenCalledWith(db, '1');
    expect(mockRebuildLibraryGroups).toHaveBeenCalledWith(db);
  });
});
