import { schema } from '@repo/db';
import { drizzle, type ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

let instance: ExpoSQLiteDatabase<typeof schema> | undefined;

/**
 * Open the local SQLite database lazily (native only) and ensure the slice's
 * tables exist. Full drizzle-kit migrations will replace the inline DDL later.
 */
export function getDb(): ExpoSQLiteDatabase<typeof schema> {
  if (!instance) {
    const sqlite = openDatabaseSync('super-splitwise.db');
    sqlite.execSync('CREATE TABLE IF NOT EXISTS groups (id INTEGER PRIMARY KEY NOT NULL, name TEXT NOT NULL);');
    instance = drizzle(sqlite, { schema });
  }
  return instance;
}
