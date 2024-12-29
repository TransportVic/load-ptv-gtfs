import DatabaseConnection from '@transportme/database/lib/DatabaseConnection.mjs'
import GTFSCalendarReader from '../gtfs-parser/readers/GTFSCalendarReader.mjs'
import GTFSStopTimesReader from '../gtfs-parser/readers/GTFSStopTimesReader.mjs'
import GTFSTripReader from '../gtfs-parser/readers/GTFSTripReader.mjs'
import async from 'async'

export default class TripLoader {

  #routes
  #stops
  #trips

  #tripsReader
  #stopTimesReader
  #calendarReader

  #mode

  #tripDetails = {}

  #calendarMap = {}
  #routeIDMap = {}

  #routeCache = {}
  #stopCache = {}

  #shapeIDMap = {}

  /**
   * Creates a new Trip Loader.
   * 
   * @param {Object} paths Required file paths for the TripLoader
   * @param {string} paths.tripsFile The path for the trips.txt file
   * @param {string} paths.stopTimesFile The path for the stop_times.txt file
   * @param {string} paths.calendarFile The path for the calendar.txt file
   * @param {string} paths.calendarDatesFile The path for the calendar_dates.txt file
   * @param {string} mode The transit mode being loaded
   * @param {DatabaseConnection} database A database connection
   */
  constructor({ tripsFile, stopTimesFile, calendarFile, calendarDatesFile }, mode, database) {
    this.#routes = database.getCollection('routes')
    this.#stops = database.getCollection('stops')
    this.#trips = database.getCollection('gtfs timetables')

    this.#mode = mode

    this.#stopTimesReader = new GTFSStopTimesReader(stopTimesFile, mode)
    this.#tripsReader = new GTFSTripReader(tripsFile, null, null, mode)
    this.#calendarReader = new GTFSCalendarReader(calendarFile, calendarDatesFile)
  }

  async loadTripsData() {
    let tripsReader = this.#tripsReader
    tripsReader.setCalendar(this.#calendarMap)
    tripsReader.setRouteMappings(this.#routeIDMap)

    await tripsReader.open()
    while (tripsReader.available()) {
      let trip = await tripsReader.getNextEntity()
      this.#tripDetails[trip.getTripID()] = trip
    }
  }

  async loadCalendarData() {
    let calendarReader = this.#calendarReader

    await calendarReader.open()
    while (calendarReader.available()) {
      let calendar = await calendarReader.getNextEntity()
      this.#calendarMap[calendar.id] = calendar
    }
  }

  async findMatchingRoute(routeGTFSID) {
    if (this.#routeCache[routeGTFSID]) return this.#routeCache[routeGTFSID]

    let route = await this.#routes.findDocument({
      routeGTFSID: routeGTFSID
    })

    this.#routeCache[routeGTFSID] = route
    return route
  }

  async findMatchingStop(stopGTFSID) {
    if (this.#stopCache[stopGTFSID]) return this.#stopCache[stopGTFSID]

    let stop = await this.#stops.findDocument({
      'bays.stopGTFSID': stopGTFSID
    })

    this.#stopCache[stopGTFSID] = stop
    return stop
  }

  async generateDBTripData(tripData, stops) {
    let routeData = await this.findMatchingRoute(tripData.getRouteGTFSID())
    if (!routeData) return null

    let stopTimings = await async.map(stops, async stop => {
      let stopData = await this.findMatchingStop(stop.stopID)
      let bay = stopData.bays.find(bay => bay.stopGTFSID === stop.stopID)

      let data = {
        stopName: bay.fullStopName,
        stopNumber: bay.stopNumber,
        suburb: bay.suburb,
        stopGTFSID: stop.stopID,
        arrivalTime: stop.arrivalTime,
        arrivalTimeMinutes: stop.arrivalTimeMinutes,
        departureTime: stop.departureTime,
        departureTimeMinutes: stop.departureTimeMinutes,
        stopConditions: { pickup: stop.pickup, dropoff: stop.dropoff },
        stopDistance: stop.distanceTravelled
      }

      if (bay.platform) data.platform = bay.platform

      return data
    })


    let dbTrip = {
      mode: this.#mode,
      ...tripData.getTripData(),
      routeName: routeData.routeName,
      routeNumber: routeData.routeNumber,
      stopTimings
    }

    dbTrip.origin = stopTimings[0].stopName
    dbTrip.departureTime = stopTimings[0].departureTime
    stopTimings[0].arrivalTime = null
    stopTimings[0].arrivalTimeMinutes = null
    stopTimings[0].stopConditions.dropoff = 1
    
    let lastStop = stopTimings[stopTimings.length - 1]
    dbTrip.destination = lastStop.stopName
    dbTrip.destinationArrivalTime = lastStop.arrivalTime
    lastStop.departureTime = null
    lastStop.departureTimeMinutes = null
    lastStop.stopConditions.pickup = 1

    return dbTrip
  }

  /**
   * Loads the trip data into the database.
   * 
   * @param {object} options A list of options for the trip loader
   * @param {object} options.routeIDMap A mapping of full route IDs to their simplified IDs.
   * @param {function} options.processTrip A function to modify trip data on a per-trip basis. It should return null to discard the trip.
   */
  async loadTrips({ routeIDMap, processTrip }) {
    this.#routeIDMap = routeIDMap

    await this.loadCalendarData()
    await this.loadTripsData()

    let tripsLoaded = 0
    let trips = []

    await this.#stopTimesReader.open()
    while (this.#stopTimesReader.available()) {
      let { tripID, stops } = await this.#stopTimesReader.getNextEntity()

      let rawTripData = this.#tripDetails[tripID]
      let tripData = await this.generateDBTripData(rawTripData, stops)
      if (!tripData) continue

      let processedData = processTrip ? await processTrip(tripData) : tripData
      if (!processedData) continue

      this.#shapeIDMap[tripData.shapeID] = tripData.routeGTFSID

      trips.push(processedData)

      tripsLoaded += 1

      if (tripsLoaded === 5000) { // Flush the cache every 5000 trips
        this.#routeCache = {}
        this.#stopCache = {}

        await this.#trips.createDocuments(trips)
        trips = []

        tripsLoaded = 0
      }
    }

    if (trips.length) {
      await this.#trips.createDocuments(trips)
    }
  }

  getShapeIDMap() {
    return this.#shapeIDMap
  }
}