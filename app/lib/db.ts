import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const DB_PATH =
  process.env.DATABASE_PATH ??
  path.join(process.cwd(), "data", "members.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.exec(`
      CREATE TABLE IF NOT EXISTS members (
        telegram_user_id    TEXT PRIMARY KEY,
        member_code         TEXT NOT NULL UNIQUE,
        status              TEXT NOT NULL DEFAULT 'none',
        total_eur_valid     REAL NOT NULL DEFAULT 0,
        elector_since       TEXT,
        can_vote_from       TEXT,
        wallet_address      TEXT,
        first_valid_tx_hash TEXT,
        last_tx_hash        TEXT,
        created_at          TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
  }
  return _db;
}
