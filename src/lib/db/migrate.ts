import { DATABASE_VERSION, SCHEMA_SQL } from '@/lib/db/schema';

import type { SQLiteDatabase } from 'expo-sqlite';

export async function migrateDatabase(db: SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = row?.user_version ?? 0;

  if (currentVersion >= DATABASE_VERSION) {
    return;
  }

  await db.execAsync(SCHEMA_SQL);
  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
