import GTFSCalendarDate from '../GTFSCalendarDate.mjs'
import GTFSReader from './GTFSReader.mjs'

export default class GTFSCalendarDateReader extends GTFSReader {

  /**
   * Converts a CSV row into an operator object
   * 
   * @param {object} data A JSON object containing the following fields:
   * @param {string} data.id The calendar ID
   * @param {string} data.date The calendar date
   * @param {string} data.type The exception type
   * 
   * @returns {GTFSCalendarDate} An object representing the calendar date entry
   */
  processEntity(data) {
    let calendarDateData = {
      id: data.service_id,
      date: data.date,
      type: data.exception_type
    }

    return new GTFSCalendarDate(calendarDateData)
  }
}