import db from 'sqlite';
import config from '../config.json';
import { formatDate } from './utils';

const schemaVersion = 3;

const createTables = async () => {
  await db.run(`
    CREATE TABLE pledges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      requester TEXT NOT NULL,
      performer TEXT NOT NULL,
      content TEXT NOT NULL,
      deadline INTEGER NOT NULL,
      completed BOOLEAN NOT NULL DEFAULT 0,
      expiredNotificationSent BOOLEAN NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );
  `);
  await db.run(`
    CREATE TABLE schemaVersions (
      version INTEGER NOT NULL,
      migrationDate INTEGER NOT NULL
    );
  `);
  await db.run('INSERT INTO schemaVersions values (?, ?)', schemaVersion, Date.now());
};

const migrateIfNeeded = async () => {
  const hasSchemaVersionsTable = !!(await db.get(`
    SELECT 1 FROM sqlite_master WHERE name ='schemaVersions' and type='table';
  `));
  const currentVersion = hasSchemaVersionsTable ?
    (await db.get('SELECT max(version) as v FROM schemaVersions')).v : 1;
  console.log(`starting pledge, current DB version is ${currentVersion}`); // eslint-disable-line no-console
  if (currentVersion < 2) {
    // version 1 did not have a schemaVersions table, let's create it
    await db.run(`
      CREATE TABLE if not exists schemaVersions (
        version INTEGER NOT NULL,
        migrationDate INTEGER NOT NULL
      );`
    );
    // add first version line with migrationDate = now
    await db.run(`
      INSERT INTO schemaVersions values (2, ?)
    `, Date.now()
    );
    // perform migration v1 => v2
    await db.run(`
      ALTER TABLE pledges
      ADD COLUMN expiredNotificationSent BOOLEAN NOT NULL DEFAULT 0`
    );
    console.log('migrated DB to version 2'); // eslint-disable-line no-console
  }

  if (currentVersion < 3) {
    // add version line with migrationDate = now
    await db.run(`
      INSERT INTO schemaVersions values (3, ?)
    `, Date.now()
    );
    // perform migration v2 => v3
    await db.run(`
      ALTER TABLE pledges
      ADD COLUMN completed BOOLEAN NOT NULL DEFAULT 0`
    );
    console.log('migrated DB to version 3'); // eslint-disable-line no-console
  }
};

export const getList = async requester => {
  const requests = (await db.all(`
    SELECT id, requester, performer, content, deadline
    FROM pledges
    WHERE requester = ? AND completed = 0
  `, requester)).map(x => ({ ...x, deadline: formatDate(new Date(x.deadline)) }));

  const pledges = (await db.all(`
    SELECT id, requester, performer, content, deadline
    FROM pledges
    WHERE performer = ? AND completed = 0
  `, requester)).map(x => ({ ...x, deadline: formatDate(new Date(x.deadline)) }));

  return { requests, pledges };
};

export const getPledge = (pledgeId) => {
  return db.get(`
    SELECT id, requester, performer, content, deadline
    FROM pledges
    WHERE id = ?
  `, pledgeId
  );
};

export const insertPledge = ({ requester, performer, content, deadline }) => {
  return db.run(`
    INSERT INTO pledges (requester, performer, content, deadline, created_at)
    VALUES (?, ?, ?, ?, ?)
  `, requester, performer, content, deadline, Date.now()
  );
};

export const findAllPledgesExpiredToNotify = () => {
  return db.all(`
    SELECT id, requester, performer, content, deadline
    FROM pledges
    WHERE deadline < ? AND expiredNotificationSent = 0
  `, Date.now()
  );
};

export const setExpiredNotificationAsSentOnPledge = pledgeId => {
  return db.run(`
    UPDATE pledges
    SET expiredNotificationSent=1
    WHERE id = ?
  `, pledgeId
  );
};

export const deletePledge = pledgeId => {
  return db.run(`
    DELETE FROM pledges
    WHERE id = ?
  `, pledgeId
  );
};

export const completePledge = pledgeId => {
  return db.run(`
    UPDATE pledges
    SET completed = 1
    WHERE id = ?
  `, pledgeId
  );
};

export const init = async (dbFilename = config.db) => {
  try {
    await db.open(dbFilename);
  } catch (e) {
    await new db.Database(dbFilename);
  }
  const hasPledgesTable = !!(await db.get(`
    SELECT 1 FROM sqlite_master WHERE name ='pledges' and type='table';
  `));
  if (hasPledgesTable) {
    await migrateIfNeeded();
  } else {
    console.log('creating tables'); // eslint-disable-line no-console
    createTables();
  }
};

export const close = async () => {
  await db.close();
};
