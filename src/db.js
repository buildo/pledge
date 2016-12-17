import db from 'sqlite';
import config from '../config.json';
import { formatDate } from './utils';

const createTables = () => {
  return db.run(`
    CREATE TABLE if not exists pledges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      requester TEXT NOT NULL,
      performer TEXT NOT NULL,
      content TEXT NOT NULL,
      deadline INTEGER NOT NULL,
      expiredNotificationSent BOOLEAN NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );`
  );
};

const migrateIfNeeded = async () => {
  // if there is no table schemaVersions, currentVersion is 1
  let currentVersion = (await db.get(`
    SELECT 1 FROM sqlite_master WHERE name ='schemaVersions' and type='table';
  `) ? undefined : 1);
  // if there is the schemaVersions table we can check the last version
  if (typeof currentVersion === 'undefined') {
    currentVersion = (await db.get(`SELECT max(version) as v FROM schemaVersions`)).v;
  }
  console.log(`starting pledge version ${currentVersion}`);
  if (currentVersion === 1) {
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
    console.log('migrated DB to version 2');
  }
};

export const getList = async requester => {
  const requests = (await db.all(`
    SELECT id, requester, performer, content, deadline
    FROM pledges
    WHERE requester = ?
  `, requester)).map(x => ({ ...x, deadline: formatDate(new Date(x.deadline)) }));

  const pledges = (await db.all(`
    SELECT id, requester, performer, content, deadline
    FROM pledges
    WHERE performer = ?
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


export const init = async () => {
  await db.open(config.db);
  await createTables();
  await migrateIfNeeded();
};
