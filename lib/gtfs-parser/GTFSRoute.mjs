import { TRANSIT_MODES } from '../constants.mjs'

export default class GTFSRoute {

  originalRouteGTFSID
  routeGTFSID
  agencyID
  operator
  routeNumber
  routeName

  /**
   * 
   * @param {Object} param0 The route data
   * @param {string} param0.routeGTFSID The route's GTFS ID
   * @param {string} param0.agencyID The route's agency ID
   * @param {string} param0.routeNumber The route's number. Blank if it does not exist
   * @param {string} param0.routeName The route's name
   */
  constructor({ routeGTFSID, agencyID, routeNumber, routeName }) {
    this.originalRouteGTFSID = routeGTFSID
    this.routeGTFSID = this.parseRouteID(routeGTFSID)
    this.agencyID = agencyID
    this.routeName = routeName

    if (routeNumber !== null && routeNumber.length === 0) routeNumber = null
    this.routeNumber = routeNumber
  }

  /**
   * Parses the route GTFS ID into a standardises format.
   * @param {string} routeGTFSID The route GTFS ID
   * @returns A formatted route GTFS ID
   */
  parseRouteID(routeGTFSID) {
    let [ _, mode, id ] = routeGTFSID.match(/^(\d+)\-(\w+)/)

    return `${mode}-${`000${id}`.slice(-3)}`
  }

  /**
   * Checks if the GTFSRoute (or subclass) is able to process the given route data
   * @param {Object} data The route being checked
   * @param {string} mode The route mode
   * @returns true if the class is able to process the route
   */
  static canProcess(routeGTFSID, mode) {
    return true 
  }

  
  /**
   * Creates a new GTFSRoute with the route data that was passed in
   * @param {Object} data The route data being created
   * @param {string} mode The transit mode
   * @returns {GTFSRoute} A route instance representing the data being passed in
   */
  static create(data, mode) {
    let { routeGTFSID } = data
    let routeTypes = [ NewMetroGTFSRoute, MetroGTFSRoute, SmartrakGTFSRoute, GTFSRoute ]
    for (let type of routeTypes) {
      if (type.canProcess(routeGTFSID, mode)) return new type(data)
    }
  }
}

/**
 * Used to represent a Smartrak bus route.
 * 
 * Route IDs are of the form DEPOT-ROUTE-aus-ROUTE_VARIANT. Note that the route number could contain letters or even dashes
 * 
 * Example: 29-737-aus-1
 * Example: 29-695-F-aus-1
 * Example: 53-MFR-aus-1
 */
class SmartrakGTFSRoute extends GTFSRoute {

  parseRouteID(routeGTFSID) {
    let [ _, routeNumber ] = routeGTFSID.match(/^\d+\-(\w+)/)
    return `4-${routeNumber}`
  }  

  static canProcess(routeGTFSID, mode) {
    return routeGTFSID.includes('-aus-')
  }

}

/**
 * Used to represent a Metro train route on the new data
 *
 * Used for a technicality where the route name (eg Pakenham) is stored in the route number instead.
 */
class MetroGTFSRoute extends GTFSRoute {

  constructor(data) {
    super(data)
    this.routeName = this.routeNumber
    this.routeNumber = null
  }

  static canProcess(routeGTFSID, mode) {
    return mode === TRANSIT_MODES.metroTrain
  }

}

/**
 * Used to represent a Metro train route on the new data
 *
 * Required to parse the route ID which is of a slightly different format
 */
class NewMetroGTFSRoute extends MetroGTFSRoute {

  static canProcess(routeGTFSID, mode) {
    return super.canProcess(routeGTFSID, mode) && routeGTFSID.includes(':vic:')
  }

  parseRouteID(routeGTFSID) {
    let [ _, routeNumber ] = routeGTFSID.match(/02\-(\w{3})/)
    return `2-${routeNumber}`
  }  

}