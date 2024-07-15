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

  addSuburb() {

  }

  getSuburbFromName() {
    let suburbIndex = this.originalName.lastIndexOf('(')
    return this.originalName.slice(suburbIndex + 1, -1)
  }
}