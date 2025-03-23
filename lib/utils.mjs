import { DateTime } from 'luxon'
import { TIMEZONES } from './constants.mjs'

// Note: Need to allow for SA time as PTV does not handle cross border times well... or at all
export function parseDate(date) {
  return DateTime.fromFormat(date, 'yyyyMMdd', { zone: TIMEZONES.melbourne })
}

export function toGTFSDate(date) {
  return date.toFormat('yyyyMMdd')
}

export function minutesPastMidnightToHHMM(time) {
  let hours = Math.floor(time / 60)
  let min = time % 60
  
  return `${hours < 10 ? '0' : ''}${hours}:${min < 10 ? '0' : ''}${min}`
}

export function minutesPastMidnightToHHMMWrap(time) {
  return minutesPastMidnightToHHMM(time % 1440)
}

export function hhmmToMinutesPastMidnight(date) {
  let [ hours, minutes, seconds ] = date.split(':')
  return parseInt(minutes) + parseInt(hours) * 60
}