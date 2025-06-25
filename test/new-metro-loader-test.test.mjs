import { LokiDatabaseConnection } from '@transportme/database'
import StopsLoader from '../lib/loader/StopsLoader.mjs'
import { TRANSIT_MODES } from '../lib/constants.mjs'
import path from 'path'
import url from 'url'
import { expect } from 'chai'
import suburbs from './sample-data/suburbs.json' with { type: 'json' }
import RouteLoader from '../lib/loader/RouteLoader.mjs'
import TripLoader from '../lib/loader/TripLoader.mjs'
import GTFSCalendar from '../lib/gtfs-parser/GTFSCalendar.mjs'
import { MetroTrip } from '../lib/gtfs-parser/GTFSTrip.mjs'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const agencyFile = path.join(__dirname, 'sample-data', 'routes', 'agency.txt')

const calendarFile = path.join(__dirname, 'sample-data', 'new-metro', 'calendar.txt')
const calendarDatesFile = path.join(__dirname, 'sample-data', 'new-metro', 'calendar_dates.txt')

const routesFile = path.join(__dirname, 'sample-data', 'new-metro', 'routes.txt')

const stopTimesFile = path.join(__dirname, 'sample-data', 'new-metro', 'stop_times.txt')
const tripsFile = path.join(__dirname, 'sample-data', 'new-metro', 'trips.txt')
const stopsFile = path.join(__dirname, 'sample-data', 'new-metro', 'stops.txt')

const simpleStopsFile = path.join(__dirname, 'sample-data', 'new-metro', 'simple_stop_test.txt')

