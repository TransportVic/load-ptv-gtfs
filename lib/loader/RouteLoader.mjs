import GTFSRouteReader from '../gtfs-parser/readers/GTFSRouteReader.mjs'
import GTFSAgencyReader from '../gtfs-parser/readers/GTFSAgencyReader.mjs'
import { STOP_UTILS } from '@transportme/transportvic-utils'

const { sanitiseName } = STOP_UTILS

export default class RouteLoader {

  #routes
  #mode
  #routesReader
  #operators = {}
  #agencyFile

  #routeIDMap = {}

  /**
   * Creates a new Shape Loader.
   * 
   * @param {string} routesFile The path for the routes.txt file
   * @param {string} agencyFile The path for the agency.txt file
   * @param {DatabaseConnection} database A database connection
   */
  constructor(routesFile, agencyFile, mode, database) {
    this.#routes = database.getCollection('routes')
    this.#mode = mode
    this.#routesReader = new GTFSRouteReader(routesFile, mode)
    this.#agencyFile = agencyFile
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
      operators: [ this.#operators[route.agencyID].name ],
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
   * Loads the route data into the database.
   * 
   * @param {Object} options An optional parameter to allow for custom route processing
   * @param {function} options.processRoute A function to modify the route data. If a route should be dropped, it should return null.
   */
  async loadRoutes({ processRoute } = { processRoute: r => r }) {
    await this.loadAgencies()

    await this.#routesReader.open()
    while (this.#routesReader.available()) {
      let route = await this.#routesReader.getNextEntity()

      let originalRouteID = route.originalRouteGTFSID
      let routeData = this.generateDBRouteData(route)
      let processedData = await processRoute(routeData)
      if (!processedData) continue

      this.#routeIDMap[originalRouteID] = processedData.routeGTFSID

      let matchingRoute = await this.findMatchingRoute(processedData)

      if (matchingRoute) {
        await this.mergeRoutes(matchingRoute, processedData)
      } else {
        await this.#routes.createDocument(processedData)
      }
    }
  }

  getOperator(id) {
    return this.#operators[id]
  }

  getRouteIDMap() {
    return this.#routeIDMap
  }
}