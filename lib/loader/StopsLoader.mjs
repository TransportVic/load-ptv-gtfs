import { getPrimaryStopName, isStreetStop } from '../../transportvic-data/stop-utils/stop-utils.mjs'
import GTFSStopsReader from '../gtfs-parser/GTFSStops.mjs'

export default class StopsLoader {

  #stops
  #mode
  #stopsReader

  constructor(stopsFile, mode, database) {
    this.#stops = database.getCollection('stops')
    this.#mode = mode
    this.#stopsReader = new GTFSStopsReader(stopsFile)
  }

  getMergeName(stop) {
    if (isStreetStop(stop.fullStopName)) return stop.fullStopName
    return getPrimaryStopName(stop.fullStopName)
  }

  async findMatchingStop(stop, mergeName) {
    return await this.#stops.findDocument({
      mergeName,
      location: {
        $nearSphere: {
          $geometry: stop.location,
          $maxDistance: 500
        }
      }
    })
  }

  generateDBStopData(stop, mergeName) {
    return {
      stopName: stop.fullStopName,
      suburb: [ stop.suburb ],
      bays: [ stop.getBayData(this.#mode) ],
      location: {
        type: 'MultiPoint',
        coordinates: [ stop.location.coordinates ]
      },
      mergeName,
      services: [],
      screenService: [],
    }
  }

  async mergeStops(matchingStop, stopData) {
    matchingStop.bays.push(stopData.bays[0])

    await this.#stops.replaceDocument({
      _id: matchingStop._id
    }, matchingStop)
  }

  async loadStops() {
    await this.#stopsReader.open()
    while (this.#stopsReader.available()) {
      let stop = await this.#stopsReader.getNextStop()
      let mergeName = this.getMergeName(stop)

      let stopData = this.generateDBStopData(stop, mergeName)

      let matchingStop = await this.findMatchingStop(stop, mergeName)

      if (matchingStop) {
        await this.mergeStops(matchingStop, stopData)
      } else {
        await this.#stops.createDocument(stopData)
      }
    }
  }

}