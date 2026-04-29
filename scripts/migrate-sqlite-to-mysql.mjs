import { DatabaseSync } from 'node:sqlite';
import mysql from 'mysql2/promise';

const SQLITE_PATH = process.env.SQLITE_PATH || 'prisma/dev.db';
const DATABASE_URL = process.env.DATABASE_URL;
const DRY_RUN = process.argv.includes('--dry-run');

if (!DATABASE_URL) {
  console.error('DATABASE_URL is missing in environment.');
  process.exit(1);
}

function readTableRows(sqliteDb, tableName) {
  return sqliteDb.prepare(`SELECT * FROM "${tableName}"`).all();
}

function asMySqlDateTime(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

async function migrate() {
  const sqliteDb = new DatabaseSync(SQLITE_PATH, { readOnly: true });
  let mysqlConn;

  try {
    const formResponses = readTableRows(sqliteDb, 'FormResponse');
    const chatSessions = readTableRows(sqliteDb, 'ChatSession');
    const chatMessages = readTableRows(sqliteDb, 'ChatMessage');

    console.log(`SQLite source: ${SQLITE_PATH}`);
    console.log(`FormResponse rows: ${formResponses.length}`);
    console.log(`ChatSession rows: ${chatSessions.length}`);
    console.log(`ChatMessage rows: ${chatMessages.length}`);

    if (DRY_RUN) {
      console.log('Dry run enabled. No MySQL writes were executed.');
      return;
    }

    mysqlConn = await mysql.createConnection(DATABASE_URL);
    await mysqlConn.beginTransaction();

    for (const row of formResponses) {
      await mysqlConn.execute(
        `
          INSERT INTO FormResponse (id, name, email, message, createdAt)
          VALUES (?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE id = id
        `,
        [row.id, row.name, row.email, row.message, asMySqlDateTime(row.createdAt)]
      );
    }

    for (const row of chatSessions) {
      await mysqlConn.execute(
        `
          INSERT INTO ChatSession (id, name, email, createdAt)
          VALUES (?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE id = id
        `,
        [row.id, row.name ?? null, row.email ?? null, asMySqlDateTime(row.createdAt)]
      );
    }

    for (const row of chatMessages) {
      await mysqlConn.execute(
        `
          INSERT INTO ChatMessage (id, sessionId, sender, text, timestamp, replyToId)
          VALUES (?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE id = id
        `,
        [
          row.id,
          row.sessionId,
          row.sender,
          row.text,
          asMySqlDateTime(row.timestamp),
          row.replyToId ?? null,
        ]
      );
    }

    await mysqlConn.commit();
    console.log('Migration completed successfully.');
  } catch (error) {
    if (mysqlConn) {
      await mysqlConn.rollback();
    }
    console.error('Migration failed and transaction rolled back.');
    console.error(error);
    process.exitCode = 1;
  } finally {
    if (mysqlConn) {
      await mysqlConn.end();
    }
    sqliteDb.close();
  }
}

migrate();
