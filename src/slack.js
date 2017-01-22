import request from 'request-promise';
import config from '../config.json';

const INCOMING_WEBHOOK_URL = config.slack.incomingWebhookURL;

export const postOnSlack = json => request({
  json: { username: 'pledge', icon_emoji: ':dog:', ...json },
  url: INCOMING_WEBHOOK_URL,
  method: 'POST'
});

export const postOnSlackMultipleChannels =
  (json, channels) => Promise.all(channels.map(c => postOnSlack({ channel: c, ...json })));
