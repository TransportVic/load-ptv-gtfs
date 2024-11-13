import { sanitiseName } from '../../transportvic-data/stop-utils/stop-utils.mjs'
import GTFSRouteReader from '../gtfs-parser/GTFSRouteReader.mjs'
import GTFSAgencyReader from '../gtfs-parser/GTFSAgencyReader.mjs'

export default class RouteLoader {

  #routes
  #mode
  #routesReader
  #operators = {}
  #agencyFile

  constructor(routesFile, agencyFile, mode, database) {
    this.#routes = database.getCollection('routes')
    this.#mode = mode
    this.#routesReader = new GTFSRouteReader(routesFile)
    this.#agencyFile = agencyFile
  }

  async loadAgencies() {
    let agencyReader = new GTFSAgencyReader(this.#agencyFile)
    await agencyReader.open()
    while (agencyReader.available()) {
      let agency = await agencyReader.getNextAgency()
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
      mode: route.mode,
      routeName: route.routeName,
      cleanName: sanitiseName(route.routeName),
      routeNumber: route.routeNumber,
      routeGTFSID: route.routeGTFSID,
      routePath: [],
      operators: [ this.#operators[route.agencyID].name ],
      directions: []
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

  async loadRoutes() {
    this.loadAgencies()

    await this.#routesReader.open()
    while (this.#routesReader.available()) {
      let route = await this.#routesReader.getNextRoute()

      let routeData = this.generateDBRouteData(route)

      let matchingRoute = await this.findMatchingRoute(routeData)

      if (matchingRoute) {
        await this.mergeRoutes(matchingRoute, routeData)
      } else {
        await this.#routes.createDocument(routeData)
      }
    }
  }

  getOperator(id) {
    return this.#operators[id]
  }
}