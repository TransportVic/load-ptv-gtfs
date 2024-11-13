import GTFSRouteReader from '../gtfs-parser/GTFSRouteReader.mjs'

export default class RouteLoader {

  #routes
  #mode
  #stopsReader
  #operators

  constructor(routesFile, agencyFile, mode, database) {
    this.#routes = database.getCollection('stops')
    this.#mode = mode
    this.#stopsReader = new GTFSRouteReader(routesFile)
  }

}