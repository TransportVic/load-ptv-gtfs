import GTFSStop from './GTFSStop.mjs'

export default class GTFSStops {
 
  /** @type {string} */
  #file

  constructor(file) {
    this.#file = file
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