import { expect } from 'chai'
import { hhmmToMinutesPastMidnight } from '../lib/utils.mjs'

describe('The utils class', () => {
  describe('The hhmmToMinutesPastMidnight function', () => {
    it('Should convert a HH:MM timestamp into the minutes past midnight', () => {
      expect(hhmmToMinutesPastMidnight('06:05')).to.equal(6 * 60 + 5)
      expect(hhmmToMinutesPastMidnight('24:00')).to.equal(1440)
      expect(hhmmToMinutesPastMidnight('25:00')).to.equal(1500)
    })
  })
})