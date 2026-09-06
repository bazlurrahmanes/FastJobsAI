import { getDatabase, IDatabase } from './database';
import { initSchema } from './schema';
import { seedInitialData } from './seed';

let isInitialized = false;

export function initDatabase(): IDatabase {
  const db = getDatabase();
  if (!isInitialized) {
    initSchema(db);
    seedInitialData(db);
    isInitialized = true;
  }
  return db;
}

export { getDatabase };
export type { IDatabase };
