import { TRANSIT_MODES } from '../constants.mjs'
import GTFSCalendar from './GTFSCalendar.mjs'

export default class GTFSTrip {
  
  #routeGTFSID
  #operationDays
  #tripID
  #shapeID
  #headsign
  #direction
  #block

  /**
   * 
   * @param {Object} param0 The trip data
   * @param {string} param0.routeGTFSID The route ID associated with the trip. This should be the raw ID, eg "6-123-mjp-1"
   * @param {GTFSCalendar} param0.calendar The calendar type
   * @param {string} param0.id The unique trip ID
   * @param {string} param0.shapeID The shape ID associate with the trip
   * @param {string} param0.headsign The headsign on the vehicle serving the trip
   * @param {string} param0.direction The direction of the trip. "0" for outbound and "1" for inbound trips.
   * @param {string} param0.block The block ID of the trip.
   */
  constructor({ routeGTFSID, calendar, id, shapeID, headsign, direction, block }) {
    this.#routeGTFSID = routeGTFSID
    this.#operationDays = calendar.getOperationDays()
    this.#tripID = id
    this.#shapeID = shapeID
    this.#headsign = headsign
    this.#direction = direction
    this.#block = block
  }

  /**
   * Checks if the GTFSTrip (or subclass) is able to process the given trip data
   * @param {Object} data The trip being checked
   * @returns true if the class is able to process the trip
   */
  static canProcess(data) {
    return true
  }

  /**
   * Creates a new GTFSTrip with the trip data that was passed in
   * @param {Object} data The trip data being created
   * @param {string} mode The transit mode
   * @returns {GTFSTrip} A trip instance representing the data being passed in
   */
  static create(data, mode) {
    let types = [ SmartrakTrip, MetroTrip, GTFSTrip ]
    for (let type of types) {
      if (type.canProcess(data, mode)) return new type(data)
    }
  }

  /**
   * Gets the trip data in a database friendly format
   * @returns {Object} The trip data that will be saved into the database
   */
  getTripData() {
    return {
      routeGTFSID: this.#routeGTFSID,
      operationDays: this.#operationDays,
      tripID: this.#tripID,
      shapeID: this.#shapeID,
      block: this.#block || null,
      gtfsDirection: parseInt(this.#direction)
    }
  }

  getBlock() {
    return this.#block
  }

  getOperationDays() {
    return this.#operationDays
  }

  getRouteGTFSID() {
    return this.#routeGTFSID
  }

  getShapeID() {
    return this.#shapeID
  }

  getTripID() {
    return this.#tripID
  }

  getHeadsign() {
    return this.#headsign
  }
}

/**
 * Used to represent a Smartrak bus trip.
 * 
 * Trip IDs are of the form DEPOT-ROUTE--ROUTE_VARIANT-ROSTER-TRIP_ID
 * 
 * Example: 13-476--1-Sat5-34737060
 */
class SmartrakTrip extends GTFSTrip {

  static canProcess(data, mode) {
    return false
  }

}

/**
 * Used to represent a Metro train trip.
 * 
 * Trip IDs are of the form 02-ROUTE--ROUTE_VARIANT-ROSTER-TDN. Note that TDNs are alphanumeric
 * 
 * Example: 02-BEG--58-T5_n4-3651
 */
class MetroTrip extends GTFSTrip {

  #runID

  constructor(data) {
    super(data)

    let runID = data.id.match(/^02-\w{3}-.*-(\w\d{3})$/)
    this.#runID = runID[1]
  }

  static canProcess(data, mode) {
    return mode === TRANSIT_MODES.metroTrain && data.id.match(/^02-\w{3}-.*-(\w\d{3})$/)
  }

  getTripData() {
    return {
      ...super.getTripData(),
      runID: this.#runID
    }
  }

  getRunID() {
    return this.#runID
  }

}