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

const newStopTimesFile = path.join(__dirname, 'sample-data', 'trips', 'stop_times_new.txt')
const newTripsFile = path.join(__dirname, 'sample-data', 'trips', 'trips_new.txt')

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

    let trip = await trips.findDocument({ tripID: '1.T2.2-ALM-vpt-1.1.R' })
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
    expect(trip.stopTimings[0].arrivalTime).to.be.null
    expect(trip.stopTimings[0].arrivalTimeMinutes).to.be.null
    expect(trip.stopTimings[0].stopConditions.dropoff).to.equal(1)
    expect(trip.stopTimings[0].stopConditions.pickup).to.equal(0)
    expect(trip.stopTimings[0].departureTime).to.equal('04:57')
    expect(trip.stopTimings[0].departureTimeMinutes).to.equal(4 * 60 + 57)
    expect(trip.stopTimings[0].platform).to.equal('1')

    expect(trip.stopTimings[5].stopName).to.equal('Riversdale Railway Station')
    expect(trip.stopTimings[5].platform).to.equal('2')

    expect(trip.stopTimings[6].stopName).to.equal('Camberwell Railway Station')
    expect(trip.stopTimings[6].arrivalTime).to.equal('05:08')
    expect(trip.stopTimings[6].arrivalTimeMinutes).to.equal(5 * 60 + 8)
    expect(trip.stopTimings[6].departureTime).to.be.null
    expect(trip.stopTimings[6].departureTimeMinutes).to.be.null
    expect(trip.stopTimings[6].stopConditions.dropoff).to.equal(0)
    expect(trip.stopTimings[6].stopConditions.pickup).to.equal(1)
    expect(trip.stopTimings[6].platform).to.equal('3')

    expect(trip.origin).to.equal('Alamein Railway Station')
    expect(trip.destination).to.equal('Camberwell Railway Station')

    expect(trip.departureTime).to.equal('04:57')
    expect(trip.destinationArrivalTime).to.equal('05:08')
  })

  it('It should return a mapping of Shape IDs to Route IDs', async () => {
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

    expect(shapeIDMap['2-ALM-vpt-1.1.R']).to.equal('2-ALM')
  })

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
      tripsFile: newTripsFile, stopTimesFile: newStopTimesFile,
      calendarFile, calendarDatesFile
    }, TRANSIT_MODES.metroTrain, database)
    
    await tripLoader.loadTrips({ routeIDMap })

    let trip = await trips.findDocument({ tripID: '02-ALM--1-T2-2302' })

    expect(trip).to.not.be.null
    expect(trip.runID).to.equal('2302')
  })
})
