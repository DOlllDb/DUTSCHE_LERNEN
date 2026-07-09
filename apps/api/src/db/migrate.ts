import { migrate } from 'drizzle-orm/sqlite-proxy/migrator';
import { db, sqlite } from './client.js';

await migrate(
  db,
  async (queries) => {
    sqlite.exec('BEGIN');
    try {
      for (const query of queries) sqlite.exec(query);
      sqlite.exec('COMMIT');
    } catch (err) {
      sqlite.exec('ROLLBACK');
      throw err;
    }
  },
  { migrationsFolder: './drizzle' }
);

console.log('Migrations applied.');
