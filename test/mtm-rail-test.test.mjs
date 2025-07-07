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
})