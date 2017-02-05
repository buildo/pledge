import express from 'express';
import config from '../config.json';
import bodyParser from 'body-parser';
import _debug from 'debug';
import human2date from 'date.js';
import { formatDate } from './utils';
import * as db from './db';
import * as slack from './slack';

const debug = _debug('pledge');

const credentials = {
  client: {
    id: config.slack.clientId,
    secret: config.slack.clientSecret
  },
  auth: {
    tokenHost: 'https://slack.com',
    tokenPath: '/api/oauth.access',
    authorizePath: '/oauth/authorize'
  }
};

const oauth2 = require('simple-oauth2').create(credentials);

async function newPledge({ text, requester }, botAccessToken) {
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
  const teamId = (await db.getTeamByBotAccessToken(botAccessToken)).teamId;
  await db.insertPledge({ teamId, requester, performer, content, deadline }).then(debug);

  await slack.postOnSlack({
    text: `${requester} asked you to "${content}" by ${humanReadableDeadline} (${formatDate(deadline)})`,
    channel: performer
  }, botAccessToken);

  return `You asked ${performer} to "${content}" by ${humanReadableDeadline} (${formatDate(deadline)})`;
}

async function getPledgesList(requester, botAccessToken) {
  const teamId = db.getTeamByBotAccessToken(botAccessToken).teamId;
  const { requests, pledges } = await db.getList(requester, teamId);

  const baseURL = config.domain;

  const myPledges = `*My pledges:*\n${pledges.map(p => `\n • ${p.content} _for ${p.requester}_ *by ${p.deadline}* <${baseURL}/deletePledge/${p.id}|delete> <${baseURL}/completePledge/${p.id}|complete>`)}`;
  const myRequests = `*My requests:*\n${requests.map(p => `\n • _${p.performer}_ pledged to ${p.content} *by ${p.deadline}* <${baseURL}/deletePledge/${p.id}|delete> <${baseURL}/completePledge/${p.id}|complete>`)}`;

  return `${myPledges}\n\n${myRequests}`;
}

export async function findNewNotifications() {
  // notify for pledges that have expired
  const expiredPledges = await db.findAllPledgesExpiredToNotify();
  expiredPledges.map(async p => {
    await slack.postOnSlackMultipleChannels({
      text: `pledge ${p.content} expired just now`
    }, [p.requester, p.performer], (await db.getTeam(p.teamId)).botAccessToken);
    await db.setExpiredNotificationAsSentOnPledge(p.id);
  });
}

setInterval(findNewNotifications, 60 * 1000);

// EXPRESS SERVER

const router = express.Router();

router.use(bodyParser.urlencoded({ extended: false }));

router.get('/callback', async (req, res) => {
  const code = req.query.code;
  const options = { code };

  oauth2.authorizationCode.getToken(options, async (error, result) => {
    if (error) {
      console.error('Access Token Error', error.message); // eslint-disable-line no-console
      return res.json('Authentication failed');
    }
    await db.insertTeam(result.team_id, result.team_name, result.bot.bot_user_id,
      result.bot.bot_access_token);
    return res
      .status(200)
      .send('You have successfully installed pledge ;-)');
  });
});

router.post('/slackCommand', async ({ body: { text, user_name, user_id, team_id } }, res) => {
  debug({ text, user_name });
  const requester = `@${user_name}`;

  if (typeof text === 'undefined' || typeof user_name === 'undefined') {
    return res.status(422).send('command does not respect Slack POST format');
  }

  const team = await db.getTeam(team_id);
  try {
    switch (text.trim()) {
      case 'list':
        return res.send(await getPledgesList(requester, team.botAccessToken));
      default:
        return res.send(await newPledge({ text, requester }, team.botAccessToken));
    }
  } catch (err) {
    debug(err);
    return res.send(`Error: ${err.message}`);
  }
});

router.get('/deletePledge/:pledgeId', async ({ params: { pledgeId } }, res) => {
  try {
    const { requester, performer, content } = await db.getPledge(pledgeId);
    await db.deletePledge(pledgeId);
    // notify on slack
    const notificationMessage = `pledge "${content}" has been deleted`;
    await slack.postOnSlackMultipleChannels({
      text: notificationMessage
    }, [requester, performer]);
    return res.send(`Successfully deleted pledge #${pledgeId}`);
  } catch (e) {
    return res.send(`Error: ${e.message}`);
  }
});

router.get('/completePledge/:pledgeId', async ({ params: { pledgeId } }, res) => {
  try {
    const { requester, performer, content } = await db.getPledge(pledgeId);
    await db.completePledge(pledgeId);
    // notify on slack
    const notificationMessage = `pledge "${content}" has been completed !!!`;
    await slack.postOnSlackMultipleChannels({
      text: notificationMessage
    }, [requester, performer]);
    return res.send(`Successfully completed pledge #${pledgeId}`);
  } catch (e) {
    return res.send(`Error: ${e.message}`);
  }
});

export default router;
