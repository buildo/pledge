import request from 'supertest';
import app from '../src/app.js';
import * as db from '../src/db';

jest.mock('../src/slack');
import * as slack from '../src/slack';
slack.postOnSlack.mockImplementation(() => {return Promise.resolve();});

describe('app', () => {

  describe('slackCommand', () => {

    beforeEach(async () => {
      await db.init();
      await db.clean();
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


  });

});
