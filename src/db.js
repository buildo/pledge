import db from 'sqlite';
import config from '../config.json';
import { formatDate } from './utils';

const schemaVersion = 4;

const teamsTableDDL = `CREATE TABLE teams (
  teamName TEXT NOT NULL,
  teamId TEXT NOT NULL,
  botUserId TEXT NOT NULL,
  botAccessToken TEXT NOT NULL,
  createdAt INTEGER NOT NULL
);`;

const createTables = async () => {
  await db.run(`
    CREATE TABLE pledges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      teamId TEXT,
      requester TEXT NOT NULL,
      performer TEXT NOT NULL,
      content TEXT NOT NULL,
      deadline INTEGER NOT NULL,
      completed BOOLEAN NOT NULL DEFAULT 0,
      expiredNotificationSent BOOLEAN NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );
  `);
  await db.run(teamsTableDDL);
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

  if (currentVersion < 4) {
    // add version line with migrationDate = now
    await db.run(`
      INSERT INTO schemaVersions values (4, ?)
    `, Date.now()
    );
    // perform migration v3 => v4
    await db.run(teamsTableDDL);
    await db.run(`
      ALTER TABLE pledges
      ADD COLUMN teamId TEXT`
    );
    console.log('migrated DB to version 4'); // eslint-disable-line no-console
  }
};

export const getTeam = (teamId) => {
  return db.get(`
    SELECT teamId, teamName, botUserId, botAccessToken, createdAt
    FROM teams
    WHERE teamId = ?
  `, teamId
  );
};

export const insertTeam = (teamId, teamName, botUserId, botAccessToken) => {
  return db.run(`
    INSERT INTO teams (teamId, teamName, botUserId, botAccessToken, createdAt)
    VALUES (?, ?, ?, ?, ?)
  `, teamId, teamName, botUserId, botAccessToken, Date.now()
  );
};

export const getList = async (requester, teamId) => {
  const requests = (await db.all(`
    SELECT id, requester, performer, content, deadline
    FROM pledges
    WHERE requester = ? AND teamId = ? AND completed = 0
  `, requester, teamId)).map(x => ({ ...x, deadline: formatDate(new Date(x.deadline)) }));

  const pledges = (await db.all(`
    SELECT id, requester, performer, content, deadline
    FROM pledges
    WHERE performer = ? AND teamId = ? AND completed = 0
  `, requester, teamId)).map(x => ({ ...x, deadline: formatDate(new Date(x.deadline)) }));

  return { requests, pledges };
};

export const getPledge = (pledgeId) => {
  return db.get(`
    SELECT id, teamId, requester, performer, content, deadline
    FROM pledges
    WHERE id = ?
  `, pledgeId
  );
};

export const insertPledge = ({ teamId, requester, performer, content, deadline }) => {
  return db.run(`
    INSERT INTO pledges (teamId, requester, performer, content, deadline, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `, teamId, requester, performer, content, deadline, Date.now()
  );
};

export const getTeamByBotAccessToken = (botAccessToken) => {
  return db.get(`
    SELECT teamId, teamName, botUserId, botAccessToken, createdAt
    FROM teams
    WHERE botAccessToken = ?
  `, botAccessToken
  );
};

export const findAllPledgesExpiredToNotify = () => {
  return db.all(`
    SELECT id, teamId, requester, performer, content, deadline
    FROM pledges
    WHERE deadline < ? AND expiredNotificationSent = 0 AND completed = 0
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
