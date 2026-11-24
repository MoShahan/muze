/** Case-insensitive substring match for in-screen library search. */
export function matchesLibraryQuery(haystack: string, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }
  return haystack.toLowerCase().includes(normalizedQuery);
}

export function formatDurationMs(durationMs: number): string {
  const totalSeconds = Math.max(0, Math.round(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/** Plural-aware count label, e.g. `1 track` / `12 albums`. */
export function formatCountLabel(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
