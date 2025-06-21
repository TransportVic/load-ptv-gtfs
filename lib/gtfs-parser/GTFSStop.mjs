import booleanPointInPolygon from '@turf/boolean-point-in-polygon'
import { STOP_UTILS } from '@transportme/transportvic-utils'

const { processName, getPrimaryStopName, getSecondaryStopName } = STOP_UTILS

export const STOP_TYPE = {
  0: 'stop',
  1: 'station',
  2: 'entrance',
  3: 'generic',
  4: 'boarding',
}

export class GTFSStop {

  stopGTFSID
  originalName
  rawStopName
  fullStopName
  stopNumber
  location
  suburb

  location
  parentStopGTFSID

  #isInterstate = false
  #suburbInFrontMatch

  constructor({ stopGTFSID, stopName, stopLat, stopLon, locationType, parentStopGTFSID }, suburbs, suburbHook = () => null) {
    this.stopGTFSID = stopGTFSID
    this.originalName = stopName.replace(/ \(\w+\.\.\. #/, ' #').replace(/  +/g, ' ').trim()

    this.locationType = locationType || '0'
    this.parentStopGTFSID = parentStopGTFSID || null

    this.location = {
      type: 'Point',
      coordinates: [parseFloat(stopLon), parseFloat(stopLat)]
    }

    this.#setSuburb(suburbs, suburbHook)
    this.#setStopNumber()

    this.fullStopName = this.getFullStopName()
  }

  /**
   * Checks if a stop name requires the suburb to be appended
   * 
   * @returns {boolean} True if the suburb is required
   */
  requiresSuburb() {
    let { originalName } = this
    return originalName[originalName.length - 1] !== ')'
  }

  getSuburbFromLocation(suburbs) {
    // Kinda inefficient but it's not expected this will be used very often unless PTV breaks the whole dataset (again)
    let suburb = suburbs.features.find(suburb => booleanPointInPolygon(this.location, suburb))
    if (suburb) return this.#expandSuburb(suburb.properties.LOC_NAME)

    this.#isInterstate = true
    return 'Interstate'
  }

  getSuburbState(stateIndex) {
    let bracketContent = this.originalName.slice(stateIndex + 1, -2)
    if (!bracketContent.includes('-')) return bracketContent

    let dashIndex = bracketContent.indexOf('-')
    return bracketContent.slice(dashIndex + 2)
  }

  getInterstateSuburb() {
    let stateIndex = this.originalName.lastIndexOf('(')
    let state = this.getSuburbState(stateIndex)
    let suburbIndex = this.originalName.lastIndexOf('(', stateIndex - 1)
    let suburb = this.originalName.slice(suburbIndex + 1, stateIndex - 1)

    return `${this.#expandSuburb(suburb)}, ${state}`
  }

  #expandSuburb(suburb) {
    return suburb.replace(/^St /, 'St. ')
      .replace(/^Mt /, 'Mount ')
  }

  suburbIsInFront() {
    this.#suburbInFrontMatch = this.originalName.match(/^([\w ]+), (.+)/)
    return !this.originalName.endsWith(')') && !!this.#suburbInFrontMatch
  }

  getSuburbFromFrontOfName() {
    return this.#suburbInFrontMatch[1]
  }

  getSuburbFromName() {
    if (this.suburbIsInFront()) return this.getSuburbFromFrontOfName()

    this.#isInterstate = this.originalName.endsWith('))')
    if (this.#isInterstate) return this.getInterstateSuburb()

    let suburbIndex = this.originalName.lastIndexOf('(')
    return this.#expandSuburb(this.originalName.slice(suburbIndex + 1, -1))
  }

  #setSuburb(suburbs, suburbHook) {
    if (this.requiresSuburb()) {
      this.suburb = this.getSuburbFromLocation(suburbs)
    } else {
      this.suburb = this.getSuburbFromName()
    }
  }

  getStopNameWithoutSuburb() {
    if (this.suburbIsInFront()) return this.#suburbInFrontMatch[2]
    else if (this.requiresSuburb()) return this.originalName
    else {
      if (!this.#isInterstate) return this.originalName.slice(0, this.originalName.lastIndexOf('(') - 1)

      let stateIndex = this.originalName.lastIndexOf('(')
      let suburbIndex = this.originalName.lastIndexOf('(', stateIndex - 1)

      return this.originalName.slice(0, suburbIndex - 1)
    }
  }

  matchStopNumber() {
    let stopNumberParts
    let stopName = this.getStopNameWithoutSuburb()

    if (stopName.match(/^\d+\-\d+ \w/)) {
      // Stops in the form 123-456 ABC Road - not a stop number!
      return { stopNumber: null, stopName: stopName }
    }

    if (stopNumberParts = stopName.match(/^(D?\d+[A-Za-z]?)-(.+)$/)) {
      // Stops in the form 123-ABC Road
      return {
        stopNumber: stopNumberParts[1].toUpperCase(),
        stopName: stopNumberParts[2]
      }
    }

    if (stopNumberParts = stopName.match(/^(.*) - Stop (D?\d*[A-Za-z]?)$/)) {
      // Stops in the form ABC Road - Stop 123
      return {
        stopNumber: stopNumberParts[2].toUpperCase(),
        stopName: stopNumberParts[1]
      }
    }

    if (stopNumberParts = stopName.match(/^(.*) #(D?\d*[A-Za-z]?)$/)) {
      // Stops in the form ABC Road #123
      return {
        stopNumber: stopNumberParts[2].toUpperCase(),
        stopName: stopNumberParts[1]
      }
    }

    return { stopNumber: null, stopName }
  }

  #setStopNumber() {
    let { stopNumber, stopName } = this.matchStopNumber()
    this.stopNumber = stopNumber
    this.rawStopName = stopName
  }

  getPrimaryStopName() {
    return getPrimaryStopName(this.rawStopName)
  }

  getSecondaryStopName() {
    return getSecondaryStopName(this.rawStopName)
  }

  getFullStopName() {
    let primaryName = this.getPrimaryStopName()
    let secondaryName = this.getSecondaryStopName()

    let fullStopName = processName(primaryName)
    if (secondaryName.length) fullStopName += `/${processName(secondaryName)}`

    return fullStopName
  }

  getBayData(mode) {
    return {
      originalName: this.originalName,
      fullStopName: this.fullStopName,
      stopGTFSID: this.stopGTFSID,
      location: this.location,
      stopNumber: this.stopNumber,
      mode,
      suburb: this.suburb,
      services: [],
      screenServices: [],
      stopType: STOP_TYPE[this.locationType],
      parentStopGTFSID: this.parentStopGTFSID
    }
  }

  static canProcess(data) {
    return true
  }

  static create(data, suburbs) {
    let types = [ GTFSRRBStop, GTFSPlatformStop, GTFSStop ]
    for (let type of types) {
      if (type.canProcess(data)) return new type(data, suburbs)
    }
  }
}

export class GTFSPlatformStop extends GTFSStop {

  platform

  constructor(data, suburbs) {
    super(data, suburbs)
    this.platform = data.platform
  }

  getBayData(mode) {
    return {
      ...super.getBayData(mode),
      platform: this.platform
    }
  }

  static canProcess(data) {
    return data.platform && data.platform.length
  }

}

export class GTFSRRBStop extends GTFSPlatformStop {

  constructor(data, suburbs) {
    data.stopName = data.stopName.replace('Rail Replacement Bus Stop', 'Railway Station')
    super(data, suburbs)
    this.platform = 'RRB'
  }

  static canProcess(data) {
    return super.canProcess(data) && data.platform.toLowerCase().includes('bus')
  }

}