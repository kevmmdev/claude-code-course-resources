import { Database } from 'bun:sqlite';

const DATABASE_PATH = process.env.DATABASE_PATH || './data/app.db';

let db: Database | null = null;
let schemaInitialized = false;

export function getDb(): Database {
  if (db) return db;

  db = new Database(DATABASE_PATH);
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');

  if (!schemaInitialized) {
    initializeSchema(db);
    schemaInitialized = true;
  }

  return db;
}

function initializeSchema(database: Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content_json TEXT NOT NULL,
      is_public INTEGER NOT NULL DEFAULT 0,
      public_slug TEXT UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES user(id)
    );

    CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
    CREATE INDEX IF NOT EXISTS idx_notes_public_slug ON notes(public_slug);
    CREATE INDEX IF NOT EXISTS idx_notes_is_public ON notes(is_public);
  `);
}

export function query<T>(sql: string, params?: (string | number | null)[]): T[] {
  const db = getDb();
  if (params) {
    return db.query<T, (string | number | null)[]>(sql).all(...params);
  }
  return db.query<T, (string | number | null)[]>(sql).all();
}

export function get<T>(sql: string, params?: (string | number | null)[]): T | undefined {
  const db = getDb();
  const result = params
    ? db.query<T, (string | number | null)[]>(sql).get(...params)
    : db.query<T, (string | number | null)[]>(sql).get();
  return result || undefined;
}

export function run(sql: string, params?: (string | number | null)[]): void {
  const db = getDb();
  if (params) {
    db.run(sql, params);
  } else {
    db.run(sql);
  }
}
