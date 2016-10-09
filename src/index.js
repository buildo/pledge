import 'babel-core/register';
import 'babel-polyfill';
import express from 'express';
import request from 'request-promise';
import bodyParser from 'body-parser';
import _debug from 'debug';
import human2date from 'date.js';
import config from '../config.json';
import { formatDate } from './utils';

const INCOMING_WEBHOOK_URL = config.slack.incomingWebhookURL;

const debug = _debug('pledge');

const postOnSlack = json => request({
  json,
  url: INCOMING_WEBHOOK_URL,
  method: 'POST'
});

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));

app.post('/newPledge', async ({ body: { text, user_name } }, res) => {
  try {
    debug({ text, user_name });
    const [, performer, pledge, deadline] = /(@[a-zA-Z0-9]+) (.+) by (.+)/.exec(text.trim()) || [];

    if (!performer) {
      throw new Error('"Username" is missing. (@username [what] by [when])');
    } else if (!pledge) {
      throw new Error('"What" is missing. (@username [what] by [when])');
    } else if (!deadline) {
      throw new Error('"When" is missing. (@username [what] by [when])');
    }

    const parsedDeadline = human2date(deadline);

    if (parsedDeadline.getTime() < Date.now()) {
      throw new Error('"When" should be in the future');
    }

    const requester = `@${user_name}`;

    postOnSlack({
      text: `${requester} added a pledge: "${pledge} by ${deadline} (${formatDate(parsedDeadline)})"`,
      channel: performer,
      username: 'pledge',
      icon_emoji: ':dog:'
    });

    res.send(`Successfully added pledge: "${pledge} by ${deadline} (${formatDate(parsedDeadline)})"`);
  } catch (err) {
    debug(err);
    res.send(`Error: ${err.message}`);
  }
});

app.listen(3000);
