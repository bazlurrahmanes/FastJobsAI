import fs from 'fs';
import path from 'path';
// @ts-ignore - node:sqlite is natively built-in Node 22
import { DatabaseSync } from 'node:sqlite';

export interface IDatabase {
  exec(sql: string): void;
  prepare(sql: string): {
    run(...params: any[]): { changes: number; lastInsertRowid: number | bigint };
    get(...params: any[]): any;
    all(...params: any[]): any[];
  };
}

let dbInstance: IDatabase | null = null;

export function getDatabase(): IDatabase {
  if (dbInstance) {
    return dbInstance;
  }

  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, 'jobxora_feed_engine.db');
  const db = new DatabaseSync(dbPath) as IDatabase;

  // Enable WAL mode for high concurrency, fast reads, and crash-resilience
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec('PRAGMA synchronous = NORMAL;');

  dbInstance = db;
  return dbInstance;
}
