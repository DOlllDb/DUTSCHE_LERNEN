import { dirname } from 'node:path';
import { mkdirSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import { config } from '../config.js';
import * as schema from './schema.js';

mkdirSync(dirname(config.DB_PATH), { recursive: true });

export const sqlite = new DatabaseSync(config.DB_PATH);
sqlite.exec('PRAGMA journal_mode = WAL');
sqlite.exec('PRAGMA foreign_keys = ON');

/**
 * Drizzle's SQLite drivers (better-sqlite3, libsql, ...) all ship as native
 * modules, which need a C++ toolchain to build on a fresh machine/VM. Node's
 * built-in `node:sqlite` needs nothing extra, so we drive it ourselves
 * through Drizzle's "bring your own client" sqlite-proxy adapter instead.
 */
export const db = drizzle(async (sqlText, params, method) => {
  const stmt = sqlite.prepare(sqlText);

  if (method === 'run') {
    stmt.run(...params);
    return { rows: [] };
  }

  if (method === 'all' || method === 'values') {
    const rows = stmt.all(...params) as Record<string, unknown>[];
    return { rows: rows.map((row) => Object.values(row)) };
  }

  // method === 'get'
  const row = stmt.get(...params) as Record<string, unknown> | undefined;
  return { rows: row ? Object.values(row) : undefined } as { rows: unknown[] };
}, { schema });
