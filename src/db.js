import db from 'sqlite';
import config from '../config.json';

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

export const init = async () => {
  await db.open(config.db);
  await createTables();
};

export const insertPledge = ({ requester, performer, content, deadline }) => {
  return db.run(`
    INSERT INTO pledges (requester, performer, content, deadline, created_at)
    VALUES (?, ?, ?, ?, ?)
  `, requester, performer, content, deadline, Date.now()
  );
};
