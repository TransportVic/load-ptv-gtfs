import GTFSRouteReader from '../gtfs-parser/GTFSRouteReader.mjs'
import GTFSAgencyReader from '../gtfs-parser/GTFSAgencyReader.mjs'

export default class RouteLoader {

  #routes
  #mode
  #stopsReader
  #operators = {}
  #agencyFile

  constructor(routesFile, agencyFile, mode, database) {
    this.#routes = database.getCollection('stops')
    this.#mode = mode
    this.#stopsReader = new GTFSRouteReader(routesFile)
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

  async loadRoutes() {
    this.loadAgencies()
  }

  getOperator(id) {
    return this.#operators[id]
  }
}