import express from 'express';
import request from 'request-promise';
import bodyParser from 'body-parser';
import 'babel-core/register';
import 'babel-polyfill';
//import db from 'sqlite';
import config from '../config.json';
import _debug from 'debug';

const debug = _debug('pledge');

const app = express();
app.use(bodyParser.json());
//app.use((req, res, next) => {
  //res.header('Access-Control-Allow-Origin', '*');
  //res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  //res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  //next();
//});

//const elephantSlackBot = new Slackbot({
  //name: 'elephant',
  //token: config.slack.token
//});

//const github = new Octokat({
  //token: config.github.token,
  //rootURL: config.github.apirUrl
//});

//const githubEnterprise = new Octokat({
  //token: config.githubEnterprise.token,
  //rootURL: config.githubEnterprise.apirUrl
//});

//const nobodyCommented = ({ org, repo, issueNo, enterprise }) => async ({ date }) => {
  //const api = enterprise === 'true' ? githubEnterprise : github;
  //const comments = await api.repos(org, repo).issues(`${issueNo}`).comments.fetch();
  //const { createdAt } = last(comments) || {};
  //return !createdAt || new Date(createdAt).getTime() < date;
//};

// const INTERVAL = 1000 * config.interval;
const INCOMING_WEBHOOK_URL = config.slack.incomingWebhookURL;

//const insertReminder = ({ issueNo, repo, userId, date, type, enterprise }) => {
  //return db.run(`
    //INSERT INTO github_reminders (issueNo, repo, userId, date, type, creationDate, enterprise)
    //VALUES (?, ?, ?, ?, ?, ?, ?)
  //`, issueNo, repo, userId, date, type, Date.now(), enterprise
  //);
//};

//const createTables = () => {
  //return db.run(`
    //CREATE TABLE if not exists github_reminders (
      //issueNo INTEGER NOT NULL,
      //repo TEXT NOT NULL,
      //userId TEXT NOT NULL,
      //date INTEGER NOT NULL,
      //creationDate INTEGER NOT NULL,
      //enterprise BOOLEAN DEFAULT FALSE,
      //type TEXT NOT NULL
    //)`
  //);
//};

//const sendSlackMessage = ({ userId, message, attachments }) => {
  //elephantSlackBot.postMessageToUser(userId, message, {
    //attachments,
    //icon_url: 'https://s4.postimg.org/6mgvy7x1p/ycog_Bz6kid.jpg',
    //as_user: false,
    //unfurl_links: true,
    //link_names: 1
  //}, res => debug({ res }));
//};

//const sendNotification = ({ userId, repo, issueNo, enterprise, type }) => {
  //const slackUserId = githubToSlack[userId];
  //const BASE_URL = enterprise === 'true' ? GITHUB_ENTERPRISE : GITHUB;
  //const ISSUE_URL = `${BASE_URL}/${repo}/issues/${issueNo}`;
  //const SNOOZE_BASE_URL = `https://${config.domain}/reminders/snooze?userId=${userId}&repo=${repo}&issueNo=${issueNo}&enterprise=${enterprise}&type=${type}`;
  //if (slackUserId) {
    //const six30Pm = new Date(); six30Pm.setHours(18); six30Pm.setMinutes(0);
    //const tomorrowMorning = new Date(); tomorrowMorning.setDate(tomorrowMorning.getDate() + 1); tomorrowMorning.setHours(9); tomorrowMorning.setMinutes(0);
    //const nextMonday = new Date(); nextMonday.setDate(nextMonday.getDate() + (nextMonday.getDay() === 0 ? 1 : 8 - nextMonday.getDay())); nextMonday.setHours(9); nextMonday.setMinutes(0);
    //return sendSlackMessage({
      //userId: slackUserId,
      //message: `@${slackUserId}, you asked me to remind you about this thread`,
      //attachments: [{
        //color: '#32CD32',
        //fields: [
          //{ title: 'repo', value: repo, short: true },
          //{ title: 'issue', value: issueNo, short: true },
          //{ title: 'link', value: ISSUE_URL, short: true }
        //]
      //}, {
        //text: 'Wanna snooze it?',
        //callback_id: ISSUE_URL,
        //fallback: 'your UI doesnt support button. Ooops too bad',
        //attachment_type: 'default',
        //color: '#E6E6FA',
        //fields: [
          //{ value: `<${SNOOZE_BASE_URL}&snooze=${15 * 60 * 1000}|snooze 15m>`, short: true },
          //{ value: `<${SNOOZE_BASE_URL}&snooze=${60 * 60 * 1000}|snooze 1h>`, short: true },
          //{ value: `<${SNOOZE_BASE_URL}&snooze=${2 * 60 * 60 * 1000}|snooze 2h>`, short: true },
          //{ value: `<${SNOOZE_BASE_URL}&snooze=${six30Pm.getTime() - Date.now()}|snooze at 18.00 UTC>`, short: true },
          //{ value: `<${SNOOZE_BASE_URL}&snooze=${tomorrowMorning.getTime() - Date.now()}|snooze tomorrow at 09.00 UTC>`, short: true },
          //{ value: `<${SNOOZE_BASE_URL}&snooze=${nextMonday.getTime() - Date.now()}|snooze next monday at 09.00 UTC>`, short: true }
        //]
      //}]
    //});
  //}
