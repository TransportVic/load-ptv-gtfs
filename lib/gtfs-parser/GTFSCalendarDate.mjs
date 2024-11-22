import { parseDate } from '../utils.mjs'

export default class GTFSCalendarDate {

  id
  date
  type

  constructor({ id, date, type }) {
    this.id = id
    this.date = parseDate(date)
    this.type = type
  }

}