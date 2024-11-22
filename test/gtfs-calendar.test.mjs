import { expect } from 'chai'
import GTFSCalendarReader from '../lib/gtfs-parser/readers/GTFSCalendarReader.mjs'
import GTFScalendar from '../lib/gtfs-parser/GTFSCalendar.mjs'
import GTFSCalendarDate from '../lib/gtfs-parser/GTFSCalendarDate.mjs'
import path from 'path'
import url from 'url'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const calendarFile = path.join(__dirname, 'sample-data', 'calendar', 'calendar.txt')

describe('The GTFSCalendar class', () => {
  it('Should process the calendar data to a list of operation days', () => {
    expect(new GTFScalendar({
      id: 'T1',
      startDay: '20241122',
      endDay: '20241129',
      daysOfWeek: ["0","0","0","0","1","1","0"]
    }).getOperationDays()).to.have.members([
      "20241122", "20241123", "20241129"
    ])

    expect(new GTFScalendar({
      id: 'T2',
      startDay: '20241123',
      endDay: '20241130',
      daysOfWeek: ["1","1","1","1","1","0","0"]
    }).getOperationDays()).to.have.members([
      "20241125", "20241126", "20241127", "20241128", "20241129"
    ])
  })

  it('Be inclusive of the end date', () => {
    expect(new GTFScalendar({
      id: 'T1',
      startDay: '20241122',
      endDay: '20241122',
      daysOfWeek: ["1","1","1","1","1","1","1"]
    }).getOperationDays()).to.have.members([
      "20241122"
    ])
  })
})