describe('The GTFS Loaders with the new Metro data', () => {
  describe('The stop loader', () => {
    it('Should process the stops and add them to the database', async () => {
      let database = new LokiDatabaseConnection('test-db')
      let stops = await database.createCollection('gtfs-stops')

      let loader = new StopsLoader(simpleStopsFile, suburbs, TRANSIT_MODES.metroTrain, database)
      await loader.loadStops()

      let stop = await stops.findDocument({
        'stopName': 'Camberwell Railway Station'
      })

      expect(stop).to.not.be.null
    })

    it('Should label the individual platforms with their platform numbers', async () => {
      let database = new LokiDatabaseConnection('test-db')
      let stops = await database.createCollection('gtfs-stops')

      let loader = new StopsLoader(simpleStopsFile, suburbs, TRANSIT_MODES.metroTrain, database)
      await loader.loadStops()

      let stop = await stops.findDocument({
        'stopName': 'Camberwell Railway Station'
      })

      let platformIDs = ["11207", "11208", "11209"]
      let platforms = platformIDs.map(id => stop.bays.find(bay => bay.stopGTFSID === id))

      for (let i = 0; i < platformIDs.length; i++) {
        let platform = platforms[i]
        expect(platform).to.not.be.undefined
        expect(platforms[i].platform).to.equal((i + 1).toString())
      }
    })
  })

  describe('The route loader', () => {
    it('Should convert the updated route ID format to the legacy format', async () => {
      let database = new LokiDatabaseConnection('test-db')
      let routes = await database.createCollection('gtfs-routes')

      let routeLoader = new RouteLoader(routesFile, agencyFile, TRANSIT_MODES.metroTrain, database)
      await routeLoader.loadRoutes()

      let pakenham = await routes.findDocument({ routeName: 'Pakenham' })

      expect(pakenham).to.exist
      expect(pakenham.routeGTFSID).to.equal('2-PKM')
    })
  })

  describe('The trip loader', () => {
    it('It should accept trip IDs in the new format and extract the TDN from there', async () => {
      let database = new LokiDatabaseConnection('test-db')
      let stops = await database.createCollection('gtfs-stops')
      let routes = await database.createCollection('gtfs-routes')
      let trips = await database.createCollection('gtfs-gtfs timetables')

      let stopLoader = new StopsLoader(stopsFile, suburbs, TRANSIT_MODES.metroTrain, database)
      await stopLoader.loadStops()

      let routeLoader = new RouteLoader(routesFile, agencyFile, TRANSIT_MODES.metroTrain, database)
      await routeLoader.loadRoutes()

      let routeIDMap = routeLoader.getRouteIDMap()

      let tripLoader = new TripLoader({
        tripsFile, stopTimesFile,
        calendarFile, calendarDatesFile
      }, TRANSIT_MODES.metroTrain, database)

      await tripLoader.loadTrips({ routeIDMap })

      let trip = await trips.findDocument({ runID: 'C000' })

      expect(trip).to.not.be.null
      expect(trip.tripID).to.equal('02-PKM--12-T5-C000')
      expect(trip.shapeID).to.equal('2-PKM-vpt-12.20.R')
      expect(trip.routeGTFSID).to.equal('2-PKM')
      expect(trip.block).to.equal('3347')
      expect(trip.isRailReplacementBus).to.be.false
      expect(trip.direction).to.equal('Up')

      expect(trip.stopTimings[0].stopName).to.equal('East Pakenham Railway Station')
      expect(trip.stopTimings[0].platform).to.equal('1')

      expect(trip.stopTimings[22].stopName).to.equal('Richmond Railway Station')
      expect(trip.stopTimings[22].platform).to.equal('5')

      expect(trip.stopTimings[27].stopName).to.equal('Flinders Street Railway Station')
      expect(trip.stopTimings[27].platform).to.equal('7')

      let nextTrip = await trips.findDocument({ block: '3347', runID: { $ne: 'C000' } })
      expect(nextTrip.runID).to.equal('C005')
      expect(nextTrip.direction).to.equal('Down')
      expect(trip.isRailReplacementBus).to.be.false
      
      expect(nextTrip.stopTimings[0].stopName).to.equal('Flinders Street Railway Station')
      expect(nextTrip.stopTimings[0].platform).to.equal('7')
    })

    it('It identify a rail replacement bus trip and mark it as such', async () => {
      let database = new LokiDatabaseConnection('test-db')
      let stops = await database.createCollection('gtfs-stops')
      let routes = await database.createCollection('gtfs-routes')
      let trips = await database.createCollection('gtfs-gtfs timetables')

      let stopLoader = new StopsLoader(stopsFile, suburbs, TRANSIT_MODES.metroTrain, database)
      await stopLoader.loadStops()

      let routeLoader = new RouteLoader(routesFile, agencyFile, TRANSIT_MODES.metroTrain, database)
      await routeLoader.loadRoutes()

      let routeIDMap = routeLoader.getRouteIDMap()

      let tripLoader = new TripLoader({
        tripsFile, stopTimesFile,
        calendarFile, calendarDatesFile
      }, TRANSIT_MODES.metroTrain, database)

      await tripLoader.loadTrips({ routeIDMap })

      let trip = await trips.findDocument({ runID: 'BL000' })

      expect(trip).to.not.be.null
      expect(trip.tripID).to.equal('02-LIL--13-T5_w3-BL000')
      expect(trip.shapeID).to.equal('2-LIL-vpt-13.133.R')
      expect(trip.routeGTFSID).to.equal('2-LIL')
      expect(trip.block).to.equal(null)
      expect(trip.isRailReplacementBus).to.be.true
      expect(trip.direction).to.equal('Up')

      expect(trip.stopTimings[0].stopName).to.equal('Burnley Railway Station')
      expect(trip.stopTimings[0].platform).to.equal('RRB')

      expect(trip.stopTimings[3].stopName).to.equal('Parliament Railway Station')
      expect(trip.stopTimings[3].platform).to.equal('RRB')
    })

    it('Should wrap times past midnight back to 00:00 NEXT DAY in the trip times', async () => {
      let database = new LokiDatabaseConnection('test-db')
      let stops = await database.createCollection('gtfs-stops')
      let routes = await database.createCollection('gtfs-routes')
      let trips = await database.createCollection('gtfs-gtfs timetables')

      let stopLoader = new StopsLoader(stopsFile, suburbs, TRANSIT_MODES.metroTrain, database)
      await stopLoader.loadStops()

      let routeLoader = new RouteLoader(routesFile, agencyFile, TRANSIT_MODES.metroTrain, database)
      await routeLoader.loadRoutes()

      let routeIDMap = routeLoader.getRouteIDMap()

      let tripLoader = new TripLoader({
        tripsFile, stopTimesFile,
        calendarFile, calendarDatesFile
      }, TRANSIT_MODES.metroTrain, database)

      await tripLoader.loadTrips({ routeIDMap })

      let trip = await trips.findDocument({ runID: 'C999' })

      expect(trip).to.not.be.null
      expect(trip.departureTime).to.equal('23:59')
      expect(trip.destinationArrivalTime).to.equal('24:10')

      expect(trip.stopTimings[0].departureTime).to.equal('23:59')
      expect(trip.stopTimings[1].departureTime).to.equal('00:05')
      expect(trip.stopTimings[1].arrivalTime).to.equal('00:05')
      expect(trip.stopTimings[2].arrivalTime).to.equal('00:10')
    })
  })

  describe('The MetroTrip subclass', () => {
    it('Should detect rail buses', () => {
      let calendar = new GTFSCalendar({
        id: 'T1',
        startDay: '20241122',
        endDay: '20241129',
        daysOfWeek: ["0","0","0","0","1","1","0"]
      })

      expect(new MetroTrip({
        routeGTFSID: '2-PKM',
        calendar,
        id: '02-PKM--54-T6-C962',
        shapeID: '2-PKM-vpt-54.70.R',
        headsign: 'South Yarra',
        direction: '0',
        block: ''
      }).getTripData().isRailReplacementBus).to.be.false

      expect(new MetroTrip({
        routeGTFSID: '2-PKM',
        calendar,
        id: '02-PKM-R-6-T5_bp-BF400',
        shapeID: '2-PKM-R-vpt-6.7.R',
        headsign: 'South Yarra',
        direction: '0',
        block: ''
      }).getTripData().isRailReplacementBus).to.be.true

      expect(new MetroTrip({
        routeGTFSID: '2-PKM',
        calendar,
        id: '02-PKM-R-6-T5_bp-BF22',
        shapeID: '2-PKM-R-vpt-6.7.R',
        headsign: 'South Yarra',
        direction: '0',
        block: ''
      }).getTripData().isRailReplacementBus).to.be.true
    })
  })
})