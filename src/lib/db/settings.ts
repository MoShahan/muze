import { DEFAULT_TRACK_SORT, isTrackSortKey, type TrackSortKey } from '@/lib/library/sort-tracks';

import type { ThemePreference } from '@/constants/theme';
import type { SQLiteDatabase } from 'expo-sqlite';

export const DEFAULT_DISPLAY_NAME = 'Melophile';

export const SETTINGS_KEYS = {
  themePreference: 'theme_preference',
  displayName: 'display_name',
  trackSort: 'track_sort',
} as const;

const THEME_PREFERENCES = new Set<ThemePreference>(['system', 'light', 'dark']);

export async function getSetting(db: SQLiteDatabase, key: string): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    [key],
  );
  return row?.value ?? null;
}

export async function setSetting(db: SQLiteDatabase, key: string, value: string): Promise<void> {
  await db.runAsync(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, value],
  );
}

export async function getThemePreference(db: SQLiteDatabase): Promise<ThemePreference> {
  const value = await getSetting(db, SETTINGS_KEYS.themePreference);
  if (value && THEME_PREFERENCES.has(value as ThemePreference)) {
    return value as ThemePreference;
  }
  return 'system';
}

export async function setThemePreference(
  db: SQLiteDatabase,
  preference: ThemePreference,
): Promise<void> {
  await setSetting(db, SETTINGS_KEYS.themePreference, preference);
}

export async function getDisplayName(db: SQLiteDatabase): Promise<string> {
  const value = await getSetting(db, SETTINGS_KEYS.displayName);
  const trimmed = value?.trim() ?? '';
  return trimmed.length > 0 ? trimmed : DEFAULT_DISPLAY_NAME;
}

export async function setDisplayName(db: SQLiteDatabase, name: string): Promise<void> {
  await setSetting(db, SETTINGS_KEYS.displayName, name.trim());
}

export async function getTrackSort(db: SQLiteDatabase): Promise<TrackSortKey> {
  const value = await getSetting(db, SETTINGS_KEYS.trackSort);
  return isTrackSortKey(value) ? value : DEFAULT_TRACK_SORT;
}

export async function setTrackSort(db: SQLiteDatabase, sortKey: TrackSortKey): Promise<void> {
  await setSetting(db, SETTINGS_KEYS.trackSort, sortKey);
}
