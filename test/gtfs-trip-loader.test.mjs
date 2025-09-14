import { expect } from 'chai'
import path from 'path'
import url from 'url'
import { TRANSIT_MODES } from '../lib/constants.mjs'
import { LokiDatabaseConnection } from '@transportme/database'
import StopsLoader from '../lib/loader/StopsLoader.mjs'
import RouteLoader from '../lib/loader/RouteLoader.mjs'
import TripLoader from '../lib/loader/TripLoader.mjs'
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

const emptyTrips = path.join(__dirname, 'sample-data', 'trips', 'empty_trips.txt')

describe('The TripLoader class', () => {
  it.only('Should process the trip and add it to the database', async () => {
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
    await tripLoader.loadTrips({
      routeIDMap
    })

    let trip = await trips.findDocument({ tripID: '02-ALM--12-T5-2000' })
    expect(trip).to.not.be.null
    
    expect(trip.routeName).to.equal('Alamein')
    expect(trip.routeNumber).to.be.null
    expect(trip.operationDays.length).to.equal(12)
    expect(trip.operationDays[0]).to.equal('20241123')

    expect(trip.shapeID).to.equal('2-ALM-vpt-1.1.R')
    expect(trip.block).to.be.null
    expect(trip.gtfsDirection).to.equal(1)

    expect(trip.stopTimings.length).to.equal(7)
    expect(trip.stopTimings[0].stopName).to.equal('Alamein Railway Station')
    expect(trip.stopTimings[0].stopGTFSID).to.equal('vic:rail:ALM')
    // expect(trip.stopTimings[0].arrivalTime).to.be.null
    // expect(trip.stopTimings[0].arrivalTimeMinutes).to.be.null
    expect(trip.stopTimings[0].stopConditions.dropoff).to.equal(1)
    expect(trip.stopTimings[0].stopConditions.pickup).to.equal(0)
    expect(trip.stopTimings[0].departureTime).to.equal('04:57')
    expect(trip.stopTimings[0].departureTimeMinutes).to.equal(4 * 60 + 57)
    expect(trip.stopTimings[0].platform).to.equal('1')

    expect(trip.stopTimings[0].stopDistance).to.equal(0)
    expect(trip.stopTimings[5].stopName).to.equal('Riversdale Railway Station')
    expect(trip.stopTimings[5].stopGTFSID).to.equal('vic:rail:RIV')
    expect(trip.stopTimings[5].platform).to.equal('1')
    expect(trip.stopTimings[5].stopDistance).to.equal(4428.35)

    expect(trip.stopTimings[6].stopName).to.equal('Camberwell Railway Station')
    expect(trip.stopTimings[6].stopGTFSID).to.equal('vic:rail:CAM')
    expect(trip.stopTimings[6].arrivalTime).to.equal('05:08')
    expect(trip.stopTimings[6].arrivalTimeMinutes).to.equal(5 * 60 + 8)
    // expect(trip.stopTimings[6].departureTime).to.be.null
    // expect(trip.stopTimings[6].departureTimeMinutes).to.be.null
    expect(trip.stopTimings[6].stopConditions.dropoff).to.equal(0)
    expect(trip.stopTimings[6].stopConditions.pickup).to.equal(1)
    expect(trip.stopTimings[6].platform).to.equal('1')

    expect(trip.origin).to.equal('Alamein Railway Station')
    expect(trip.destination).to.equal('Camberwell Railway Station')

    expect(trip.departureTime).to.equal('04:57')
    expect(trip.destinationArrivalTime).to.equal('05:08')
  })

  it('It should return a mapping of Shape IDs to Route IDs', async () => {
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
    let shapeIDMap = tripLoader.getShapeIDMap()

    expect(shapeIDMap['2-ALM-vpt-1.1.R']).to.equal('2-ALM')
  })

  it('Should return a mapping of Route + GTFS Direction ID to PTV Direction Names', async () => {
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
    let directionIDMap = tripLoader.getDirectionIDMap()

    expect(directionIDMap).to.deep.equal({
      '2-ALM': { 'Alamein': 0, 'Camberwell': 1 }
    })
  })

  it('Should return a mapping stop services', async () => {
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

    let stopServicesMap = tripLoader.getStopServicesMap()

    expect(stopServicesMap['vic:rail:ALM'].services).to.deep.equal([{
      routeGTFSID: '2-ALM',
      gtfsDirection: 1,
      routeNumber: null
    }, {
      routeGTFSID: '2-ALM',
      gtfsDirection: 0,
      routeNumber: null
    }])

    expect(stopServicesMap['vic:rail:ALM'].screenServices).to.deep.equal([{
      routeGTFSID: '2-ALM',
      gtfsDirection: 1,
      routeNumber: null
    }])

    expect(stopServicesMap['vic:rail:CAM'].screenServices).to.deep.equal([{
      routeGTFSID: '2-ALM',
      gtfsDirection: 0,
      routeNumber: null
    }])
  })

  it('Should return a mapping stop services', async () => {
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
      tripsFile: emptyTrips, stopTimesFile,
      calendarFile, calendarDatesFile
    }, TRANSIT_MODES.metroTrain, database)
    
    await tripLoader.loadTrips({ routeIDMap })

    // If we got here then everything worked out
  })
})
