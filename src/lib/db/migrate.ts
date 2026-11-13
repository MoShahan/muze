import { DATABASE_VERSION, SCHEMA_SQL } from '@/lib/db/schema';

import type { SQLiteDatabase } from 'expo-sqlite';

async function migrateToV2(db: SQLiteDatabase): Promise<void> {
  // Fresh installs already include the column via SCHEMA_SQL; ADD COLUMN is for v1 DBs.
  const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(tracks)');
  const hasSourceModified = columns.some((column) => column.name === 'source_modified_at');
  if (!hasSourceModified) {
    await db.execAsync('ALTER TABLE tracks ADD COLUMN source_modified_at INTEGER');
  }
}

export async function migrateDatabase(db: SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = row?.user_version ?? 0;

  if (currentVersion >= DATABASE_VERSION) {
    return;
  }

  if (currentVersion === 0) {
    await db.execAsync(SCHEMA_SQL);
  } else {
    // Ensure base tables exist (idempotent) before column migrations.
    await db.execAsync(SCHEMA_SQL);
    if (currentVersion < 2) {
      await migrateToV2(db);
    }
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
