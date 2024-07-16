import GTFSStopsReader from '../gtfs-parser/GTFSStops.mjs'

export default class StopsLoader {

  #database
  #mode
  #stopsReader

  constructor(stopsFile, mode, database) {
    this.#database = database
    this.#mode = mode
    this.#stopsReader = new GTFSStopsReader(stopsFile)
  }

  async loadStops() {
    while (this.#stopsReader.available()) {
      let stop = await this.#stopsReader.getNextStop()
    }
  }

}