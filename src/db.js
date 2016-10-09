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
      created_at INTEGER NOT NULL
    )`
  );
};

export const getList = async requester => {
  const requests = (await db.all(`
    SELECT requester, performer, content, deadline
    FROM pledges
    WHERE requester = ?
  `, requester)).map(x => ({ ...x, deadline: formatDate(new Date(x.deadline)) }));

  const pledges = (await db.all(`
    SELECT requester, performer, content, deadline
    FROM pledges
    WHERE performer = ?
  `, requester)).map(x => ({ ...x, deadline: formatDate(new Date(x.deadline)) }));

  return { requests, pledges };
};

export const insertPledge = ({ requester, performer, content, deadline }) => {
  return db.run(`
    INSERT INTO pledges (requester, performer, content, deadline, created_at)
    VALUES (?, ?, ?, ?, ?)
  `, requester, performer, content, deadline, Date.now()
  );
};

export const init = async () => {
  await db.open(config.db);
  await createTables();
};
