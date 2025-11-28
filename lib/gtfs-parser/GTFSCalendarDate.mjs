import { dateUtils } from '@transportme/transportvic-utils' 

export default class GTFSCalendarDate {

  id
  date
  rawDate
  type

  constructor({ id, date, type }) {
    this.id = id
    this.rawDate = date
    this.date = dateUtils.parseDate(date)
    this.type = type
  }

}