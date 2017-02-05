import db from 'sqlite';
import config from '../config.json';
import { formatDate } from './utils';

const createTables = async () => {
  await db.run(`
    CREATE TABLE pledges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      teamId TEXT NOT NULL,
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
    CREATE TABLE teams (
      teamName TEXT NOT NULL,
      teamId TEXT NOT NULL,
      botUserId TEXT NOT NULL,
      botAccessToken TEXT NOT NULL,
      createdAt INTEGER NOT NULL
    );
  `);
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
  if (!hasPledgesTable) {
    createTables();
  }
};

export const close = async () => {
  await db.close();
};
