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

const routesFile = path.join(__dirname, 'sample-data', 'new-metro', 'routes.txt')

const stopTimesFile = path.join(__dirname, 'sample-data', 'new-metro', 'stop_times.txt')
const tripsFile = path.join(__dirname, 'sample-data', 'new-metro', 'trips.txt')

const stopsFile = path.join(__dirname, 'sample-data', 'new-metro', 'simple_stop_test.txt')

describe('The GTFS Loaders with the new Metro data', () => {
  describe('The stop loader', () => {
    it('Should process the stops and add them to the database', async () => {
      let database = new LokiDatabaseConnection('test-db')
      let stops = await database.createCollection('stops')

      let loader = new StopsLoader(stopsFile, suburbs, TRANSIT_MODES.metroTrain, database)
      await loader.loadStops()

      let stop = await stops.findDocument({
        'stopName': 'Camberwell Railway Station'
      })

      expect(stop).to.not.be.null
    })

    it('Should label the individual platforms with their platform numbers', async () => {
      let database = new LokiDatabaseConnection('test-db')
      let stops = await database.createCollection('stops')

      let loader = new StopsLoader(stopsFile, suburbs, TRANSIT_MODES.metroTrain, database)
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
      let routes = await database.createCollection('routes')

      let routeLoader = new RouteLoader(routesFile, agencyFile, TRANSIT_MODES.metroTrain, database)
      await routeLoader.loadRoutes()

      let pakenham = await routes.findDocument({ routeName: 'Pakenham' })

      expect(pakenham).to.exist
      expect(pakenham.routeGTFSID).to.equal('2-PKM')
    })
  })

  describe('The trip loader', () => {
    return
    it('It should accept trip IDs in the new format and extract the TDN from there', async () => {
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
        tripsFile: tripsFile, stopTimesFile: stopTimesFile,
        calendarFile, calendarDatesFile
      }, TRANSIT_MODES.metroTrain, database)
      
      await tripLoader.loadTrips({ routeIDMap })

      let trip = await trips.findDocument({ tripID: '02-ALM--1-T2-2302' })

      expect(trip).to.not.be.null
      expect(trip.runID).to.equal('2302')
    })
  })
})