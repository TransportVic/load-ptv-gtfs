export default class GTFSCalendar {

  id
  daysOfWeek
  startDay
  endDay

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
    this.daysOfWeek = daysOfWeek
    this.startDay = startDay
    this.endDay = endDay
  }

}