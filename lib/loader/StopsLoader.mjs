import { STOP_UTILS } from '@transportme/transportvic-utils'
import { GTFSStop, STOP_TYPE } from '../gtfs-parser/GTFSStop.mjs'
import GTFSStopsReader from '../gtfs-parser/readers/GTFSStopsReader.mjs'

const { getPrimaryStopName, isStreetStop, sanitiseName } = STOP_UTILS

export default class StopsLoader {

  #stops
  #mode
  #stopsReader

  #parentHolding = {}

  /**
   * Creates a new Stop Loader.
   * 
   * @param {string} stopsFile The path for the stops.txt file
   * @param {FeatureCollection} suburbs A GeoJSON FeatureCollection containing a list of all suburbs located within Victoria
   * @param {string} mode The transit mode being loaded
   * @param {DatabaseConnection} database A database connection
   * @param {function} [suburbHook] A hook that returns the stop's suburb, or null if unavailable. This function is called before processing from the stop's name or location
   * 
   */
  constructor(stopsFile, suburbs, mode, database, suburbHook) {
    this.#stops = this.getStopsDB(database)
    this.#mode = mode
    this.#stopsReader = this.createStopReader(stopsFile, suburbs, suburbHook)
  }

  getStopsDB(db) {
    return db.getCollection('gtfs-stops')
  }

  createStopReader(stopsFile, suburbs, suburbHook) {
    return new GTFSStopsReader(stopsFile, suburbs, suburbHook)
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

  async findParentStop(stop) {
    return await this.#stops.findDocument({
      'bays.stopGTFSID': stop.parentStopGTFSID
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
      .filter(bay => bay.stopType === STOP_TYPE[0] || bay.stopType === STOP_TYPE[1])
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
      .filter(bay => bay.stopType === STOP_TYPE[0] || bay.stopType === STOP_TYPE[1])
      .map(bay => sanitiseName(bay.suburb))
      .filter((e, i, a) => a.indexOf(e) === i)

    stop.suburb = stop.bays
      .filter(bay => bay.stopType === STOP_TYPE[0] || bay.stopType === STOP_TYPE[1])
      .map(bay => bay.suburb)
      .filter((e, i, a) => a.indexOf(e) === i)
      .sort()

    stop.codedSuburbs = stop.cleanSuburbs
  }

  updateStopLocation(stop) {
    stop.location.coordinates = stop.bays.map(bay => bay.location.coordinates)
  }

  async mergeStops(matchingStop, stopData) {
    let newBay = stopData.bays[0]
    let hasIdenticalBay = matchingStop.bays.some(bay =>
      bay.mode === newBay.mode && bay.stopGTFSID === newBay.stopGTFSID
    )

    if (hasIdenticalBay) return

    matchingStop.bays.push(newBay)

    this.updateStopSuburb(matchingStop)
    this.updateStopName(matchingStop)
    this.updateStopLocation(matchingStop)

    await this.#stops.replaceDocument({
      _id: matchingStop._id
    }, matchingStop)
  }

  /**
   * Loads a stop into the database.
   *
   * @param {GTFSStop} stop The stop being added
   * @param {object} options Options for loading the stop data in
   * @param {function} options.processStop Used to process as stop's data.
   * @param {function} options.getMergeName Used to get a stop's merge name. Return null to use the default merge name.
   */
  async loadStop(stop, { processStop, getMergeName } = {}) {
    let processedData = processStop ? processStop(stop) : stop
    if (!processedData) return

    if (processedData.parentStopGTFSID) {
      let parentStop = await this.findParentStop(processedData)
      if (!parentStop) {
        if (!this.#parentHolding[processedData.parentStopGTFSID]) this.#parentHolding[processedData.parentStopGTFSID] = []
        this.#parentHolding[processedData.parentStopGTFSID].push(processedData)
        return
      }

      let stopData = this.generateDBStopData(processedData, parentStop.mergeName)
      return await this.mergeStops(parentStop, stopData)
    }

    let defaultMergeName = this.getMergeName(processedData)
    let mergeName = getMergeName ? (getMergeName(processedData) || defaultMergeName) : defaultMergeName

    let stopData = this.generateDBStopData(processedData, mergeName)
    let matchingStop = await this.findMatchingStop(processedData, mergeName)

    let finalStop
    if (matchingStop) {
      await this.mergeStops(matchingStop, stopData)
      finalStop = matchingStop
    } else {
      await this.#stops.createDocument(stopData)
      finalStop = stopData
    }

    if (this.#parentHolding[stop.stopGTFSID]) {
      for (let childStop of this.#parentHolding[stop.stopGTFSID]) {
        let childStopData = this.generateDBStopData(childStop, finalStop.mergeName)
        await this.mergeStops(finalStop, childStopData)
      }
      delete this.#parentHolding[stop.stopGTFSID]
    }
  }

  /**
   * Loads the stops into the database.
   *
   * @param {object} options Options for loading the stop data in
   * @param {function} options.processStop Used to process as stop's data.
   * @param {function} options.getMergeName Used to get a stop's merge name. Return null to use the default merge name.
   */
  async loadStops(options) {
    await this.#stopsReader.open()
    while (this.#stopsReader.available()) {
      try {
        let stop = await this.#stopsReader.getNextEntity()
        await this.loadStop(stop, options)
      } catch (e) {
        console.error('Failed to load stop', e)
      }
    }
  }
}