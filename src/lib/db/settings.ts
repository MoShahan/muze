import type { ThemePreference } from '@/constants/theme';
import type { SQLiteDatabase } from 'expo-sqlite';

export const SETTINGS_KEYS = {
  themePreference: 'theme_preference',
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
