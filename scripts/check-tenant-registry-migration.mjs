/**
 * Applies the commercial tenant registry migration to a disposable local database,
 * rolls the tables back, and drops that database.
 * Refuses any host other than localhost or 127.0.0.1.
 */
import 'dotenv/config';
import fs from 'node:fs';
import mysql from 'mysql2/promise';

const raw = process.env.DATABASE_URL;
if (!raw) {
  console.error('DATABASE_URL is not set.');
  process.exit(1);
}
const url = new URL(raw);
if (url.hostname !== '127.0.0.1' && url.hostname !== 'localhost') {
  console.error('Refusing to run against a non-local database host.');
  process.exit(1);
}

const database = 'pw_chat_platform_migration_check';
const connection = await mysql.createConnection({
  host: url.hostname,
  port: Number(process.env.PW_MIGRATION_CHECK_PORT || url.port || 3306),
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  multipleStatements: true,
});

try {
  await connection.query(`DROP DATABASE IF EXISTS \`${database}\``);
  await connection.query(`CREATE DATABASE \`${database}\``);
  await connection.query(`USE \`${database}\``);
  const sql = fs.readFileSync('prisma/migrations/20261019200000_platform_tenant_account/migration.sql', 'utf8');
  await connection.query(sql);
  const [created] = await connection.query('SHOW TABLES');
  if (created.length !== 5) {
    throw new Error(`Expected 5 tables, found ${created.length}.`);
  }
  await connection.query(`
    DROP TABLE PlatformTenantSiteInstallation;
    DROP TABLE PlatformTenantAudit;
    DROP TABLE PlatformTenantOrigin;
    DROP TABLE PlatformTenantSite;
    DROP TABLE PlatformTenantAccount;
  `);
  const [left] = await connection.query('SHOW TABLES');
  if (left.length !== 0) throw new Error('Rollback left tables behind.');
  console.log('disposable_mysql_ok');
} finally {
  await connection.query(`DROP DATABASE IF EXISTS \`${database}\``);
  await connection.end();
}
