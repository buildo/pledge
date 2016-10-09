import 'babel-core/register';
import 'babel-polyfill';
import express from 'express';
import request from 'request-promise';
import bodyParser from 'body-parser';
import _debug from 'debug';
import config from '../config.json';

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
      res.send('"Username" invalid. (@username [what] by [when])');
    } else if (!pledge) {
      res.send('"What" invalid. (@username [what] by [when])');
    } else if (!deadline) {
      res.send('"When" invalid. (@username [what] by [when])');
    }

    const requester = `@${user_name}`;

    postOnSlack({
      text: `${requester} added a pledge: "${pledge}"`,
      channel: performer,
      username: 'pledge',
      icon_emoji: ':dog:'
    });

    res.send(`Successfully added pledge: "${pledge}"`);
  } catch (err) {
    debug(err);
    res.status(500).json({ err });
  }
});

app.listen(3000);
