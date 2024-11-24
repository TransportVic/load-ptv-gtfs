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

  constructor({ tripsFile, stopTimesFile, calendarFile, calendarDatesFile }, mode, database) {
    this.#routes = database.getCollection('routes')
    this.#stops = database.getCollection('stops')
    this.#trips = database.getCollection('gtfs timetables')

    this.#mode = mode

    this.#stopTimesReader = new GTFSStopTimesReader(stopTimesFile, mode)
    this.#tripsReader = new GTFSTripReader(tripsFile, null, null)
    this.#calendarReader = new GTFSCalendarReader(calendarFile, calendarDatesFile)
  }

  async loadTripsData() {
    let tripsReader = this.#tripsReader
    tripsReader.setCalendar(this.#calendarMap)
    tripsReader.setRouteMappings(this.#routeIDMap)

    await tripsReader.open()
    while (tripsReader.available()) {
      let trip = await tripsReader.getNextEntity()
      this.#tripDetails[trip.tripID] = trip
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

    if (!route) route = { routeName: null, routeNumber: null }

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
    let routeData = await this.findMatchingRoute(tripData.routeGTFSID)

    let dbTrip = {
      mode: this.#mode,
      routeName: routeData.routeName,
      routeNumber: routeData.routeNumber,
      routeGTFSID: tripData.routeGTFSID,
      operationDays: tripData.operationDays,
      tripID: tripData.tripID,
      shapeID: tripData.shapeID,
      block: tripData.block || null,
      gtfsDirection: parseInt(tripData.direction),
      stopTimings: await async.map(stops, async stop => {
        let stopData = await this.findMatchingStop(stop.stopID)
        let matchingBay = stopData.bays.find(bay => bay.stopGTFSID === stop.stopID)

        return {
          stopName: matchingBay.fullStopName,
          stopNumber: matchingBay.stopNumber,
          stopGTFSID: stop.stopID,
          arrivalTime: stop.arrivalTime,
          arrivalTimeMinutes: stop.arrivalTimeMinutes,
          departureTime: stop.departureTime,
          departureTimeMinutes: stop.departureTimeMinutes,
          stopConditions: { pickup: stop.pickup, dropoff: stop.dropoff },
          stopDistance: stop.distanceTravelled
        }
      })
    }

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

      let tripData = await this.generateDBTripData(this.#tripDetails[tripID], stops)

      let processedData = processTrip ? await processTrip(tripData) : tripData
      if (!processedData) continue

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
}