import { expect } from 'chai'
import path from 'path'
import url from 'url'
import { LokiDatabaseConnection } from '@sbs9642p/database'
import StopsLoader from '../lib/loader/StopsLoader.mjs'
import RouteLoader from '../lib/loader/RouteLoader.mjs'
import TripLoader from '../lib/loader/TripLoader.mjs'
import ShapeLoader from '../lib/loader/ShapeLoader.mjs'
import { TRANSIT_MODES } from '../lib/constants.mjs'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const routesFile = path.join(__dirname, 'sample-data', 'routes', 'metro_bus_routes.txt')
const agencyFile = path.join(__dirname, 'sample-data', 'routes', 'agency.txt')

const calendarFile = path.join(__dirname, 'sample-data', 'calendar', 'calendar.txt')
const calendarDatesFile = path.join(__dirname, 'sample-data', 'calendar', 'calendar_dates.txt')

const stopsFile = path.join(__dirname, 'sample-data', 'shapes', 'stops.txt')
const stopTimesFile = path.join(__dirname, 'sample-data', 'shapes', 'stop_times.txt')
const tripsFile = path.join(__dirname, 'sample-data', 'shapes', 'trips.txt')
const shapeFile = path.join(__dirname, 'sample-data', 'shapes', 'shapes.txt')

describe('The ShapeLoader class', () => {
  it('Should process the shapes and append it to the route data', async () => {
    let database = new LokiDatabaseConnection('test-db')
    let stops = await database.createCollection('stops')
    let routes = await database.createCollection('routes')
    let trips = await database.createCollection('gtfs timetables')

    let stopLoader = new StopsLoader(stopsFile, TRANSIT_MODES.metroBus, database)
    await stopLoader.loadStops()

    let routeLoader = new RouteLoader(routesFile, agencyFile, TRANSIT_MODES.metroBus, database)
    await routeLoader.loadRoutes()

    let routeIDMap = routeLoader.getRouteIDMap()

    let tripLoader = new TripLoader({
      tripsFile, stopTimesFile,
      calendarFile, calendarDatesFile
    }, TRANSIT_MODES.metroBus, database)
   
    let shapeIDMap = await tripLoader.loadTrips({ routeIDMap })

    let shapeLoader = new ShapeLoader(shapeFile, database)

    await shapeLoader.loadShapes({ shapeIDMap })
    
    let route = await routes.findDocument({ routeGTFSID: '4-601' })

    expect(route).to.exist
    expect(route.routePath.length).to.equal(2)
    
    let monashHuntingdale = route.routePath.find(path => path.fullGTFSIDs.includes('49-601-aus-1.3.H'))
    expect(monashHuntingdale).to.exist
    expect(monashHuntingdale.length).to.equal(2848.26)
    expect(monashHuntingdale.path.coordinates.length).to.equal(38)
  })
})