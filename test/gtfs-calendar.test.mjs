import { expect } from 'chai'
import GTFSCalendarReader from '../lib/gtfs-parser/readers/GTFSCalendarReader.mjs'
import GTFScalendar from '../lib/gtfs-parser/GTFSCalendar.mjs'
import GTFScalendarDate from '../lib/gtfs-parser/GTFSCalendarDate.mjs'
import path from 'path'
import url from 'url'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const calendarFile = path.join(__dirname, 'sample-data', 'calendar', 'calendar.txt')

describe('The GTFSCalendar class', () => {
  it('Should accept the data fields given in the GTFS data', () => {
    let calendar = new GTFScalendar({
      id: 'T1',
      startDay: '20241122',
      endDay: '20241129',
      daysOfWeek: ["0","0","0","0","1","1","0"]
    })

    
  })
})