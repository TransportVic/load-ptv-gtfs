import GTFSStop from './GTFSStop.mjs'

export default class GTFSStops {
 
  /** @type {string} */
  #file

  constructor(file) {
    this.#file = file
  }

  /**
   * Checks if a stop name requires the suburb to be appended
   * 
   * @param {GTFSStop} stopName The stop data
   * @returns {boolean} True if the suburb is required
   */
  static requiresSuburb(stop) {
    let { originalName } = stop
    return originalName[originalName.length - 1] !== ')'
  }

  static addSuburb(stop) {

  }

  static initialProcess(data) {
    return new GTFSStop(
      data.stop_id,
      data.stop_name,
      data.stop_lat,
      data.stop_lon
    )
  }
  
  processRawStop(data) {

  }
}