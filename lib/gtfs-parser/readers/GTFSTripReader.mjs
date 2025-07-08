import GTFSTrip from '../GTFSTrip.mjs'
import GTFSReader from './GTFSReader.mjs'

export default class GTFSTripReader extends GTFSReader {
 
  #calendars
  #routeMappings
  #mode

  constructor(tripsFile, calendars, routeMappings, mode) {
    super(tripsFile)
    this.#calendars = calendars
    this.#routeMappings = routeMappings
    this.#mode = mode
  }
  
  getMode() {
    return this.#mode
  }

  /**
   * Sets the route ID mappings of the trip reader.
   * 
   * @param {object} routeMappings The route ID mappings
   */
  setRouteMappings(routeMappings) {
    this.#routeMappings = routeMappings
  }

  /**
   * 
   * @param {object} calendars The calendar ID to GTFSCalendar mappings
   */
  setCalendar(calendars) {
    this.#calendars = calendars
  }

  getRouteMappings() {
    return this.#routeMappings
  }

  getCalendars() {
    return this.#calendars
  }

  getRouteMapping(routeGTFSID) {
    return this.getRouteMappings()[routeGTFSID]
  }

  getCalendar(calendarID) {
    return this.getCalendars()[calendarID]
  }

  /**
   * Converts a CSV row into a trip object
   * 
   * @param {object} data A JSON object containing the following fields:
   * @param {string} data.route_id The trip's route ID
   * @param {string} data.service_id The trip's calendar ID
   * @param {string} data.trip_id The trip's unique trip ID
   * @param {string} data.shape_id The trip's shape ID
   * @param {string} data.trip_headsign The trip's headsign
   * @param {string} data.direction_id The trip's direction ID
   * @param {string} data.block_id The trip's block ID
   * 
   * @returns {GTFSTrip} An object representing the trip data
   */
  processEntity(data) {
    let tripData = {
      routeGTFSID: this.getRouteMapping(data.route_id),
      calendar: this.getCalendar(data.service_id),
      id: data.trip_id,
      shapeID: data.shape_id,
      headsign: data.trip_headsign,
      direction: data.direction_id,
      block: data.block_id
    }

    return GTFSTrip.create(tripData, this.getMode())
  }
}