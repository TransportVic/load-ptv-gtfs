import { DateTime } from 'luxon'
import { TIMEZONES } from './constants.mjs'

// Note: Need to allow for SA time as PTV does not handle cross border times well... or at all
export function parseDate(date) {
  return DateTime.fromFormat(date, 'yyyyMMdd', { zone: TIMEZONES.melbourne })
}