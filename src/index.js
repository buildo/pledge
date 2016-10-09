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
  json,
  url: INCOMING_WEBHOOK_URL,
  method: 'POST'
});

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
    text: `${requester} added a pledge: "${content} by ${humanReadableDeadline} (${formatDate(deadline)})"`,
    channel: performer,
    username: 'pledge',
    icon_emoji: ':dog:'
  });

  return `Successfully added pledge: "${content} by ${humanReadableDeadline} (${formatDate(deadline)})"`;
}

async function getPledgesList(requester) {
  const { requests, pledges } = await db.getList(requester);

  const myPledges = `*My pledges:*\n${pledges.map(p => `\n • ${p.content} _for ${p.requester}_ *by ${p.deadline}*`)}`;
  const myRequests = `*My requests:*\n${requests.map(p => `\n • _${p.performer}_ pledged to ${p.content} *by ${p.deadline}*`)}`;

  return `${myPledges}\n\n${myRequests}`;
}

// EXPRESS SERVER

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));

app.post('/slackCommand', async ({ body: { text, user_name } }, res) => {
  debug({ text, user_name });
  const requester = `@${user_name}`;

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

app.listen(3000, db.init);
