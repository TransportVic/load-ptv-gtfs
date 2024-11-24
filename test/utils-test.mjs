import { expect } from 'chai'
import { hhmmToMinutesPastMidnight, parseDate, toGTFSDate } from '../lib/utils.mjs'

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

  describe('The hhmmToMinutesPastMidnight function', () => {
    it('Should convert a HH:MM timestamp into the minutes past midnight', () => {
      expect(hhmmToMinutesPastMidnight('06:05')).to.equal(6 * 60 + 5)
      expect(hhmmToMinutesPastMidnight('24:00')).to.equal(1440)
      expect(hhmmToMinutesPastMidnight('25:00')).to.equal(1500)
    })
  })
})