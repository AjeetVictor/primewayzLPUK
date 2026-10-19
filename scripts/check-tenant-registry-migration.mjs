/**
 * Rehearses 20261019200000_platform_tenant_account on a disposable local MySQL 8 database.
 * Refuses any host other than localhost or 127.0.0.1.
 * Proves Prisma idempotency, historical-row compatibility, origin uniqueness, and rollback.
 * Does not read or write any other database.
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
const migrationName = '20261019200000_platform_tenant_account';
const port = Number(process.env.PW_MIGRATION_CHECK_PORT || url.port || 3306);

const connection = await mysql.createConnection({
  host: url.hostname,
  port,
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  multipleStatements: true,
});

async function scalar(sql) {
  const [rows] = await connection.query(sql);
  const row = rows[0];
  return row ? Object.values(row)[0] : null;
}

try {
  await connection.query(`DROP DATABASE IF EXISTS \`${database}\``);
  await connection.query(`CREATE DATABASE \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await connection.query(`USE \`${database}\``);

  const version = await scalar('SELECT VERSION()');
  if (!String(version).startsWith('8.')) throw new Error(`Expected MySQL 8, found ${version}.`);
  await connection.query(`
    CREATE TABLE User (
      id INTEGER NOT NULL AUTO_INCREMENT,
      email VARCHAR(191) NOT NULL,
      password VARCHAR(191) NOT NULL,
      role VARCHAR(32) NOT NULL DEFAULT 'viewer',
      isPlatformOwner BOOLEAN NOT NULL DEFAULT false,
      createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      UNIQUE KEY User_email_key (email)
    );
    CREATE TABLE UserTenantGrant (
      userId INTEGER NOT NULL,
      tenantId VARCHAR(32) NOT NULL,
      createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (userId, tenantId),
      CONSTRAINT UserTenantGrant_user_fkey FOREIGN KEY (userId) REFERENCES User(id)
    );
    CREATE TABLE ChatSession (
      id VARCHAR(191) NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'new',
      tenantId VARCHAR(32) NULL,
      market VARCHAR(8) NULL,
      sourceSite VARCHAR(191) NULL,
      sourceOrigin VARCHAR(255) NULL,
      sourceChannel VARCHAR(64) NULL,
      createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updatedAt DATETIME(3) NOT NULL,
      PRIMARY KEY (id)
    );
    CREATE TABLE ChatMessage (
      id INTEGER NOT NULL AUTO_INCREMENT,
      sessionId VARCHAR(191) NOT NULL,
      sender VARCHAR(32) NOT NULL,
      text TEXT NOT NULL,
      answered BOOLEAN NOT NULL DEFAULT false,
      isInternalNote BOOLEAN NOT NULL DEFAULT false,
      timestamp DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      CONSTRAINT ChatMessage_session_fkey FOREIGN KEY (sessionId) REFERENCES ChatSession(id)
    );
    CREATE TABLE ChatConnectInstallation (
      id VARCHAR(64) NOT NULL,
      tenantId VARCHAR(32) NOT NULL,
      integrationTechnology VARCHAR(32) NOT NULL,
      authorizationStatus VARCHAR(32) NOT NULL,
      frontendVisibility VARCHAR(16) NOT NULL,
      legacyEnvBinding BOOLEAN NOT NULL DEFAULT false,
      heartbeatProtocolAdopted BOOLEAN NOT NULL DEFAULT false,
      createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updatedAt DATETIME(3) NOT NULL,
      PRIMARY KEY (id)
    );
    CREATE TABLE TenantChatEntitlement (
      tenantId VARCHAR(32) NOT NULL,
      status VARCHAR(32) NOT NULL,
      reason VARCHAR(512) NOT NULL,
      createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updatedAt DATETIME(3) NOT NULL,
      PRIMARY KEY (tenantId)
    );
  `);

  await connection.query(`
    INSERT INTO User (email, password, role, isPlatformOwner, createdAt)
    VALUES ('hist-accept@example.test', 'not-a-real-secret', 'editor', false, '2026-01-01 00:00:00.000');
    INSERT INTO UserTenantGrant (userId, tenantId, createdAt)
    VALUES (LAST_INSERT_ID(), 'pw-uk', '2026-01-01 00:00:00.000');
    INSERT INTO ChatSession (id, status, tenantId, market, sourceSite, sourceOrigin, sourceChannel, createdAt, updatedAt)
    VALUES ('hist-session', 'admin_replied', 'pw-uk', 'UK', 'uk.primewayz.com', 'https://uk.primewayz.com', 'chat', '2026-01-01 00:00:00.000', '2026-01-01 00:00:00.000');
    INSERT INTO ChatMessage (sessionId, sender, text, answered, isInternalNote, timestamp)
    VALUES ('hist-session', 'user', 'historical hello', false, false, '2026-01-01 00:00:00.000');
    INSERT INTO ChatConnectInstallation (
      id, tenantId, integrationTechnology, authorizationStatus, frontendVisibility,
      legacyEnvBinding, heartbeatProtocolAdopted, createdAt, updatedAt
    ) VALUES (
      'cci_hist', 'pw-infotech', 'wordpress', 'active', 'hidden',
      true, false, '2026-01-01 00:00:00.000', '2026-01-01 00:00:00.000'
    );
    INSERT INTO TenantChatEntitlement (tenantId, status, reason, createdAt, updatedAt)
    VALUES ('rrb', 'suspended', 'historical hold', '2026-01-01 00:00:00.000', '2026-01-01 00:00:00.000');
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS _prisma_migrations (
      id VARCHAR(36) NOT NULL,
      checksum VARCHAR(64) NOT NULL,
      finished_at DATETIME(3) NULL,
      migration_name VARCHAR(255) NOT NULL,
      logs TEXT NULL,
      rolled_back_at DATETIME(3) NULL,
      started_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      applied_steps_count INTEGER UNSIGNED NOT NULL DEFAULT 0,
      PRIMARY KEY (id)
    )
  `);
  const migrationSql = fs.readFileSync('prisma/migrations/20261019200000_platform_tenant_account/migration.sql', 'utf8');
  await connection.query(migrationSql);
  await connection.query(
    `INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, applied_steps_count)
     VALUES (?, ?, NOW(3), ?, 1)`,
    ['accept-tenant-account', 'checked-locally', migrationName],
  );
  const already = await scalar(`SELECT COUNT(*) FROM _prisma_migrations WHERE migration_name = '${migrationName}' AND finished_at IS NOT NULL`);
  if (Number(already) !== 1) throw new Error('Migration ledger did not record a single apply.');
  let replayBlocked = false;
  try {
    await connection.query(migrationSql);
  } catch (error) {
    replayBlocked = error && (error.code === 'ER_TABLE_EXISTS_ERROR' || error.errno === 1050);
  }
  if (!replayBlocked) throw new Error('Running the migration SQL twice was not rejected. Idempotency depends on the Prisma ledger, not a second CREATE.');

  const message = await scalar(`SELECT text FROM ChatMessage WHERE sessionId = 'hist-session'`);
  const grant = await scalar(`SELECT tenantId FROM UserTenantGrant WHERE tenantId = 'pw-uk'`);
  const installation = await scalar(`SELECT tenantId FROM ChatConnectInstallation WHERE id = 'cci_hist'`);
  const entitlement = await scalar(`SELECT status FROM TenantChatEntitlement WHERE tenantId = 'rrb'`);
  if (message !== 'historical hello' || grant !== 'pw-uk' || installation !== 'pw-infotech' || entitlement !== 'suspended') {
    throw new Error('Historical grant, installation, entitlement, or conversation changed.');
  }

  const now = '2026-10-19 12:00:00.000';
  await connection.query(`
    INSERT INTO PlatformTenantAccount (
      tenantId, displayName, brand, market, organizationName, primaryContactName, primaryContactEmail,
      lifecycleStatus, capabilities, sourceKind, explicitEntitlement, createdAt, updatedAt
    ) VALUES
      ('acme-uk', 'Acme', 'Customer', 'UK', 'Acme Ltd', 'Ada', 'ada@acme.test', 'active', '{"chat":true}', 'database', true, '${now}', '${now}'),
      ('beta-uk', 'Beta', 'Customer', 'UK', 'Beta Ltd', 'Bea', 'bea@beta.test', 'active', '{"chat":true}', 'database', true, '${now}', '${now}');
    INSERT INTO PlatformTenantSite (id, tenantId, displayName, technology, status, createdAt, updatedAt)
    VALUES
      ('site_acme', 'acme-uk', 'Acme', 'wordpress', 'active', '${now}', '${now}'),
      ('site_beta', 'beta-uk', 'Beta', 'wordpress', 'pending', '${now}', '${now}');
    INSERT INTO PlatformTenantOrigin (
      id, tenantId, siteId, origin, verificationStatus, verificationTokenHash, challengeIssuedAt, createdAt, updatedAt
    ) VALUES (
      'origin_acme', 'acme-uk', 'site_acme', 'https://acme.example', 'verified', '${'a'.repeat(64)}', '${now}', '${now}', '${now}'
    );
  `);
  let collision = false;
  try {
    await connection.query(`
      INSERT INTO PlatformTenantOrigin (
        id, tenantId, siteId, origin, verificationStatus, verificationTokenHash, challengeIssuedAt, createdAt, updatedAt
      ) VALUES (
        'origin_beta', 'beta-uk', 'site_beta', 'https://acme.example', 'pending', '${'b'.repeat(64)}', '${now}', '${now}', '${now}'
      )
    `);
  } catch (error) {
    collision = error && (error.code === 'ER_DUP_ENTRY' || error.errno === 1062);
  }
  if (!collision) throw new Error('A second tenant was able to claim an origin already registered.');

  await connection.query(`
    DROP TABLE PlatformTenantSiteInstallation;
    DROP TABLE PlatformTenantAudit;
    DROP TABLE PlatformTenantOrigin;
    DROP TABLE PlatformTenantSite;
    DROP TABLE PlatformTenantAccount;
  `);
  const [left] = await connection.query(`SHOW TABLES LIKE 'PlatformTenant%'`);
  if (left.length !== 0) throw new Error('Rollback left commercial registry tables behind.');
  await connection.query(migrationSql);
  const [restored] = await connection.query(`SHOW TABLES LIKE 'PlatformTenant%'`);
  if (restored.length !== 5) throw new Error(`Re-applying after rollback created ${restored.length} tables.`);
  const messageAfter = await scalar(`SELECT text FROM ChatMessage WHERE sessionId = 'hist-session'`);
  const grantAfter = await scalar(`SELECT COUNT(*) FROM UserTenantGrant WHERE tenantId = 'pw-uk'`);
  const installationAfter = await scalar(`SELECT id FROM ChatConnectInstallation WHERE id = 'cci_hist'`);
  const entitlementAfter = await scalar(`SELECT status FROM TenantChatEntitlement WHERE tenantId = 'rrb'`);
  const sessionTenant = await scalar(`SELECT tenantId FROM ChatSession WHERE id = 'hist-session'`);
  if (messageAfter !== 'historical hello' || Number(grantAfter) !== 1 || installationAfter !== 'cci_hist' || entitlementAfter !== 'suspended' || sessionTenant !== 'pw-uk') {
    throw new Error('Rollback changed historical conversations, grants, installations, or entitlements.');
  }
  console.log('disposable_mysql_ok idempotent=1 historical_rows=kept origin_collision=rejected rollback=clean');
} finally {
  await connection.query(`DROP DATABASE IF EXISTS \`${database}\``);
  await connection.end();
}
