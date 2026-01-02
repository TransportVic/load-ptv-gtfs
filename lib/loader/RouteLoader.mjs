import GTFSRouteReader from '../gtfs-parser/readers/GTFSRouteReader.mjs'
import GTFSAgencyReader from '../gtfs-parser/readers/GTFSAgencyReader.mjs'
import { STOP_UTILS } from '@transportme/transportvic-utils'
import GTFSRoute from '../gtfs-parser/GTFSRoute.mjs'
import GTFSAgency from '../gtfs-parser/GTFSAgency.mjs'

const { sanitiseName } = STOP_UTILS

export default class RouteLoader {

  #routes
  #mode
  #routesReader
  #operators = {}
  #agencyFile
  #routesFile

  #routeIDMap = {}


  /**
   * Creates a new Shape Loader.
   * 
   * @param {string} routesFile The path for the routes.txt file
   * @param {string} agencyFile The path for the agency.txt file
   * @param {string} mode The route's mode
   * @param {DatabaseConnection} database A database connection
   */
  constructor(routesFile, agencyFile, mode, database) {
    this.#routes = this.getRoutesDB(database)
    this.#mode = mode
    this.#routesFile = routesFile
    this.#agencyFile = agencyFile 
  }

  getRoutesDB(db) {
    return db.getCollection('gtfs-routes')
  }

  createRouteReader(routesFile, mode) {
    return new GTFSRouteReader(routesFile, mode)
  }

  async loadAgencies() {
    let agencyReader = new GTFSAgencyReader(this.#agencyFile)
    await agencyReader.open()
    while (agencyReader.available()) {
      let agency = await agencyReader.getNextEntity()
      this.#operators[agency.id] = agency
    }
  }

  async findMatchingRoute(routeData) {
    return await this.#routes.findDocument({
      routeGTFSID: routeData.routeGTFSID
    })
  }

  generateDBRouteData(route) {
    return {
      mode: this.#mode,
      routeName: route.routeName,
      cleanName: sanitiseName(route.routeName),
      routeNumber: route.routeNumber,
      routeGTFSID: route.routeGTFSID,
      routePath: [],
      operators: [ this.getOperator(route.agencyID).name ],
      directions: [],

      codedName: sanitiseName(route.routeName)
    }
  }

  async mergeRoutes(matchingRoute, routeData) {
    if (!matchingRoute.operators.includes(routeData.operators[0])) {
      matchingRoute.operators.push(routeData.operators[0])
    }

    await this.#routes.replaceDocument({
      _id: matchingRoute._id
    }, matchingRoute)
  }

  /**
   * Loads a route into the database
   * 
   * @param {GTFSRoute} route The route being added
   * @param {function} [processRoute] Used to modify the route data. Should return null to drop the route
   */
  async loadRoute(route, processRoute) {
    let originalRouteID = route.originalRouteGTFSID
    let routeData = this.generateDBRouteData(route)
    let processedData = processRoute ? await processRoute(routeData) : routeData
    if (!processedData) return

    this.#routeIDMap[originalRouteID] = processedData.routeGTFSID

    let matchingRoute = await this.findMatchingRoute(processedData)

    if (matchingRoute) {
      await this.mergeRoutes(matchingRoute, processedData)
    } else {
      await this.#routes.createDocument(processedData)
    }
  }

  /**
   * Loads the route data into the database.
   * 
   * @param {Object} options An optional parameter to allow for custom route processing
   * @param {function} [options.processRoute] A function to modify the route data. If a route should be dropped, it should return null.
   */
  async loadRoutes({ processRoute } = {}) {
    await this.loadAgencies()

    this.#routesReader = this.createRouteReader(this.#routesFile, this.#mode)

    await this.#routesReader.open()
    while (this.#routesReader.available()) {
      try {
        let route = await this.#routesReader.getNextEntity()
        await this.loadRoute(route, processRoute)
      } catch (e) {
        console.error('Failed to load route', e)
      }
    }
  }

  getOperator(id) {
    let operator = this.#operators[id]
    if (operator) return operator
    return GTFSAgency.UNKNOWN_AGENCY
  }

  getRouteIDMap() {
    return this.#routeIDMap
  }
}