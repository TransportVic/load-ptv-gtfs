import { expect } from 'chai'
import path from 'path'
import url from 'url'
import GTFSCalendar from '../lib/gtfs-parser/GTFSCalendar.mjs'
import GTFSTrip, { SmartrakTrip } from '../lib/gtfs-parser/GTFSTrip.mjs'
import GTFSTripReader from '../lib/gtfs-parser/readers/GTFSTripReader.mjs'
import { TRANSIT_MODES } from '../lib/constants.mjs'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const tripsFile = path.join(__dirname, 'sample-data', 'trips', 'trips.txt')
const busTripsFile = path.join(__dirname, 'sample-data', 'trips', 'bus_trips.txt')

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

    expect(trip.getOperationDays()).to.have.members([
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

    let routeMappings = { '2-ALM-vpt-1': '2-ALM' }

    let reader = new GTFSTripReader(tripsFile, calendars, routeMappings, TRANSIT_MODES.metroTrain)
    await reader.open()

    let trip = await reader.getNextEntity()

    expect(trip.getTripID()).to.equal('1.T2.2-ALM-vpt-1.1.R')
    expect(trip.getRouteGTFSID()).to.equal('2-ALM')
    expect(trip.getHeadsign()).to.equal('Camberwell')
    expect(trip.getOperationDays()).to.deep.equal(['20241122'])
  })

  it('Should return a Smartrak bus trip instance where appropriate', async () => {
    let calendars = {
      'T2_2': new GTFSCalendar({
        id: 'T2_2',
        startDay: '20241122',
        endDay: '20241122',
        daysOfWeek: ["0","0","0","0","1","0","0"]
      })
    }

    let routeMappings = { '43-490-aus-1': '4-490', '6-wr9-mjp-1': '6-wr9' }

    let reader = new GTFSTripReader(busTripsFile, calendars, routeMappings, TRANSIT_MODES.bus)
    await reader.open()

    let trip = await reader.getNextEntity()

    expect(trip).to.be.instanceOf(SmartrakTrip)
    expect(trip.getTripID()).to.equal('43-490--1-MF4-1111914')
    expect(trip.getRouteGTFSID()).to.equal('4-490')
    expect(trip.getDepotID()).to.equal(43)

    trip = await reader.getNextEntity()

    expect(trip).to.not.be.instanceOf(SmartrakTrip)
    expect(trip.getTripID()).to.equal('5.T3.6-wr9-mjp-1.2.R')
    expect(trip.getRouteGTFSID()).to.equal('6-wr9')

    // EXPERIMENTAL DATA:
    trip = await reader.getNextEntity()

    expect(trip).to.be.instanceOf(SmartrakTrip)
    expect(trip.getTripID()).to.equal('58-G01--1-MF1-9942214')
    expect(trip.getDepotID()).to.equal(58)
    // expect(trip.getRouteGTFSID()).to.equal('6-G01') // Not entirely sure how to handle duplicates

    trip = await reader.getNextEntity()

    expect(trip).to.be.instanceOf(SmartrakTrip)
    expect(trip.getTripID()).to.equal('57-83--1-MF2-57586310')
    expect(trip.getDepotID()).to.equal(57)
    // expect(trip.getRouteGTFSID()).to.equal('6-083')
  })
})