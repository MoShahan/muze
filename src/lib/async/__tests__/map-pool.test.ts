import { mapPool } from '@/lib/async/map-pool';

describe('mapPool', () => {
  it('returns an empty array for empty input', async () => {
    await expect(mapPool([], 4, async (item) => item)).resolves.toEqual([]);
  });

  it('preserves order with limited concurrency', async () => {
    let active = 0;
    let maxActive = 0;

    const result = await mapPool([1, 2, 3, 4, 5], 2, async (item) => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active -= 1;
      return item * 10;
    });

    expect(result).toEqual([10, 20, 30, 40, 50]);
    expect(maxActive).toBeLessThanOrEqual(2);
  });

  it('aborts when the signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(
      mapPool([1, 2], 2, async (item) => item, { signal: controller.signal }),
    ).rejects.toMatchObject({ name: 'AbortError' });
  });
});