//};

//const isValidReminder = async (reminder) => {
  //const { repo: orgAndRepo, issueNo, type, creationDate, enterprise } = reminder;
  //const [org, repo] = orgAndRepo.split('/');
  //const isValid = type === 'always' ||
    //await nobodyCommented({ org, repo, issueNo, enterprise })({ date: creationDate });
  //return isValid;
//};

//const checkReminders = async () => {
  //debug(`checking reminders every ${INTERVAL / 1000} seconds`);

  //const reminders = await db.all(`
    //SELECT issueNo, repo, userId, date, type, creationDate, enterprise
    //FROM github_reminders
    //WHERE date < ? AND date > ?`,
    //Date.now(), Date.now() - INTERVAL
  //);
  //debug('reminders found', { reminders });
  //reminders.forEach(async (reminder) => {
    //const isValid = await isValidReminder(reminder);
    //if (isValid) {
      //sendNotification(reminder);
    //}
  //});
//};

//const getReminders = ({ userId, issueNo, repo, enterprise }) => db.all(`
  //SELECT issueNo, repo, userId, date, type, creationDate, enterprise
  //FROM github_reminders
  //WHERE userId = ? AND date > ? AND issueNo = ? AND repo = ? AND enterprise = ?`,
  //userId, Date.now(), issueNo, repo, enterprise
//);

//const getAllReminders = () => db.all(`
  //SELECT *
  //FROM github_reminders
//`);

//const getRemindersOfUser = (userId) => db.all(`
  //SELECT *
  //FROM github_reminders
  //WHERE userId = ?`,
  //userId
//);

//app.post('/reminders', async ({ query, body, params }, res) => {
  //try {
    //debug({ query, body, params });
    //const { issueNo, repo, userId, date, type, enterprise } = query;
    //await insertReminder({ issueNo, repo, userId, date, type, enterprise });
    //const reminder = { issueNo, repo, userId, date, type, enterprise };
    //debug('Successfully inserted reminder', reminder);
    //res.json({ message: 'Success', reminders: [reminder] });
  //} catch (err) {
    //debug(err);
    //res.status(500).json({ err });
  //}
//});

//app.get('/reminders/snooze', async ({ query: { userId, issueNo, repo, enterprise, snooze, type } }, res) => {
  //debug('get reminders', { userId, issueNo, repo, enterprise });
  //try {
    //const date = Date.now() + parseInt(snooze);
    //await insertReminder({ issueNo, repo, userId, date, type, enterprise });
    //res.send(`
      //<body style='position: absolute; margin: 0; padding: 0; width: 100%; height: 100%; background: radial-gradient(#fff, #d0d0d0);'>
        //<div style='font-size: 128px; position: absolute; top: 50%; left: 50%; text-align: center; margin-top: -64px; margin-left: -84px'>🐘</div>
        //<div style='position: absolute; bottom: 20px; width: 100%; text-align: center; font: 48px sans-serif; font-weight: bold; color: green'>
          //The reminder was succesfully snoozed at ${new Date(date)}
        //</div>
      //</body>
    //`);
  //} catch (err) {
    //debug(err);
    //res.status(500).json({ err });
  //}
//});

