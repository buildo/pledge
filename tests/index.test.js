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

describe('app', () => {

  describe('slackCommand', () => {

    beforeEach(async () => {
      await db.init(`db-${Math.random().toString(36).substr(2, 20)}`);
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

    it('shows an empty list of pledges with the list command', () => {
      return request(app).post('/slackCommand')
        .send('user_name=luca')
        .send('text=list')
        .expect(200)
        .then((res) => {
          expect(typeof res.text).toBe('string');
          // headers for lists are presents
          expect(res.text).toMatch('My pledges');
          expect(res.text).toMatch('My requests');
          // no pledge is present (empty lists)
          expect(res.text).not.toMatch('pledged to');
        });
    });

    it('notifies both requester and performer when a pledge is created', () => {
      return request(app).post('/slackCommand')
        .send('user_name=requester')
        .send('text=@performer pledge content by tomorrow')
        .expect(200)
        .then((res) => {
          expect(typeof res.text).toBe('string');
          // notification for requester sent as response to slack command
          expect(res.text).toMatch('You asked @performer to \"pledge content\" by tomorrow');
          // notification for performer
          expect(slack.postOnSlack.mock.calls[0][0].text)
            .toMatch('@requester asked you to \"pledge content\" by tomorrow');
          expect(slack.postOnSlack.mock.calls[0][0].channel)
            .toMatch('@performer');
        });
    });

    fit('notifies both requester and performer when a pledge has expired', () => {
      MockDate.set(0, 0);
      return request(app).post('/slackCommand')
        .send('user_name=requester')
        .send('text=@performer pledge content by today at 10am')
        .expect(200)
        .then(async () => {
          const nExp = () =>
            slack.postOnSlackMultipleChannels.mock.calls.filter((c) => c[0].text.match(/expired/)).length;
          // just before, no notifications
          MockDate.set(32400000 + 0);
          await findNewNotifications();
          expect(nExp()).toBe(0);
          // right after, it notifies
          MockDate.set(32400000 + 1);
          await findNewNotifications();
          expect(nExp()).toBe(1);
          // after some time, does not notify twice
          MockDate.set(32400000 + 999);
          await findNewNotifications();
          expect(nExp()).toBe(1);
        });
    });

  });

});
