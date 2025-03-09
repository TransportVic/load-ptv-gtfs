import { LokiDatabaseConnection } from '@transportme/database'
import StopsLoader from '../lib/loader/StopsLoader.mjs'
import { TRANSIT_MODES } from '../lib/constants.mjs'
import path from 'path'
import url from 'url'
import { expect } from 'chai'
import suburbs from './sample-data/suburbs.json' with { type: 'json' }
import RouteLoader from '../lib/loader/RouteLoader.mjs'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const agencyFile = path.join(__dirname, 'sample-data', 'routes', 'agency.txt')

const routesFile = path.join(__dirname, 'sample-data', 'new-tram', 'routes.txt')
const stopsFile = path.join(__dirname, 'sample-data', 'new-tram', 'stops.txt')

describe('The GTFS Loaders with the new Tram data', () => {
  describe('The stop loader', () => {
    it('Should process the stops and add them to the database', async () => {
      let database = new LokiDatabaseConnection('test-db')
      let stops = await database.createCollection('stops')

      let loader = new StopsLoader(stopsFile, suburbs, TRANSIT_MODES.tram, database)
      await loader.loadStops()

      let stop = await stops.findDocument({
        'stopName': 'Glenferrie Road/Wattletree Road'
      })

      expect(stop).to.not.be.null
    })
  })

  describe('The route loader', () => {
    it('Should convert the updated route ID format to the legacy format', async () => {
      let database = new LokiDatabaseConnection('test-db')
      let routes = await database.createCollection('routes')

      let routeLoader = new RouteLoader(routesFile, agencyFile, TRANSIT_MODES.tram, database)
      await routeLoader.loadRoutes()

      let pakenham = await routes.findDocument({ routeNumber: '109' })

      expect(pakenham).to.exist
      expect(pakenham.routeGTFSID).to.equal('3-109')
    })
  })
})