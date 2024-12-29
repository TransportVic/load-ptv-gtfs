import { expect } from 'chai'
import path from 'path'
import url from 'url'
import { TRANSIT_MODES } from '../lib/constants.mjs'
import { LokiDatabaseConnection } from '@transportme/database'
import StopsLoader from '../lib/loader/StopsLoader.mjs'
import RouteLoader from '../lib/loader/RouteLoader.mjs'
import TripLoader from '../lib/loader/TripLoader.mjs'
import setStopServices from '../lib/post-processing/set-stop-services.mjs'
import suburbs from './sample-data/suburbs.json' with { type: 'json' }

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const routesFile = path.join(__dirname, 'sample-data', 'routes', 'metro_lines.txt')
const agencyFile = path.join(__dirname, 'sample-data', 'routes', 'agency.txt')

const calendarFile = path.join(__dirname, 'sample-data', 'calendar', 'calendar.txt')
const calendarDatesFile = path.join(__dirname, 'sample-data', 'calendar', 'calendar_dates.txt')

const stopsFile = path.join(__dirname, 'sample-data', 'trips', 'stops.txt')
const stopTimesFile = path.join(__dirname, 'sample-data', 'trips', 'stop_times.txt')
const tripsFile = path.join(__dirname, 'sample-data', 'trips', 'trips.txt')

describe('The TripLoader class', () => {
  it('Should process the trip and add it to the database', async () => {
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
    await tripLoader.loadTrips({
      routeIDMap
    })

    await setStopServices(database)

    let alamein = await stops.findDocument({ 'bays.stopGTFSID': '19847' })
    let alameinPlatform = alamein.bays.find(bay => bay.stopGTFSID === '19847')
    expect(alameinPlatform).to.not.be.null
    expect(alameinPlatform.services).to.deep.equal([{
      routeGTFSID: "2-ALM",
      gtfsDirection: 0,
      routeNumber: null
    }, {
      routeGTFSID: "2-ALM",
      gtfsDirection: 1,
      routeNumber: null
    }])

    expect(alameinPlatform.screenServices, "Only trips from Alamein to Camberwell should have matched").to.deep.equal([{
      routeGTFSID: "2-ALM",
      gtfsDirection: 1,
      routeNumber: null
    }])
  })
})
