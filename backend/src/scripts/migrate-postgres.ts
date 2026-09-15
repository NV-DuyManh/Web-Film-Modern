/**
 * MFILM PostgreSQL Cloud Schema Migration Runner
 * Executes idempotent table creation against Aiven PostgreSQL Free or local PostgreSQL.
 */

import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

async function runMigration() {
  const dbUrl = process.env.DATABASE_URL;
  const useSsl = process.env.DATABASE_SSL === 'true' || Boolean(dbUrl);

  const clientConfig: any = dbUrl
    ? { connectionString: dbUrl }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5433', 10),
        user: process.env.DB_USER || 'mfilm_user',
        password: process.env.DB_PASSWORD || 'mfilm_password',
        database: process.env.DB_NAME || 'mfilm_db',
      };

  if (useSsl) {
    clientConfig.ssl = { rejectUnauthorized: false };
  }

  const client = new Client(clientConfig);

  console.log('[*] Connecting to PostgreSQL database...');
  await client.connect();

  try {
    // 1. Check version
    const versionRes = await client.query('SELECT version();');
    console.log(`[+] PostgreSQL Version: ${versionRes.rows[0].version}`);

    // 2. Read init.sql
    const initSqlPath = path.resolve(__dirname, '../../../infra/postgres/init.sql');
    if (!fs.existsSync(initSqlPath)) {
      throw new Error(`Init SQL script not found at ${initSqlPath}`);
    }
    const sql = fs.readFileSync(initSqlPath, 'utf-8');

    console.log('[*] Executing idempotent schema migration (29 tables)...');
    await client.query(sql);
    console.log('[+] Schema migration executed successfully.');

    // 3. Count tables
    const tableRes = await client.query(`
      SELECT count(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    `);
    console.log(`[+] Verified Tables in Public Schema: ${tableRes.rows[0].count} tables`);

    // 4. Safe transaction smoke test with rollback
    console.log('[*] Executing transaction smoke test (with automatic rollback)...');
    await client.query('BEGIN;');
    await client.query(`
      INSERT INTO sex (id, name) 
      VALUES ('smoke_test_id', 'Smoke Test') 
      ON CONFLICT (id) DO NOTHING;
    `);
    const smokeRes = await client.query("SELECT * FROM sex WHERE id = 'smoke_test_id';");
    if (smokeRes.rows.length !== 1) {
      throw new Error('Smoke test insert failed verification.');
    }
    await client.query('ROLLBACK;');
    console.log('[+] Transaction smoke test passed (insert verified & rolled back clean).');

    console.log('\n======================================================');
    console.log('✅ PostgreSQL Cloud Migration & Verification Complete!');
    console.log('======================================================\n');
  } finally {
    await client.end();
  }
}

runMigration().catch((err) => {
  console.error('[!] Migration failed:', err.message);
  process.exit(1);
});
