import Database from 'better-sqlite3';

import { DATABASE_VERSION, SCHEMA_SQL } from '@/lib/db/schema';

import type { SQLiteBindValue, SQLiteDatabase, SQLiteRunResult } from 'expo-sqlite';

type BetterDb = Database.Database;

/**
 * Minimal expo-sqlite-compatible wrapper over better-sqlite3 for Jest.
 * Avoids expo-sqlite native / DevTools paths that break under Node.
 */
function wrapBetterSqlite(sqlite: BetterDb): SQLiteDatabase {
  const db = {
    execAsync: async (source: string) => {
      sqlite.exec(source);
    },
    runAsync: async (source: string, ...params: SQLiteBindValue[]) => {
      const result = sqlite.prepare(source).run(...flattenParams(params));
      return {
        lastInsertRowId: Number(result.lastInsertRowid),
        changes: result.changes,
      } satisfies SQLiteRunResult;
    },
    getFirstAsync: async <T>(source: string, ...params: SQLiteBindValue[]) => {
      const row = sqlite.prepare(source).get(...flattenParams(params));
      return (row as T | undefined) ?? null;
    },
    getAllAsync: async <T>(source: string, ...params: SQLiteBindValue[]) => {
      return sqlite.prepare(source).all(...flattenParams(params)) as T[];
    },
    withTransactionAsync: async (task: () => Promise<void>) => {
      sqlite.exec('BEGIN');
      try {
        await task();
        sqlite.exec('COMMIT');
      } catch (error) {
        sqlite.exec('ROLLBACK');
        throw error;
      }
    },
    closeAsync: async () => {
      sqlite.close();
    },
  };

  return db as unknown as SQLiteDatabase;
}

function flattenParams(params: SQLiteBindValue[]): SQLiteBindValue[] {
  if (params.length === 1 && Array.isArray(params[0])) {
    return params[0] as SQLiteBindValue[];
  }
  return params;
}

/** Fresh in-memory SQLite with full Muze schema at the current version. */
export async function openTestDatabase(): Promise<SQLiteDatabase> {
  const sqlite = new Database(':memory:');
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  sqlite.exec(SCHEMA_SQL);
  sqlite.pragma(`user_version = ${DATABASE_VERSION}`);
  return wrapBetterSqlite(sqlite);
}

/** Insert a minimal tracks row for FK-backed playlist / favorite / recent tests. */
export async function insertTestTrack(
  db: SQLiteDatabase,
  track: {
    id: string;
    title?: string;
    artist?: string;
    album?: string;
    albumArtist?: string | null;
    filename?: string;
    uri?: string;
    durationMs?: number;
    folderPath?: string | null;
    artworkPath?: string | null;
    dateAdded?: number | null;
    sourceModifiedAt?: number | null;
  },
): Promise<void> {
  const now = Date.now();
  await db.runAsync(
    `INSERT INTO tracks (
      id, uri, filename, title, artist, album, album_artist,
      track_number, year, genre, duration_ms, artwork_path, folder_path,
      date_added, source_modified_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      track.id,
      track.uri ?? `file:///music/${track.id}.flac`,
      track.filename ?? `${track.id}.flac`,
      track.title ?? 'Song One',
      track.artist ?? 'Artist One',
      track.album ?? 'Album One',
      track.albumArtist ?? null,
      1,
      2020,
      'Rock',
      track.durationMs ?? 180_000,
      track.artworkPath !== undefined ? track.artworkPath : '',
      track.folderPath !== undefined ? track.folderPath : 'Music/Album One',
      track.dateAdded !== undefined ? track.dateAdded : now,
      track.sourceModifiedAt !== undefined ? track.sourceModifiedAt : now,
      now,
    ],
  );
}
