import { LokiDatabaseConnection } from '@transportme/database'
import StopsLoader from '../lib/loader/StopsLoader.mjs'
import { TRANSIT_MODES } from '../lib/constants.mjs'
import path from 'path'
import url from 'url'
import { expect } from 'chai'
import suburbs from './sample-data/suburbs.json' with { type: 'json' }
import RouteLoader from '../lib/loader/RouteLoader.mjs'
import TripLoader from '../lib/loader/TripLoader.mjs'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const agencyFile = path.join(__dirname, 'sample-data', 'routes', 'agency.txt')

const calendarFile = path.join(__dirname, 'sample-data', 'new-metro-2', 'calendar.txt')
const calendarDatesFile = path.join(__dirname, 'sample-data', 'new-metro-2', 'calendar_dates.txt')

const routesFile = path.join(__dirname, 'sample-data', 'new-metro-2', 'routes.txt')

const stopTimesFile = path.join(__dirname, 'sample-data', 'new-metro-2', 'stop_times.txt')
const tripsFile = path.join(__dirname, 'sample-data', 'new-metro-2', 'trips.txt')
const stopsFile = path.join(__dirname, 'sample-data', 'new-metro-2', 'stops.txt')

describe('The GTFS Loaders with the new 230525 Metro data', () => {
  describe('The route loader', () => {
    it('Should convert the updated route ID format to the legacy format', async () => {
      let database = new LokiDatabaseConnection('test-db')
      let routes = await database.createCollection('routes')

      let routeLoader = new RouteLoader(routesFile, agencyFile, TRANSIT_MODES.metroTrain, database)
      await routeLoader.loadRoutes()

      let williamstown = await routes.findDocument({ routeGTFSID: '2-WIL' })

      expect(williamstown).to.exist
      expect(williamstown.routeName).to.equal('Williamstown')
    })
  })

  describe('The trip loader', () => {
    it('It identify a rail replacement bus trip and mark it as such', async () => {
      let database = new LokiDatabaseConnection('test-db')
      let stops = await database.createCollection('stops')
      let routes = await database.createCollection('routes')
      let trips = await database.createCollection('gtfs timetables')

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

      let trip = await trips.findDocument({ runID: 'BW000' })

      expect(trip).to.not.be.null
      expect(trip.tripID).to.equal('02-WIL-R-7-T6-BW000')
      expect(trip.shapeID).to.equal('2-WIL-R-vpt-7.1.R')
      expect(trip.routeGTFSID).to.equal('2-WIL')
      expect(trip.block).to.equal(null)
      expect(trip.isRailReplacementBus).to.be.true
      expect(trip.direction).to.equal('Up')

      expect(trip.stopTimings[0].stopName).to.equal('Williamstown Railway Station')
      expect(trip.stopTimings[0].platform).to.equal('RRB')

      expect(trip.stopTimings[3].stopName).to.equal('Newport Railway Station')
      expect(trip.stopTimings[3].platform).to.equal('RRB')
    })
  })
})