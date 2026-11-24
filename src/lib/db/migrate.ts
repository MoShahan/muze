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

/** Indexes for large-library Songs / folder / album / artist queries. */
async function migrateToV3(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_tracks_folder_path ON tracks(folder_path);
    CREATE INDEX IF NOT EXISTS idx_tracks_artist ON tracks(artist);
    CREATE INDEX IF NOT EXISTS idx_tracks_album_artist ON tracks(album, artist);
    CREATE INDEX IF NOT EXISTS idx_tracks_title ON tracks(title COLLATE NOCASE);
    CREATE INDEX IF NOT EXISTS idx_recents_played_at ON recents(played_at DESC);
  `);
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
    if (currentVersion < 3) {
      await migrateToV3(db);
    }
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
