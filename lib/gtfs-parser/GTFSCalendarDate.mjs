import { dateUtils } from '@transportme/transportvic-utils' 

export default class GTFSCalendarDate {

  id
  date
  type

  constructor({ id, date, type }) {
    this.id = id
    this.date = dateUtils.parseDate(date)
    this.type = type
  }

}