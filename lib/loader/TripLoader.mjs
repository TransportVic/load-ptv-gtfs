import GTFSCalendarReader from '../gtfs-parser/readers/GTFSCalendarReader.mjs'
import GTFSStopTimesReader from '../gtfs-parser/readers/GTFSStopTimesReader.mjs'
import GTFSTripReader from '../gtfs-parser/readers/GTFSTripReader.mjs'

export default class TripLoader {

  #routes
  #trips

  #tripsReader
  #stopTimesReader
  #calendarReader

  #mode

  #tripDetails = {}

  #calendarMap = {}
  #routeIDMap = {}

  constructor({ tripsFile, stopTimesFile, calendarFile, calendarDatesFile }, mode, database) {
    this.#routes = database.getCollection('routes')
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

  async findMatchingRoute(routeData) {
    return await this.#routes.findDocument({
      routeGTFSID: routeData.routeGTFSID
    })
  }

  /**
   * Loads the trip data into the database.
   * 
   * @param {Object} routeIDMap A mapping of full route IDs to their simplified IDs.
   */
  async loadTrips(routeIDMap) {
    this.#routeIDMap = routeIDMap

    await this.loadCalendarData()
    await this.loadTripsData()

    await this.#stopTimesReader.open()
    while (this.#stopTimesReader.available()) {
      let { tripID, stops } = await this.#stopTimesReader.getNextEntity()
      let tripData = this.#tripDetails[tripID]
      console.log(tripData, stops)
    }
  }
}