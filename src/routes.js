import 'babel-core/register';
import 'babel-polyfill';
import express from 'express';
import request from 'request-promise';
import bodyParser from 'body-parser';
import _debug from 'debug';
import human2date from 'date.js';
import config from '../config.json';
import { formatDate } from './utils';
import * as db from './db';

const INCOMING_WEBHOOK_URL = config.slack.incomingWebhookURL;

const debug = _debug('pledge');

const postOnSlack = json => request({
  json: { username: 'pledge', icon_emoji: ':dog:', ...json },
  url: INCOMING_WEBHOOK_URL,
  method: 'POST'
});

const postOnSlackMultipleChannels =
  (json, channels) => Promise.all(channels.map(c => postOnSlack({ channel: c, ...json })));

async function newPledge({ text, requester }) {
  const [, performer, content, humanReadableDeadline] = /(@[a-zA-Z0-9]+) (.+) by (.+)/.exec(text.trim()) || [];

  if (!performer) {
    throw new Error('"Username" is missing. (@username [what] by [when])');
  } else if (!content) {
    throw new Error('"What" is missing. (@username [what] by [when])');
  } else if (!humanReadableDeadline) {
    throw new Error('"When" is missing. (@username [what] by [when])');
  }

  const deadline = human2date(humanReadableDeadline);

  if (deadline.getTime() < Date.now()) {
    throw new Error('"When" should be in the future');
  }

  await db.insertPledge({ requester, performer, content, deadline }).then(debug);

  await postOnSlack({
    text: `${requester} asked you to "${content}" by ${humanReadableDeadline} (${formatDate(deadline)})`,
    channel: performer
  });

  return `You asked ${performer} to "${content}" by ${humanReadableDeadline} (${formatDate(deadline)})`;
}

async function getPledgesList(requester) {
  const { requests, pledges } = await db.getList(requester);

  const baseURL = 'https://pledge.our.buildo.io';

  const myPledges = `*My pledges:*\n${pledges.map(p => `\n • ${p.content} _for ${p.requester}_ *by ${p.deadline}* <${baseURL}/deletePledge/${p.id}|delete> <${baseURL}/completePledge/${p.id}|complete>`)}`;
  const myRequests = `*My requests:*\n${requests.map(p => `\n • _${p.performer}_ pledged to ${p.content} *by ${p.deadline}* <${baseURL}/deletePledge/${p.id}|delete> <${baseURL}/completePledge/${p.id}|complete>`)}`;

  return `${myPledges}\n\n${myRequests}`;
}

async function findNewNotifications() {
  // notify for pledges that have expired
  const expiredPledges = await db.findAllPledgesExpiredToNotify();
  expiredPledges.map(async p => {
    await postOnSlackMultipleChannels({
      text: `pledge ${p.content} expired just now`
    }, [p.requester, p.performer]);
    await db.setExpiredNotificationAsSentOnPledge(p.id);
  });
}

setInterval(findNewNotifications, 60 * 1000);

// EXPRESS SERVER

const router = express.Router();

router.use(bodyParser.urlencoded({ extended: false }));

router.post('/slackCommand', async ({ body: { text, user_name } }, res) => {
  debug({ text, user_name });
  const requester = `@${user_name}`;

  if (typeof text === 'undefined' || typeof user_name === 'undefined') {
    res.status(422).send('command does not respect Slack POST format');
  }

  try {
    switch (text.trim()) {
      case 'list':
        return res.send(await getPledgesList(requester));
      default:
        return res.send(await newPledge({ text, requester }));
    }
  } catch (err) {
    debug(err);
    res.send(`Error: ${err.message}`);
  }
});

router.get('/deletePledge/:pledgeId', async ({ params: { pledgeId } }, res) => {
  try {
    const { requester, performer, content } = await db.getPledge(pledgeId);
    await db.deletePledge(pledgeId);
    // notify on slack
    const notificationMessage = `pledge "${content}" has been deleted`;
    await postOnSlack({
      text: notificationMessage,
      channel: performer
    });
    await postOnSlack({
      text: notificationMessage,
      channel: requester
    });
    res.send(`Successfully deleted pledge #${pledgeId}`);
  } catch (e) {
    res.send(`Error: ${e.message}`);
  }
});

router.get('/completePledge/:pledgeId', async ({ params: { pledgeId } }, res) => {
  try {
    const { requester, performer, content } = await db.getPledge(pledgeId);
    await db.completePledge(pledgeId);
    // notify on slack
    const notificationMessage = `pledge "${content}" has been completed !!!`;
    await postOnSlack({
      text: notificationMessage,
      channel: performer
    });
    await postOnSlack({
      text: notificationMessage,
      channel: requester
    });
    res.send(`Successfully completed pledge #${pledgeId}`);
  } catch (e) {
    res.send(`Error: ${e.message}`);
  }
});

export default router;
