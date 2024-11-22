import { expect } from 'chai'
import { parseDate, toGTFSDate } from '../lib/utils.mjs'

describe('The utils class', () => {
  describe('The parseDate function', () => {
    it('Should convert a GTFS date to a Melbourne timezoned date', () => {
      expect(parseDate('20241122').toUTC().toISO()).to.equal('2024-11-21T13:00:00.000Z')
    })
  })


  describe('The toGTFSDate function', () => {
    it('Should convert a Luxon date back into a GTFS date', () => {
      let date = parseDate('20241122')
      expect(toGTFSDate(date.plus({ day: 3 }))).to.equal('20241125')
    })
  })
})