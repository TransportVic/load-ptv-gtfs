import DatabaseConnection from '@transportme/database/lib/DatabaseConnection.mjs'
import GTFSCalendarReader from '../gtfs-parser/readers/GTFSCalendarReader.mjs'
import GTFSStopTimesReader from '../gtfs-parser/readers/GTFSStopTimesReader.mjs'
import GTFSTripReader from '../gtfs-parser/readers/GTFSTripReader.mjs'
import async from 'async'
import { GTFSStopTime } from '../gtfs-parser/GTFSStopTime.mjs'
import { minutesPastMidnightToHHMM } from '../utils.mjs'

export default class TripLoader {

  routes
  stops
  trips

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
  #directionIDMap = {}
  #stopServicesMap = {}

  #tripsToLoad = []

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
    this.routes = this.getRoutesDB(database)
    this.stops = this.getStopsDB(database)
    this.trips = this.getTripsDB(database)

    this.#mode = mode

    this.#stopTimesReader = this.createStopTimesReader(stopTimesFile, mode)
    this.#tripsReader = this.createTripReader(tripsFile, null, null, mode)
    this.#calendarReader = this.createCalendarReader(calendarFile, calendarDatesFile)
  }

  getRoutesDB(db) {
    return db.getCollection('gtfs-routes')
  }

  getStopsDB(db) {
    return db.getCollection('gtfs-stops')
  }

  getTripsDB(db) {
    return db.getCollection('gtfs-gtfs timetables')
  }

  createStopTimesReader(stopTimesFile, mode) {
    return new GTFSStopTimesReader(stopTimesFile, mode)
  }

  createTripReader(tripsFile, calendars, routeMappings, mode) {
    return new GTFSTripReader(tripsFile, calendars, routeMappings, mode)
  }

  createCalendarReader(calendarFile, calendarDatesFile) {
    return new GTFSCalendarReader(calendarFile, calendarDatesFile)
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

    let route = await this.routes.findDocument({
      routeGTFSID: routeGTFSID
    })

    this.#routeCache[routeGTFSID] = route
    return route
  }

  async findMatchingStop(stopGTFSID) {
    if (this.#stopCache[stopGTFSID]) return this.#stopCache[stopGTFSID]

    let stop = await this.stops.findDocument({
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
      if (!stopData) throw new Error(`Failed to match stop ${stop.stopID} in trip ${tripData.getTripID()}`)
      let bay = stopData.bays.find(bay => bay.stopGTFSID === stop.stopID && bay.mode === this.#mode)

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
        stopDistance: parseFloat(stop.distanceTravelled)
      }

      if (bay.parentStopGTFSID) data.stopGTFSID = bay.parentStopGTFSID
      if (bay.platform) data.platform = bay.platform

      return data
    })

    tripData.setStopData(stopTimings)

    let dbTrip = {
      mode: this.#mode,
      routeName: routeData.routeName,
      routeNumber: routeData.routeNumber,
      ...tripData.getTripData(),
      stopTimings
    }

    dbTrip.origin = stopTimings[0].stopName
    dbTrip.departureTime = minutesPastMidnightToHHMM(stopTimings[0].departureTimeMinutes)
    // stopTimings[0].arrivalTime = null
    // stopTimings[0].arrivalTimeMinutes = null
    stopTimings[0].stopConditions.dropoff = 1

    let lastStop = stopTimings[stopTimings.length - 1]
    dbTrip.destination = lastStop.stopName
    dbTrip.destinationArrivalTime = minutesPastMidnightToHHMM(lastStop.arrivalTimeMinutes)
    // lastStop.departureTime = null
    // lastStop.departureTimeMinutes = null
    lastStop.stopConditions.pickup = 1

    return dbTrip
  }

  /**
   * Loads a trip into the database.
   * 
   * @param {Object} tripData The trip data
   * @param {string} tripData.tripID The trip ID
   * @param {GTFSStopTime[]} tripData.stops The trip's stops
   * @param {function} [processTrip] Used to process a trip.
   */
  async loadTrip({ tripID, stops }, processTrip) {
    let rawTripData = this.#tripDetails[tripID]
    if (!rawTripData) return // Trip appeared in stop_times.txt but not in trips.txt
    let tripData = await this.generateDBTripData(rawTripData, stops)
    if (!tripData) return

    let processedData = processTrip ? await processTrip(tripData, rawTripData) : tripData
    if (!processedData) return

    this.#shapeIDMap[tripData.shapeID] = tripData.routeGTFSID
    if (!this.#directionIDMap[tripData.routeGTFSID]) this.#directionIDMap[tripData.routeGTFSID] = {}
    this.#directionIDMap[tripData.routeGTFSID][rawTripData.getHeadsign()] = rawTripData.getGTFSDirection()
    
    this.updateStopServices(processedData)
    
    this.#tripsToLoad.push(processedData)
    this.#tripDetails[tripID] = null // Clear it from the cache once loaded to free up some memory
  }

  updateStopServices(trip) {
    let { gtfsDirection, routeGTFSID, routeNumber } = trip
    trip.stopTimings.forEach(stop => {
      let { stopGTFSID } = stop
      let serviceID = `${routeGTFSID}-${gtfsDirection}-${routeNumber}`
      if (!this.#stopServicesMap[stopGTFSID]) this.#stopServicesMap[stopGTFSID] = { services: {}, screenServices: {} }
      if (!this.#stopServicesMap[stopGTFSID].services[serviceID]) {
        this.#stopServicesMap[stopGTFSID].services[serviceID] = { routeGTFSID, gtfsDirection, routeNumber }
      }

      if (stop.stopConditions.pickup === 0 && !this.#stopServicesMap[stopGTFSID].screenServices[serviceID]) {
        this.#stopServicesMap[stopGTFSID].screenServices[serviceID] = { routeGTFSID, gtfsDirection, routeNumber }
      }
    })
  }

  /**
   * Loads the trip data into the database.
   * 
   * @param {object} options A list of options for the trip loader
   * @param {object} options.routeIDMap A mapping of full route IDs to their simplified IDs.
   * @param {function} [options.processTrip] A function to modify trip data on a per-trip basis. It should return null to discard the trip.
   */
  async loadTrips({ routeIDMap, processTrip, onWrite = () => {} }) {
    this.#routeIDMap = routeIDMap

    await this.loadCalendarData()
    await this.loadTripsData()

    let tripsLoaded = 0

    await this.#stopTimesReader.open()
    while (this.#stopTimesReader.available()) {
      try {
        let gtfsTrip = await this.#stopTimesReader.getNextEntity()
        await this.loadTrip(gtfsTrip, processTrip)
      } catch (e) {
        console.error('Failed to load trip', e)
      }

      if (this.#tripsToLoad.length === 5000) { // Flush the cache every 5000 trips
        tripsLoaded += this.#tripsToLoad.length
        await this.writeTrips()
        onWrite(tripsLoaded)
      }
    }

    tripsLoaded += this.#tripsToLoad.length
    await this.writeTrips()
    onWrite(tripsLoaded)
  }

  getTripsToLoad() {
    return this.#tripsToLoad
  }

  clearTripsToLoad() {
    this.#routeCache = {}
    this.#stopCache = {}
    this.#tripsToLoad = []
  }

  async writeTrips() {
    if (this.getTripsToLoad().length) {
      await this.trips.createDocuments(this.getTripsToLoad())
      this.clearTripsToLoad()
    }
  }

  getShapeIDMap() {
    return this.#shapeIDMap
  }

  getDirectionIDMap() {
    return this.#directionIDMap
  }

  getStopServicesMap() {
    let output = {}
    for (let stopGTFSID of Object.keys(this.#stopServicesMap)) {
      let stopServices = this.#stopServicesMap[stopGTFSID]
      output[stopGTFSID] = {
        services: Object.values(stopServices.services),
        screenServices: Object.values(stopServices.screenServices)
      }
    }
    return output
  }
}