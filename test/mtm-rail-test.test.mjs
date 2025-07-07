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

const agencyFile = path.join(__dirname, 'sample-data', 'mtm-rail', 'agency.txt')

const calendarFile = path.join(__dirname, 'sample-data', 'mtm-rail', 'calendar.txt')
const calendarDatesFile = path.join(__dirname, 'sample-data', 'mtm-rail', 'calendar_dates.txt')

const routesFile = path.join(__dirname, 'sample-data', 'mtm-rail', 'routes.txt')

const stopTimesFile = path.join(__dirname, 'sample-data', 'mtm-rail', 'stop_times.txt')
const tripsFile = path.join(__dirname, 'sample-data', 'mtm-rail', 'trips.txt')
const stopsFile = path.join(__dirname, 'sample-data', 'mtm-rail', 'stops.txt')

describe('The GTFS Loaders with the MTM Website Rail data', () => {
  describe('The route loader', () => {
    it('Should convert all route IDs into one 2-RRB route', async () => {
      let database = new LokiDatabaseConnection('test-db')
      let routes = await database.createCollection('gtfs-routes')

      let routeLoader = new RouteLoader(routesFile, agencyFile, TRANSIT_MODES.metroTrain, database)
      await routeLoader.loadRoutes()

      let railBus = await routes.findDocument({ routeGTFSID: '2-RRB' })

      expect(railBus).to.exist
      expect(railBus.routeName).to.equal('Rail Replacement Bus')
    })
  })

  describe('The trip loader', () => {
    it('Is able to ingest trip data', async () => {
      let database = new LokiDatabaseConnection('test-db')
      let stops = await database.createCollection('gtfs-stops')
      let routes = await database.createCollection('gtfs-routes')
      let trips = await database.createCollection('gtfs-gtfs timetables')

      let stopLoader = new StopsLoader(stopsFile, suburbs, TRANSIT_MODES.metroTrain, database, () => 'Suburb')
      await stopLoader.loadStops()

      let routeLoader = new RouteLoader(routesFile, agencyFile, TRANSIT_MODES.metroTrain, database)
      await routeLoader.loadRoutes()

      let routeIDMap = routeLoader.getRouteIDMap()

      let tripLoader = new TripLoader({
        tripsFile, stopTimesFile,
        calendarFile, calendarDatesFile: null
      }, TRANSIT_MODES.metroTrain, database)

      await tripLoader.loadTrips({ routeIDMap })

      let donricTrip = await trips.findDocument({
        operationDays: '20250616',
        origin: 'MoorabbinUP', // Note that Station Street gets parsed as the suburb
        departureTime: '24:13'
      })

      expect(donricTrip).to.not.be.null
      expect(donricTrip.tripID).to.equal('Mon - Wed_0416t91')
      expect(donricTrip.routeGTFSID).to.equal('2-RRB')
      expect(donricTrip.block).to.equal('DON604')
      expect(donricTrip.isRailReplacementBus).to.be.true

      expect(donricTrip.stopTimings[0].stopConditions.pickup).to.equal(0)

      let dysonsTrip = await trips.findDocument({
        operationDays: '20250616',
        origin: 'Werribee_Up',
        departureTime: '20:22'
      })

      expect(dysonsTrip).to.not.be.null
      expect(dysonsTrip.tripID).to.equal('46332')
      expect(dysonsTrip.routeGTFSID).to.equal('2-RRB')
      expect(dysonsTrip.block).to.equal('51')
      expect(dysonsTrip.isRailReplacementBus).to.be.true
    })
  })
})