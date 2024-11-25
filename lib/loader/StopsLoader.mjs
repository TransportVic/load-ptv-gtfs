import { getPrimaryStopName, isStreetStop, sanitiseName } from '../../transportvic-data/stop-utils/stop-utils.mjs'
import GTFSStopsReader from '../gtfs-parser/readers/GTFSStopsReader.mjs'

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
      cleanNames: [ cleanName ],

      codedSuburbs: [ sanitiseName(stop.suburb) ], // parity purposes
      codedName: cleanName, // parity purposes
      codedNames: [ cleanName ] // parity purposes
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

    stop.codedName = stop.cleanName
    stop.codedNames = stop.cleanNames
  }

  updateStopSuburb(stop) {
    stop.cleanSuburbs = stop.bays
      .map(bay => sanitiseName(bay.suburb))
      .filter((e, i, a) => a.indexOf(e) === i)

    stop.suburb = stop.bays
      .map(bay => bay.suburb)
      .filter((e, i, a) => a.indexOf(e) === i)
      .sort()

      stop.codedSuburbs = stop.cleanSuburbs
  }

  async mergeStops(matchingStop, stopData) {
    matchingStop.bays.push(stopData.bays[0])

    this.updateStopSuburb(matchingStop)
    this.updateStopName(matchingStop)

    await this.#stops.replaceDocument({
      _id: matchingStop._id
    }, matchingStop)
  }

  /**
   * Loads the stops into the database.
   * @param {object} options Options for loading the stop data in
   * @param {function} options.processStop Used to process as stop's data.
   * @param {function} options.getMergeName Used to get a stop's merge name. Return null to use the default merge name.
   */
  async loadStops({ processStop, getMergeName } = {}) {
    await this.#stopsReader.open()
    while (this.#stopsReader.available()) {
      let stop = await this.#stopsReader.getNextEntity()

      let processedData = processStop ? processStop(stop) : stop

      let defaultMergeName = this.getMergeName(processedData)
      let mergeName = getMergeName ? (getMergeName(processedData) || defaultMergeName) : defaultMergeName 

      let stopData = this.generateDBStopData(processedData, mergeName)
      let matchingStop = await this.findMatchingStop(processedData, mergeName)

      if (matchingStop) {
        await this.mergeStops(matchingStop, stopData)
      } else {
        await this.#stops.createDocument(stopData)
      }
    }
  }
}