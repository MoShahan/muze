import { applyTagPatchToBytes } from '@/lib/metadata/write-tags';

const mockUpdateBuffer = jest.fn();

jest.mock('music-metadata', () => ({
  updateBuffer: (...args: unknown[]) => mockUpdateBuffer(...args),
}));

const metadata = {
  title: 'New Title',
  artist: 'New Artist',
  album: 'New Album',
  albumArtist: 'New Album Artist',
  trackNumber: 2,
  year: 2024,
  genre: 'Jazz',
};

describe('applyTagPatchToBytes', () => {
  beforeEach(() => {
    mockUpdateBuffer.mockReset();
  });

  it('returns rewritten bytes on success', async () => {
    const rewritten = new Uint8Array([1, 2, 3]);
    mockUpdateBuffer.mockResolvedValue(rewritten);

    const result = await applyTagPatchToBytes(new Uint8Array([9]), metadata);

    expect(result).toEqual({ ok: true, bytes: rewritten });
    expect(mockUpdateBuffer).toHaveBeenCalledWith(
      expect.any(Uint8Array),
      expect.objectContaining({
        title: 'New Title',
        artist: 'New Artist',
        album: 'New Album',
        albumartist: 'New Album Artist',
        genre: 'Jazz',
        year: 2024,
        track: { no: 2, of: null },
      }),
    );
  });

  it('returns ok:false for unsupported formats', async () => {
    mockUpdateBuffer.mockRejectedValue(new Error('Unsupported format'));

    const result = await applyTagPatchToBytes(new Uint8Array([9]), metadata);

    expect(result).toEqual({ ok: false, message: 'Unsupported format' });
  });

  it('uses a default message when the error is not an Error', async () => {
    mockUpdateBuffer.mockRejectedValue('boom');

    const result = await applyTagPatchToBytes(new Uint8Array([9]), metadata);

    expect(result).toEqual({
      ok: false,
      message: 'This audio format does not support tag edits.',
    });
  });
});
