import { booleanPointInPolygon } from '@turf/turf'

import path from 'path'
import url from 'url'
import fs from 'fs/promises'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const suburbBoundariesFile = path.join(__dirname, '../..', 'transportvic-data', 'geospatial', 'suburb-boundaries', 'data.geojson')
const suburbBoundaries = JSON.parse(await fs.readFile(suburbBoundariesFile))

export default class GTFSStop {
 
  stopGTFSID
  originalName
  rawStopName
  stopNumber
  location
  suburb

  constructor(stopGTFSID, stopName, stopLat, stopLon) {
    this.stopGTFSID = stopGTFSID
    this.originalName = stopName
    this.location = {
      type: 'Point',
      coordinates: [parseFloat(stopLon), parseFloat(stopLat)]
    }

    this.#setSuburb()
    this.#setStopNumber()
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

  getSuburbFromLocation() {
    // Kinda inefficient but it's not expected this will be used very often unless PTV breaks the whole dataset (again)
    let suburb = suburbBoundaries.features.find(suburb => booleanPointInPolygon(this.location, suburb))
    return suburb.properties.LOC_NAME
  }

  getSuburbFromName() {
    let suburbIndex = this.originalName.lastIndexOf('(')
    return this.originalName.slice(suburbIndex + 1, -1)
  }

  #setSuburb() {
    if (this.requiresSuburb()) {
      this.suburb = this.getSuburbFromLocation()
    } else {
      this.suburb = this.getSuburbFromName()
    }
  }

  getStopNameWithoutSuburb() {
    if (this.requiresSuburb()) return this.originalName
    else return this.originalName.slice(0, this.originalName.lastIndexOf('(') - 1)
  }

  matchStopNumber() {
    let stopNumberParts
    let stopName = this.getStopNameWithoutSuburb()

    if (stopNumberParts = stopName.match(/^(D?\d+[A-Za-z]?)-(.+)$/)) {
      return {
        stopNumber: stopNumberParts[1].toUpperCase(),
        stopName: stopNumberParts[2]
      }
    }

    if (stopNumberParts = stopName.match(/^(.*) - Stop (D?\d*[A-Za-z]?)$/)) {
      return {
        stopNumber: stopNumberParts[2].toUpperCase(),
        stopName: stopNumberParts[1]
      }
    }

    return { stopNumber: null, stopName: stopName }
  }

  #setStopNumber() {
    let { stopNumber, stopName } = this.matchStopNumber()
    this.stopNumber = stopNumber
    this.rawStopName = stopName
  }

  getPrimaryStopName() {
    let slashIndex = this.rawStopName.lastIndexOf('/')
    if (slashIndex === -1) return this.rawStopName
    return this.rawStopName.slice(0, slashIndex)
  }

  getSecondaryStopName() {
    let slashIndex = this.rawStopName.lastIndexOf('/')
    if (slashIndex === -1) return ''

    return this.rawStopName.slice(slashIndex + 1)
  }

  static amendStopDirection(stopName) {
    return stopName.replace(/(.*?) +\( *(\w+)(?: +Side)?\) +(.+)/i, (match, name, direction, road) => {
      // Handles the format "Name (Direction) Rd"
      return `${name} ${road} - ${direction[0].toUpperCase()}${direction.slice(1).toLowerCase()}`
    }).replace(/(.*?) +\( *(\w+)(?: +Side)?\)/i, (match, road, direction) => {
      return `${road} - ${direction[0].toUpperCase()}${direction.slice(1).toLowerCase()}`
    })
  }
}