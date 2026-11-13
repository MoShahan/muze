import { folderIdFor } from '@/lib/db/ids';
import { folderDisplayName } from '@/lib/media/folder-path';

import type { SQLiteDatabase } from 'expo-sqlite';

export type FolderRow = {
  id: string;
  path: string;
  name: string;
  trackCount: number;
};

export async function listFolders(db: SQLiteDatabase): Promise<FolderRow[]> {
  const rows = await db.getAllAsync<{ folder_path: string; track_count: number }>(
    `SELECT folder_path, COUNT(*) AS track_count
     FROM tracks
     WHERE folder_path IS NOT NULL AND TRIM(folder_path) != ''
     GROUP BY folder_path
     ORDER BY folder_path COLLATE NOCASE ASC`,
  );

  return rows.map((row) => ({
    id: folderIdFor(row.folder_path),
    path: row.folder_path,
    name: folderDisplayName(row.folder_path),
    trackCount: row.track_count,
  }));
}

export async function getFolderById(db: SQLiteDatabase, id: string): Promise<FolderRow | null> {
  const folders = await listFolders(db);
  return folders.find((folder) => folder.id === id) ?? null;
}
