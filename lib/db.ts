import { PGlite } from '@electric-sql/pglite';
import postgres from 'postgres';
import { mkdir } from 'node:fs/promises';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export interface Database {
  query<T>(statement: string, values?: (string | number | null)[]): Promise<T[]>;
  execute(statement: string): Promise<void>;
}
let connection: Promise<Database> | undefined;

export function database() {
  return connection ??= open().catch(error => {
    connection = undefined;
    throw error;
  });
}
async function open(): Promise<Database> {
  if (process.env.DATABASE_URL) {
    const sql = postgres(process.env.DATABASE_URL, { max: 4, prepare: false, ssl: 'require' });
    return {
      query: async <T,>(statement: string, values: (string | number | null)[] = []) => await sql.unsafe(statement, values) as unknown as T[],
      execute: async statement => { await sql.unsafe(statement); }
    };
  }
  if (process.env.VERCEL) throw new Error('Configure DATABASE_URL for hosted PostgreSQL.');
  const dir = process.env.PGLITE_DIR || path.join(process.cwd(), '.data', 'postgres');
  if (dir !== 'memory://') await mkdir(dir, { recursive: true });
  const local = new PGlite(dir);
  await local.exec(await readFile(path.join(process.cwd(), 'db', 'schema.sql'), 'utf8'));
  return {
    query: async <T,>(statement: string, values: (string | number | null)[] = []) => (await local.query<T>(statement, values)).rows,
    execute: async statement => { await local.exec(statement); }
  };
}
