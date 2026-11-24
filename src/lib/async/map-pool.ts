/**
 * Run an async mapper over items with a fixed worker pool.
 * Used by MediaStore scan (`getInfo`) and tag parse to avoid unbounded fan-out.
 */
export async function mapPool<T, R>(
  items: readonly T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
  options?: { signal?: AbortSignal },
): Promise<R[]> {
  if (items.length === 0) {
    return [];
  }

  const limit = Math.max(1, Math.min(concurrency, items.length));
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (true) {
      if (options?.signal?.aborted) {
        throw new DOMException('mapPool aborted', 'AbortError');
      }
      const index = nextIndex;
      nextIndex += 1;
      if (index >= items.length) {
        return;
      }
      results[index] = await mapper(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: limit }, () => worker()));
  return results;
}
