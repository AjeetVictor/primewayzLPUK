/**
 * Applies the tenant chat entitlement migration to a disposable MySQL database
 * and drops that database. It never selects the database named in DATABASE_URL.
 */
import fs from 'node:fs';
import path from 'node:path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const source = process.env.DATABASE_URL;
if (!source) {
  console.error('DATABASE_URL is required so the script can reach the MySQL server.');
  process.exit(1);
}

const url = new URL(source);
const sourceDatabase = url.pathname.replace(/^\//, '');
const disposable = `pw_uk_entitlement_migcheck_${process.pid}`;
if (!sourceDatabase || disposable === sourceDatabase) {
  console.error('Refusing to use the DATABASE_URL database as the migration target.');
  process.exit(1);
}

url.pathname = '/mysql';
const admin = await mysql.createConnection(url.toString());
try {
  await admin.query(`CREATE DATABASE \`${disposable}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await admin.query(`USE \`${disposable}\``);
  const sql = fs.readFileSync(
    path.join(process.cwd(), 'prisma/migrations/20261019180000_tenant_chat_entitlement/migration.sql'),
    'utf8',
  );
  const statements = sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.replace(/--[^\n]*/g, '').trim())
    .filter(Boolean);
  for (const statement of statements) await admin.query(statement);
  const [tables] = await admin.query('SHOW TABLES');
  const names = tables.map((row) => String(Object.values(row)[0]).toLowerCase()).sort();
  if (JSON.stringify(names) !== JSON.stringify(['tenantchatentitlement', 'tenantchatentitlementaudit'])) {
    throw new Error(`Unexpected tables: ${names.join(', ')}`);
  }
  await admin.query(
    `INSERT INTO TenantChatEntitlement (tenantId, status, reason, updatedByUserId, createdAt, updatedAt)
     VALUES ('pw-uk', 'suspended', 'disposable check', 1, NOW(3), NOW(3))`,
  );
  await admin.query(
    `INSERT INTO TenantChatEntitlementAudit (tenantId, actorUserId, status, reason, createdAt)
     VALUES ('pw-uk', 1, 'suspended', 'disposable check', NOW(3))`,
  );
  const [rows] = await admin.query(
    `SELECT status, reason FROM TenantChatEntitlement WHERE tenantId = 'pw-uk'`,
  );
  if (rows[0]?.status !== 'suspended' || rows[0]?.reason !== 'disposable check') {
    throw new Error('Disposable entitlement row was not readable.');
  }
  console.log(`Disposable migration ok: ${disposable}`);
} finally {
  await admin.query(`DROP DATABASE IF EXISTS \`${disposable}\``);
  await admin.end();
}
