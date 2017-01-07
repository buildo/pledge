import { formatDate } from '../src/utils';

describe('utils', () => {

  describe('formatDate', () => {

    it('formats date in \'DD MM at HH:mm\' format', () => {
      expect(formatDate(new Date(2016, 6, 5, 23, 40))).toBe('5 July at 23:40');
    });

    it('pads hours and minutes', () => {
      expect(formatDate(new Date(2016, 6, 5, 4, 3))).toBe('5 July at 04:03');
    });

  });

});
