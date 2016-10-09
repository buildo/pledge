import 'babel-core/register';
import 'babel-polyfill';
import express from 'express';
import request from 'request-promise';
import bodyParser from 'body-parser';
import _debug from 'debug';
import human2date from 'date.js';
import config from '../config.json';

const INCOMING_WEBHOOK_URL = config.slack.incomingWebhookURL;

const debug = _debug('pledge');

const formatDate = date => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return `${date.getDate()} ${months[date.getMonth()]} at ${date.getHours()}:${date.getMinutes()}`;
};

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
      res.send('"Username" is missing. (@username [what] by [when])');
    } else if (!pledge) {
      res.send('"What" is missing. (@username [what] by [when])');
    } else if (!deadline) {
      res.send('"When" is missing. (@username [what] by [when])');
    }

    const parsedDeadline = human2date(deadline);

    if (parsedDeadline.getTime() < Date.now()) {
      res.send('"When" should be in the future');
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
    res.status(500).json({ err });
  }
});

app.listen(3000);
