import { expect } from 'chai'
import path from 'path'
import url from 'url'
import { TRANSIT_MODES } from '../lib/constants.mjs'
import { LokiDatabaseConnection } from '@transportme/database'
import StopsLoader from '../lib/loader/StopsLoader.mjs'
import RouteLoader from '../lib/loader/RouteLoader.mjs'
import TripLoader from '../lib/loader/TripLoader.mjs'
import ShapeLoader from '../lib/loader/ShapeLoader.mjs'
import setRouteStops from '../lib/post-processing/set-route-stops.mjs'
import suburbs from './sample-data/suburbs.json' with { type: 'json' }

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const routesFile = path.join(__dirname, 'sample-data', 'routes', 'metro_lines.txt')
const agencyFile = path.join(__dirname, 'sample-data', 'routes', 'agency.txt')

const calendarFile = path.join(__dirname, 'sample-data', 'calendar', 'calendar.txt')
const calendarDatesFile = path.join(__dirname, 'sample-data', 'calendar', 'calendar_dates.txt')

const stopsFile = path.join(__dirname, 'sample-data', 'merge', 'stops.txt')
const stopTimesFile = path.join(__dirname, 'sample-data', 'merge', 'stop_times.txt')
const tripsFile = path.join(__dirname, 'sample-data', 'merge', 'trips.txt')
const shapeFile = path.join(__dirname, 'sample-data', 'merge', 'shapes.txt')

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
let shapeIDMap = tripLoader.getShapeIDMap()
let directionIDMap = tripLoader.getDirectionIDMap()

let shapeLoader = new ShapeLoader(shapeFile, database)

await shapeLoader.loadShapes({ shapeIDMap })

await setRouteStops(database, directionIDMap)

describe('The GTFS Route stop merger', () => {
  describe('When processing Metro routes', () => {
    it('Should set Up trips to be City-bound', async () => {
      let pakenhamRoute = await routes.findDocument({ routeGTFSID: '2-PKM' })
      expect(pakenhamRoute).to.not.be.null
      
      let city = pakenhamRoute.directions.find(dir => dir.directionName === 'City')
      expect(city).to.not.be.undefined
      expect(city.stops[0].stopName).to.equal('East Pakenham Railway Station')
      expect(city.stops[city.stops.length - 2].stopName).to.equal('Southern Cross Railway Station')
      expect(city.stops[city.stops.length - 1].stopName).to.equal('Flinders Street Railway Station')
    })

    it('Should set Down trips to the name of the route', async () => {
      let pakenhamRoute = await routes.findDocument({ routeGTFSID: '2-PKM' })
      expect(pakenhamRoute).to.not.be.null

      let pakenham = pakenhamRoute.directions.find(dir => dir.directionName !== 'City')
      expect(pakenham).to.not.be.undefined
      expect(pakenham.directionName).to.equal('Pakenham')
      expect(pakenham.stops[0].stopName).to.equal('Flinders Street Railway Station')
      expect(pakenham.stops[pakenham.stops.length - 2].stopName).to.equal('Pakenham Railway Station')
      expect(pakenham.stops[pakenham.stops.length - 1].stopName).to.equal('East Pakenham Railway Station')
    })

    it('Should set Stony Point to Frankston trips as Up', async () => {
      let stonyPointRoute = await routes.findDocument({ routeGTFSID: '2-STY' })
      expect(stonyPointRoute).to.not.be.null
      
      let frankston = stonyPointRoute.directions.find(dir => dir.directionName === 'Frankston')
      expect(frankston).to.not.be.undefined
      expect(frankston.stops[0].stopName).to.equal('Stony Point Railway Station')
      expect(frankston.stops[frankston.stops.length - 1].stopName).to.equal('Frankston Railway Station')
    })

    it('Should set Stony Point trips as Down', async () => {
      let stonyPointRoute = await routes.findDocument({ routeGTFSID: '2-STY' })
      expect(stonyPointRoute).to.not.be.null

      let stonyPoint = stonyPointRoute.directions.find(dir => dir.directionName === 'Stony Point')
      expect(stonyPoint).to.not.be.undefined
      expect(stonyPoint.stops[0].stopName).to.equal('Frankston Railway Station')
      expect(stonyPoint.stops[stonyPoint.stops.length - 1].stopName).to.equal('Stony Point Railway Station')
    })

    it('Should mark the PTV Route direction', async () => {
      let stonyPointRoute = await routes.findDocument({ routeGTFSID: '2-STY' })
      expect(stonyPointRoute.ptvDirections['Stony Point']).to.equal(0)
      expect(stonyPointRoute.ptvDirections['Frankston']).to.equal(1)
    })
  })
})