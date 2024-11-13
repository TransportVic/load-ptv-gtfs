import { getPrimaryStopName, isStreetStop, sanitiseName } from '../../transportvic-data/stop-utils/stop-utils.mjs'
import GTFSStopsReader from '../gtfs-parser/readers/GTFSStopsReader.mjs'

import uniqueStops from '../../transportvic-data/excel/stops/unique-stops.json' with { type: 'json' }
import nameOverrides from '../../transportvic-data/excel/stops/name-overrides.json' with { type: 'json' }

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
    if (uniqueStops.includes(stop.fullStopName)) return stop.fullStopName

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
    let cleanName = sanitiseName(stop.fullStopName)

    return {
      stopName: stop.fullStopName,
      suburb: [ stop.suburb ],
      cleanSuburbs: [ sanitiseName(stop.suburb) ],
      bays: [ stop.getBayData(this.#mode) ],
      location: {
        type: 'MultiPoint',
        coordinates: [ stop.location.coordinates ]
      },
      mergeName,
      services: [],
      screenServices: [],
      cleanName,
      cleanNames: [ cleanName ]
    }
  }

  updateStopName(stop) {
    stop.cleanNames = stop.bays
      .map(bay => sanitiseName(bay.fullStopName))
      .filter((e, i, a) => a.indexOf(e) === i)

    if (stop.cleanNames.length > 1) {
      stop.stopName = stop.mergeName
      stop.cleanName = sanitiseName(stop.stopName)

      if (!stop.cleanNames.includes(stop.cleanName)) stop.cleanNames.push(stop.cleanName)
    }
  }

  updateStopSuburb(stop) {
    stop.cleanSuburbs = stop.bays
      .map(bay => sanitiseName(bay.suburb))
      .filter((e, i, a) => a.indexOf(e) === i)

    stop.suburb = stop.bays
      .map(bay => bay.suburb)
      .filter((e, i, a) => a.indexOf(e) === i)
      .sort()
  }

  #updateName(stop) {
    if (!nameOverrides[this.#mode]) return
    let updatedName = nameOverrides[this.#mode][stop.fullStopName]
    if (!updatedName) return

    stop.fullStopName = updatedName
  }

  async mergeStops(matchingStop, stopData) {
    matchingStop.bays.push(stopData.bays[0])

    this.updateStopSuburb(matchingStop)
    this.updateStopName(matchingStop)

    await this.#stops.replaceDocument({
      _id: matchingStop._id
    }, matchingStop)
  }

  async loadStops() {
    await this.#stopsReader.open()
    while (this.#stopsReader.available()) {
      let stop = await this.#stopsReader.getNextEntity()
      this.#updateName(stop)

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