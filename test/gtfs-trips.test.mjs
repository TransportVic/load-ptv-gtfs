import { expect } from 'chai'
import path from 'path'
import url from 'url'
import GTFSCalendar from '../lib/gtfs-parser/GTFSCalendar.mjs'
import GTFSRoute from '../lib/gtfs-parser/GTFSRoute.mjs'
import { TRANSIT_MODES } from '../lib/constants.mjs'
import GTFSTrip from '../lib/gtfs-parser/GTFSTrip.mjs'
import GTFSTripReader from '../lib/gtfs-parser/readers/GTFSTripReader.mjs'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const tripsFile = path.join(__dirname, 'sample-data', 'trips', 'trips.txt')

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

describe('The GTFSTripReader class', () => {
  it('Should read the trips.txt file and return a GTFSTrip object', async () => {
    let calendars = {
      'T2_2': new GTFSCalendar({
        id: 'T2_2',
        startDay: '20241122',
        endDay: '20241122',
        daysOfWeek: ["0","0","0","0","1","0","0"]
      })
    }

    let reader = new GTFSTripReader(tripsFile)
    await reader.open()

    let trip = await reader.getNextEntity()

    expect(trip.tripID).to.equal('1.T2.2-ALM-vpt-1.1.R')
    expect(trip.routeID).to.equal('2-ALM-vpt-1')
    expect(trip.headsign).to.equal('Camberwell')
    expect(trip.operationDays).to.deep.equal(['20241122'])
  })
})