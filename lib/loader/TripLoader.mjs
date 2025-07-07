import DatabaseConnection from '@transportme/database/lib/DatabaseConnection.mjs'
import GTFSCalendarReader from '../gtfs-parser/readers/GTFSCalendarReader.mjs'
import GTFSStopTimesReader from '../gtfs-parser/readers/GTFSStopTimesReader.mjs'
import GTFSTripReader from '../gtfs-parser/readers/GTFSTripReader.mjs'
import async from 'async'
import { GTFSStopTime } from '../gtfs-parser/GTFSStopTime.mjs'
import { minutesPastMidnightToHHMM } from '../utils.mjs'

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
   * @param {Object} colls Used to specify the collection names to write into
   * @param {string} colls.routeColl The collection to store the routes in. Defaults to gtfs-routes
   * @param {string} colls.stopColl The collection to store the stops in. Defaults to gtfs-stops
   * @param {string} colls.timetableColl The collection to store the timetables in. Defaults to gtfs-gtfs timetables
   */
  constructor({ tripsFile, stopTimesFile, calendarFile, calendarDatesFile }, mode, database, {
    routeColl = 'gtfs-routes',
    stopColl = 'gtfs-stops',
    timetableColl = 'gtfs-gtfs timetables'
  } = {}) {
    this.#routes = database.getCollection(routeColl)
    this.#stops = database.getCollection(stopColl)
    this.#trips = database.getCollection(timetableColl)

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
      if (!stopData) throw new Error(`Failed to match stop ${stop.stopID} in trip ${tripData.getTripID()}`)
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

      if (bay.parentStopGTFSID) data.stopGTFSID = bay.parentStopGTFSID
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
    dbTrip.departureTime = minutesPastMidnightToHHMM(stopTimings[0].departureTimeMinutes)
    stopTimings[0].arrivalTime = null
    stopTimings[0].arrivalTimeMinutes = null
    stopTimings[0].stopConditions.dropoff = 1
    
    let lastStop = stopTimings[stopTimings.length - 1]
    dbTrip.destination = lastStop.stopName
    dbTrip.destinationArrivalTime = minutesPastMidnightToHHMM(lastStop.arrivalTimeMinutes)
    lastStop.departureTime = null
    lastStop.departureTimeMinutes = null
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
    let tripData = await this.generateDBTripData(rawTripData, stops)
    if (!tripData) return

    let processedData = processTrip ? await processTrip(tripData) : tripData
    if (!processedData) return

    this.#shapeIDMap[tripData.shapeID] = tripData.routeGTFSID
    if (!this.#directionIDMap[tripData.routeGTFSID]) this.#directionIDMap[tripData.routeGTFSID] = {}
    this.#directionIDMap[tripData.routeGTFSID][rawTripData.getHeadsign()] = rawTripData.getGTFSDirection()
    
    this.updateStopServices(processedData)
    
    this.#tripsToLoad.push(processedData)
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
  async loadTrips({ routeIDMap, processTrip }) {
    this.#routeIDMap = routeIDMap

    await this.loadCalendarData()
    await this.loadTripsData()

    let tripsLoaded = 0

    await this.#stopTimesReader.open()
    while (this.#stopTimesReader.available()) {
      let gtfsTrip = await this.#stopTimesReader.getNextEntity()
      await this.loadTrip(gtfsTrip, processTrip)

      if (this.#tripsToLoad.length === 5000) { // Flush the cache every 5000 trips
        tripsLoaded += this.#tripsToLoad.length
        await this.writeTrips()
      }
    }

    tripsLoaded += this.#tripsToLoad.length
    await this.writeTrips()
  }

  async writeTrips() {
    if (this.#tripsToLoad.length) {
      this.#routeCache = {}
      this.#stopCache = {}

      await this.#trips.createDocuments(this.#tripsToLoad)
      this.#tripsToLoad = []
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