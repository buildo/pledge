import request from 'supertest';
import app from '../src/app.js';
import * as db from '../src/db';
import del from 'del';
import MockDate from 'mockdate';
import { findNewNotifications } from '../src/routes';

jest.mock('../src/slack');
import * as slack from '../src/slack';
slack.postOnSlack.mockImplementation(() => Promise.resolve());
slack.postOnSlackMultipleChannels.mockImplementation(() => Promise.resolve());

const getList = () => {
  return request(app).post('/slackCommand')
    .send('user_name=requester')
    .send('text=list')
    .send('team_id=TEAM_ID')
    .expect(200);
};

const createPledge = (by) => {
  return request(app).post('/slackCommand')
    .send('user_name=requester')
    .send(`text=<@U123456789|performer> content by ${by}`)
    .send('team_id=TEAM_ID')
    .expect(200);
};

describe('app', () => {

  describe('slackCommand', () => {

    beforeEach(async () => {
      slack.postOnSlackMultipleChannels.mockClear();
      slack.postOnSlack.mockClear();
      await db.init(`db-${Math.random().toString(36).substr(2, 20)}`);
      await db.insertTeam('TEAM_ID', 'TEAM_NAME', 'BOT_USER_ID', 'BOT_ACCESS_TOKEN');
    });

    afterEach(async () => {
      await db.close();
    });

    afterAll(async () => {
      await del('db-*');
    });

    it('returns an error if Slack POST format is not respected', () => {
      return request(app).post('/slackCommand', { asdf: 'asdf' })
        .expect(422)
        .then((res) => {
          expect(typeof res.text).toBe('string');
          expect(res.text).toBe('command does not respect Slack POST format');
        });
    });

    it('list: shows an empty list of pledges with the list command', () => {
      return getList().then((res) => {
        expect(typeof res.text).toBe('string');
        // headers for lists are presents
        expect(res.text).toMatch('My pledges');
        expect(res.text).toMatch('My requests');
        // no pledge is present (empty lists)
        expect(res.text).not.toMatch('pledged to');
      });
    });

    it('create: notifies both immediately, appears in list', () => {
      MockDate.set(0);
      return createPledge('tomorrow at 10am').then((res) => {
        expect(typeof res.text).toBe('string');
        // notification for requester sent as response to slack command
        expect(res.text).toMatch('You asked @performer to \"content\" by tomorrow at 10am');
        // notification for performer
        expect(slack.postOnSlack.mock.calls[0][0].text)
          .toMatch('@requester asked you to \"content\" by tomorrow at 10am');
        expect(slack.postOnSlack.mock.calls[0][0].channel)
          .toMatch('U123456789');
        return getList().then((res) => {
          expect(typeof res.text).toBe('string');
          // pledge is present
          expect(res.text).toMatch('_@performer_ pledged to content *by 2 January at 10:00*');
        });
      });
    });

    it('expired: notifies both at the right time, stays in list', () => {
      const timezoneOffset = new Date().getTimezoneOffset();
      const interval = 10 * 60 * 60 * 1000; // 10 hours
      const adjInterval = interval + timezoneOffset * 60 * 1000;
      MockDate.set(0);
      return createPledge('today at 10am').then(async () => {
        // number of notifications sent to both performer and requester
        const nExp = () =>
          slack.postOnSlackMultipleChannels.mock.calls.filter((c) => {
            return c[0].text.match(/expired/) && c[1].includes('@performer')
              && c[1].includes('@requester') && c[1].length === 2;
          }).length;
        // just before, no notifications
        MockDate.set(adjInterval - 1);
        await findNewNotifications();
        expect(nExp()).toBe(0);
        // right after, it notifies
        MockDate.set(adjInterval + 1);
        await findNewNotifications();
        expect(nExp()).toBe(1);
        // after some time, does not notify twice
        MockDate.set(adjInterval + 999);
        await findNewNotifications();
        expect(nExp()).toBe(1);
        // check that it's still present in list
        return getList().then((res) => {
          // pledge is present
          expect(res.text).toMatch('_@performer_ pledged to content *by 1 January at 10:00*');
        });
      });
    });

    it('expired: does not notify for completed pledges', () => {
      const timezoneOffset = new Date().getTimezoneOffset();
      const interval = 10 * 60 * 60 * 1000; // 10 hours
      const adjInterval = interval + timezoneOffset * 60 * 1000;
      MockDate.set(0);
      return createPledge('today at 10am').then(async () => {
        return request(app).get('/completePledge/1').expect(200).then(async () => {
          const nExp = () =>
            slack.postOnSlackMultipleChannels.mock.calls.filter((c) => {
              return c[0].text.match(/expired/) && c[1].includes('@performer')
                && c[1].includes('@requester') && c[1].length === 2;
            }).length;
          // after some time, no notification ever arrived
          MockDate.set(adjInterval + 999);
          await findNewNotifications();
          expect(nExp()).toBe(0);
        });
      });
    });

    it('expired: does not notify for deleted pledges', () => {
      const timezoneOffset = new Date().getTimezoneOffset();
      const interval = 10 * 60 * 60 * 1000; // 10 hours
      const adjInterval = interval + timezoneOffset * 60 * 1000;
      MockDate.set(0);
      return createPledge('today at 10am').then(async () => {
        return request(app).get('/deletePledge/1').expect(200).then(async () => {
          const nExp = () =>
            slack.postOnSlackMultipleChannels.mock.calls.filter((c) => {
              return c[0].text.match(/expired/) && c[1].includes('@performer')
                && c[1].includes('@requester') && c[1].length === 2;
            }).length;
          // after some time, no notification ever arrived
          MockDate.set(adjInterval + 999);
          await findNewNotifications();
          expect(nExp()).toBe(0);
        });
      });
    });

    it('delete: notifies both immediately, disappears from list', () => {
      MockDate.set(0);
      // create a pledge
      return createPledge('tomorrow at 10am').then(() => {
        return getList().then((res) => {
          // pledge is present in list
          expect(res.text).toMatch('_@performer_ pledged to content *by 2 January at 10:00*');
          // delete the pledge
          return request(app).get('/deletePledge/1').expect(200).then((res) => {
            expect(res.text).toEqual('Successfully deleted pledge #1');
            // notifications are sent
            expect(slack.postOnSlackMultipleChannels.mock.calls
              .filter((x) => x[0].text.match('has been deleted'))[0]).toEqual([
                { text: 'pledge "content" has been deleted' },
                ['@requester', '@performer']
              ]);
            return getList().then((res) => {
              // pledge is not in list any more
              expect(res.text).not.toMatch('_@performer_ pledged to content *by 2 January at 10:00*');
            });
          });
        });
      });
    });

    it('complete: notifies both immediately, disappears from list', () => {
      MockDate.set(0);
      // create a pledge
      return createPledge('tomorrow at 10am').then(() => {
        return getList().then((res) => {
          // pledge is present in list
          expect(res.text).toMatch('_@performer_ pledged to content *by 2 January at 10:00*');
          // delete the pledge
          return request(app).get('/completePledge/1').expect(200).then((res) => {
            expect(res.text).toEqual('Successfully completed pledge #1');
            // notifications are sent
            expect(slack.postOnSlackMultipleChannels.mock.calls
              .filter((x) => x[0].text.match('has been completed'))[0]).toEqual([
                { text: 'pledge "content" has been completed !!!' },
                ['@requester', '@performer']
              ]);
            return getList().then((res) => {
              // pledge is not in list any more
              expect(res.text).not.toMatch('_@performer_ pledged to content *by 2 January at 10:00*');
            });
          });
        });
      });
    });

    it('complete: notifies both immediately, even if expired', () => {
      MockDate.set(0);
      const timezoneOffset = new Date().getTimezoneOffset();
      const interval = 10 * 60 * 60 * 1000; // 10 hours
      const adjInterval = interval + timezoneOffset * 60 * 1000;
      // create a pledge
      return createPledge('today at 10am').then(async () => {
        // let it expire
        MockDate.set(adjInterval + 999);
        await findNewNotifications();
        // complete the pledge
        return request(app).get('/completePledge/1').expect(200).then((res) => {
          expect(res.text).toEqual('Successfully completed pledge #1');
          // notifications are sent
          expect(slack.postOnSlackMultipleChannels.mock.calls
            .filter((x) => x[0].text.match('has been completed'))[0]).toEqual([
              { text: 'pledge "content" has been completed !!!' },
              ['@requester', '@performer']
            ]);
        });
      });
    });

  });
});
