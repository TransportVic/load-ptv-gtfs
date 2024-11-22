import { CALENDAR_DATES } from '../constants.mjs'
import { parseDate, toGTFSDate } from '../utils.mjs'

export default class GTFSCalendar {

  id
  daysOfWeek
  startDay
  endDay

  #operationDays = []

  /**
   * Constructor to create a new GTFS Calendar object.
   * 
   * Note that `startDay` and `endDay` are both inclusive.
   *  
   * @param {Object} param0 The data as provided by the calendar.txt CSV entry
   * @param {string} param0.id The calendar ID
   * @param {string[]} param0.daysOfWeek An array containing the days of the week. This should be 1 to include the day in the interval and 0 to exclude it. Note that it starts on a Monday.
   * @param {string} param0.startDay The start day of the calendar interval (inclusive).
   * @param {string} param0.endDay The start day of the calendar interval (inclusive).
   */
  constructor({ id, daysOfWeek, startDay, endDay }) {
    this.id = id
    this.daysOfWeek = daysOfWeek.map(day => day === '1')
    this.startDay = parseDate(startDay)
    this.endDay = parseDate(endDay)

    this.#findOperationDays()
  }

  #findOperationDays() {
    let intervalSize = this.endDay.diff(this.startDay, 'day').get('day')

    for (let offset = 0; offset <= intervalSize; offset++) {
      let intervalDay = this.startDay.plus({ days: offset })
      let dayOfWeek = intervalDay.weekday - 1
      if (this.daysOfWeek[dayOfWeek]) this.#operationDays.push(intervalDay)
    }
  }

  getOperationDays() {
    return this.#operationDays.sort((a, b) => a - b).map(day => toGTFSDate(day)).filter((date, i, arr) => i === 0 || arr[i - 1] != date)
  }

  processCalendarDate(calendarDate) {
    if (calendarDate.id !== this.id) throw new Error('Calendar ID mismatch!')

    if (calendarDate.type === CALENDAR_DATES.ADDED) {
      this.#operationDays.push(calendarDate.date)
    } else if (calendarDate.type === CALENDAR_DATES.REMOVED) {
      let index = this.#operationDays.findIndex(day => day.equals(calendarDate.date))
      if (index >= 0) this.#operationDays.splice(index, 1)
    }
  }

}