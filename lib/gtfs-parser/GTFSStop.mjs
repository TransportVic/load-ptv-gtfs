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
  location
  suburb

  constructor(stopGTFSID, stopName, stopLat, stopLon) {
    this.stopGTFSID = stopGTFSID
    this.originalName = stopName
    this.location = {
      type: 'Point',
      coordinates: [parseFloat(stopLon), parseFloat(stopLat)]
    }

    this.setSuburb()
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

  setSuburb() {
    if (this.requiresSuburb()) {
      this.suburb = this.getSuburbFromLocation()
    } else {
      this.suburb = this.getSuburbFromName()
    }
  }
}