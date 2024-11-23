import { expect } from 'chai'
import path from 'path'
import url from 'url'
import GTFSCalendar from '../lib/gtfs-parser/GTFSCalendar.mjs'
import GTFSRoute from '../lib/gtfs-parser/GTFSRoute.mjs'
import { TRANSIT_MODES } from '../lib/constants.mjs'
import GTFSTrip from '../lib/gtfs-parser/GTFSTrip.mjs'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('The GTFSTrip class', () => {
  it('Should process the skeleton trip data and populate the operation days', () => {
    let calendar = new GTFSCalendar({
      id: 'T1',
      startDay: '20241122',
      endDay: '20241129',
      daysOfWeek: ["0","0","0","0","1","1","0"]
    })

    // route_id,service_id,trip_id,shape_id,trip_headsign,direction_id,block_id
    // "6-452-mjp-1","T0_16","1.T0.6-452-mjp-1.1.H","6-452-mjp-1.1.H","Eynesbury","0",""
    let trip = new GTFSTrip({
      routeGTFSID: '6-452',
      calendar: calendar,
      id: '1.T0.6-452-mjp-1.1.H',
      shapeID: '6-452-mjp-1.1.H',
      headsign: 'Eynesbury',
      direction: '0',
      block: ''
    })

    expect(trip.operationDays).to.have.members([
      '20241122', '20241123', '20241129'
    ])
  })
})