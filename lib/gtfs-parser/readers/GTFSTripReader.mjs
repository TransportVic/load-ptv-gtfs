import GTFSTrip from '../GTFSTrip.mjs'
import GTFSReader from './GTFSReader.mjs'

export default class GTFSTripReader extends GTFSReader {
 
  #calendars
  #routeMappings

  constructor(tripsFile, calendars, routeMappings) {
    super(tripsFile)
    this.#calendars = calendars
    this.#routeMappings = routeMappings
  }

  /**
   * Converts a CSV row into a trip object
   * 
   * @param {object} data A JSON object containing the following fields:
   * 
   * @returns {GTFSTrip} An object representing the trip data
   */
  processEntity(data) {
    let tripData = {
      routeGTFSID: this.#routeMappings[data.route_id],
      calendar: this.#calendars[data.service_id],
      id: data.trip_id,
      shapeID: data.shape_id,
      headsign: data.trip_headsign,
      direction: data.direction_id,
      block: data.block_id
    }

    return new GTFSTrip(tripData)
  }
}