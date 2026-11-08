import { SQLiteProvider } from 'expo-sqlite';
import { type PropsWithChildren } from 'react';

import { migrateDatabase } from '@/lib/db/migrate';
import { DATABASE_NAME } from '@/lib/db/schema';

type DatabaseProviderProps = PropsWithChildren<{
  onError?: (error: Error) => void;
}>;

export function DatabaseProvider({ children, onError }: DatabaseProviderProps) {
  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateDatabase} onError={onError}>
      {children}
    </SQLiteProvider>
  );
}
