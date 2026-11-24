/** Letters shown on the library A-Z jump rail (# for non-letters). */
export const ALPHABET_INDEX_LETTERS: readonly string[] = [
  '#',
  ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
];

const LETTER_SET = new Set(ALPHABET_INDEX_LETTERS);

/**
 * First character bucket for a label: A-Z if alphabetic, otherwise #.
 * Empty / whitespace-only labels map to #.
 */
export function getAlphabetLetter(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return '#';
  }
  const first = trimmed[0]!.toUpperCase();
  if (first >= 'A' && first <= 'Z') {
    return first;
  }
  return '#';
}

/**
 * Map each alphabet letter to the first list index whose label falls in that bucket.
 * Assumes `items` are already sorted by the same label used for bucketing.
 */
export function buildAlphabetIndexMap<T>(
  items: readonly T[],
  getLabel: (item: T) => string,
): Map<string, number> {
  const map = new Map<string, number>();
  for (let index = 0; index < items.length; index += 1) {
    const letter = getAlphabetLetter(getLabel(items[index]!));
    if (!LETTER_SET.has(letter)) {
      continue;
    }
    if (!map.has(letter)) {
      map.set(letter, index);
    }
  }
  return map;
}

/**
 * Resolve a selected letter to a scroll target index.
 * Empty letters jump forward to the next letter that has items (Contacts-style).
 * Returns null when the list has no alphabet targets at all.
 */
export function resolveAlphabetScrollIndex(
  letter: string,
  indexMap: ReadonlyMap<string, number>,
): number | null {
  const direct = indexMap.get(letter);
  if (direct != null) {
    return direct;
  }

  const start = ALPHABET_INDEX_LETTERS.indexOf(letter);
  if (start < 0) {
    return null;
  }

  for (let i = start + 1; i < ALPHABET_INDEX_LETTERS.length; i += 1) {
    const next = indexMap.get(ALPHABET_INDEX_LETTERS[i]!);
    if (next != null) {
      return next;
    }
  }

  // No later letter - fall back to the last letter that has items.
  for (let i = start - 1; i >= 0; i -= 1) {
    const prev = indexMap.get(ALPHABET_INDEX_LETTERS[i]!);
    if (prev != null) {
      return prev;
    }
  }

  return null;
}
