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

const routesFile = path.join(__dirname, 'sample-data', 'new-tram-2', 'routes.txt')
const stopsFile = path.join(__dirname, 'sample-data', 'new-tram-2', 'stops.txt')

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
      expect(stop.bays[0].stopNumber).to.equal('45')
    })

    it('Should clean up extra spaces', async () => {
      let database = new LokiDatabaseConnection('test-db')
      let stops = await database.createCollection('stops')

      let loader = new StopsLoader(stopsFile, suburbs, TRANSIT_MODES.tram, database)
      await loader.loadStops()

      let stop = await stops.findDocument({
        'stopName': 'Glen Huntly Railway Station/Glen Huntly Road'
      })

      expect(stop).to.not.be.null
      expect(stop.bays[0].stopNumber).to.equal('61')
      expect(stop.bays[0].originalName).to.equal('Glen Huntly Railway Station/Glen Huntly Rd #61')
    })

    it('Should remove half suburbs in the name', async () => {
      let database = new LokiDatabaseConnection('test-db')
      let stops = await database.createCollection('stops')

      let loader = new StopsLoader(stopsFile, suburbs, TRANSIT_MODES.tram, database)
      await loader.loadStops()

      let stop = await stops.findDocument({
        'stopName': 'Royal Melbourne Hospital-Parkville Railway Station/Royal Parade'
      })

      expect(stop).to.not.be.null
      expect(stop.bays[0].stopNumber).to.equal('10')
      expect(stop.bays[0].originalName).to.equal('Royal Melbourne Hospital-Parkville Station/Royal Pde #10')
    })
  })
})