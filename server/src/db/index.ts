import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'uptime.db');
export const db = new DatabaseSync(dbPath);

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS monitors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('HTTP', 'TCP', 'PING')),
      target TEXT NOT NULL,
      port INTEGER,
      interval INTEGER NOT NULL DEFAULT 60,
      timeout INTEGER NOT NULL DEFAULT 10,
      max_retries INTEGER NOT NULL DEFAULT 1,
      expected_status TEXT DEFAULT '200-299',
      keyword TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      current_status TEXT NOT NULL DEFAULT 'PENDING',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS heartbeats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      monitor_id INTEGER NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('UP', 'DOWN')),
      response_time INTEGER NOT NULL DEFAULT 0,
      status_code INTEGER,
      message TEXT,
      timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (monitor_id) REFERENCES monitors(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_heartbeats_monitor_time 
    ON heartbeats (monitor_id, timestamp DESC);

    CREATE TABLE IF NOT EXISTS incidents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      monitor_id INTEGER NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('DOWN', 'RESOLVED')),
      cause TEXT,
      started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      resolved_at TEXT,
      duration INTEGER,
      FOREIGN KEY (monitor_id) REFERENCES monitors(id) ON DELETE CASCADE
    );
  `);
}
