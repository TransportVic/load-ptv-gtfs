import { expect } from 'chai'
import { parseDate } from '../lib/utils.mjs'

describe('The utils class', () => {
  describe('The parseDate function', () => {
    it('Should convert a GTFS date to a Melbourne timezoned date', () => {
      expect(parseDate('20241122').toUTC().toISO()).to.equal('2024-11-21T13:00:00.000Z')
    })
  })
})