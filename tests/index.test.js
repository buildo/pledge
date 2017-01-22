import request from 'supertest';
import app from '../src/app.js';

describe('app', () => {

  describe('slackCommand', () => {

    it('returns an error if Slack POST format is not respected', () => {
      return request(app).post('/slackCommand', { asdf: 'asdf' })
        .expect(422)
        .then((res) => {
          expect(typeof res.text).toBe('string');
          expect(res.text).toBe('command does not respect Slack POST format');
        });
    });

  });

});