//app.get('/reminders', async ({ query: { userId, issueNo, repo, enterprise } }, res) => {
  //debug('get reminders', { userId, issueNo, repo, enterprise });
  //try {
    //const allReminders = await getReminders({ userId, issueNo, repo, enterprise });
    //debug({ allReminders });
    //const filtered = await Promise.all(allReminders.map(await isValidReminder));
    //const reminders = allReminders.filter((r, index) => filtered[index]);
    //debug({ reminders });
    //res.json({ '🐘': 'Elephant', reminders });
  //} catch (err) {
    //debug(err);
    //res.status(500).json({ err });
  //}
//});

//const sortListedReminders = ({ date: r1 }, { date: r2 }) => (r1 > Date.now() && r2 > Date.now()) ? (r1 - r2) : (r2 - r1);

//const renderRemindersList = (reminders) => `
  //<body style='position: absolute; margin: 0; padding: 0; width: 100%; height: 100%; background: radial-gradient(#fff, #d0d0d0);'>
    //<table style='font-family: sans-serif; font-size: 20px'>
      //<th>Issue</th><th>User</th><th>Reminder Date</th><th>Creation Date</th>
      //${reminders.sort(sortListedReminders).map(({ issueNo, repo, enterprise, userId, date, creationDate }) => (`
        //<tr style='height: 40px; opacity: ${date < Date.now() ? .2 : 1}'>
          //<td style='padding-right: 40px;' >
            //<a href='${enterprise === 'true' ? GITHUB_ENTERPRISE : GITHUB}/${repo}/issues/${issueNo}'>${repo}/${issueNo}</a>
          //</td>
          //<td style='padding-right: 40px;' >
            //<a href='${enterprise === 'true' ? GITHUB_ENTERPRISE : GITHUB}/${userId}'>${userId}</a>
          //</td>
          //<td style='padding-right: 40px;' >
            //<strong>${new Date(date).toString().slice(0, -16)}</strong>
          //</td>
          //<td style='padding-right: 40px;' >
            //<small>${new Date(creationDate).toString().slice(0, -16)}</small>
          //</td>
        //</tr>
      //`)).join('')}
    //</table>
  //</body>
//`;

//app.get('/list', async (req, res) => {
  //try {
    //const reminders = await getAllReminders();
    //res.send(renderRemindersList(reminders));
  //} catch (err) {
    //debug(err);
    //res.status(500).json({ err });
  //}
//});

//app.get('/list/:userId', async ({ params }, res) => {
  //try {
    //debug({ params });
    //const reminders = await getRemindersOfUser(params.userId);
    //res.send(renderRemindersList(reminders));
  //} catch (err) {
    //debug(err);
    //res.status(500).json({ err });
  //}
//});

//app.get('/', async (req, res) => {
  //try {
    //res.send(`
      //<body style='position: absolute; margin: 0; padding: 0; width: 100%; height: 100%; background: radial-gradient(#fff, #d0d0d0);'>
        //<div style='font-size: 128px; position: absolute; top: 50%; left: 50%; text-align: center; margin-top: -64px; margin-left: -84px'>🐘</div>
        //<div style='position: absolute; bottom: 20px; width: 100%; text-align: center; font: 24px sans-serif; font-weight: bold;' >
          //All things elephant
        //</div>
      //</body>
    //`);
  //} catch (err) {
    //debug(err);
    //res.status(500).json({ err });
  //}
//});

//async function run() {
  //await db.open(config.db);
  //await createTables();
  //setInterval(checkReminders, INTERVAL);
//}

const postOnSlack = json => request({
  json,
  url: INCOMING_WEBHOOK_URL,
  method: 'POST'
});

postOnSlack({
  text: '@francesco says: "can you clean the dishes by tuesday at 3pm?" <http://buildo.io|yes>',
  channel: '@francesco',
  username: 'pledge',
  icon_emoji: ':dog:'
});

app.post('/newPledge', async ({ query, body, params }, res) => {
  try {
    debug({ query, body, params });
    //const { issueNo, repo, userId, date, type, enterprise } = query;
    //await insertReminder({ issueNo, repo, userId, date, type, enterprise });
    //const reminder = { issueNo, repo, userId, date, type, enterprise };
    res.json({ message: 'Success' });
  } catch (err) {
    debug(err);
    res.status(500).json({ err });
  }
});


app.listen(3000, () => {
  debug('listening on port 3000!');
  //run();
});
