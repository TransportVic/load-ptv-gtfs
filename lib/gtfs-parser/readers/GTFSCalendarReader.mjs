import GTFSCalendar from '../GTFSCalendar.mjs'
import GTFSCalendarDateReader from './GTFSCalendarDatesReader.mjs'
import GTFSReader from './GTFSReader.mjs'

export default class GTFSCalendarReader extends GTFSReader {

  #calendarDateFile
  #calendarDates = {}

  /**
   * Constructs a new GTFS Calendar reader.
   * 
   * @param {string} calendarFile The path to the GTFS Calendar file
   * @param {string} calendarDateFile The path to the GTFS Calendar Dates file
   */
  constructor(calendarFile, calendarDateFile) {
    super(calendarFile)
    this.#calendarDateFile = calendarDateFile
  }

  async open() {
    await super.open()

    if (!this.#calendarDateFile) return
    let calendarDateReader = new GTFSCalendarDateReader(this.#calendarDateFile)
    await calendarDateReader.open()
    while (calendarDateReader.available()) {
      let calendarDate = await calendarDateReader.getNextEntity()
      if (!this.#calendarDates[calendarDate.id]) this.#calendarDates[calendarDate.id] = []
      this.#calendarDates[calendarDate.id].push(calendarDate)
    }
  }

  /**
   * Converts a CSV row into a calendar object
   * 
   * @param {object} data A JSON object containing the following fields:
   * @param {string} data.id The calendar ID
   * @param {string} data.monday Indicates if a service will operate on a Monday within the given date range. "1" for operating and "0" for not operating.
   * @param {string} data.tuesday Same as data.monday but for Tuesday
   * @param {string} data.wednesday Same as data.monday but for Wednesday
   * @param {string} data.thursday Same as data.monday but for Thursday
   * @param {string} data.friday Same as data.monday but for Friday
   * @param {string} data.saturday Same as data.monday but for Saturday
   * @param {string} data.sunday Same as data.monday but for Sunday
   * @param {string} data.startDay The start day of the calendar interval (inclusive).
   * @param {string} data.endDay The end day of the calendar interval (inclusive).
   * 
   * @returns {GTFSCalendar} An object representing the operator data
   */
  processEntity(data) {
    let calendarData = {
      id: data.service_id,
      daysOfWeek: [
        data.monday, data.tuesday, data.wednesday, data.thursday,
        data.friday, data.saturday, data.sunday
      ],
      startDay: data.start_date,
      endDay: data.end_date
    }

    return new GTFSCalendar(calendarData, this.#calendarDates[data.service_id])
  }
}