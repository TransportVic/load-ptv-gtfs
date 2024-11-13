import GTFSRoute from '../GTFSRoute.mjs'
import GTFSReader from './GTFSReader.mjs'

export default class GTFSRouteReader extends GTFSReader {
 
  /** @type {string} */
  #mode

  constructor(file, mode) {
    super(file, mode)
    this.#mode = mode
  }

  /**
   * Converts a CSV row into a route object
   * 
   * @param {object} data A JSON object containing the following fields:
   * - routeGTFSID: The route ID
   * - agencyID: The route agency ID
   * - routeNumber: The route number, or empty if it does not exist
   * - routeName: The route name
   * @param {string} mode The route mode (eg: bus, metro train)
   * @returns {GTFSRoute} An object representing the route data
   */
  processEntity(data) {
    let routeData = {
      routeGTFSID: data.route_id,
      agencyID: data.agency_id,
      routeNumber: data.route_short_name,
      routeName: data.route_long_name
    }

    return GTFSRoute.create(routeData, this.#mode)
  } 
}