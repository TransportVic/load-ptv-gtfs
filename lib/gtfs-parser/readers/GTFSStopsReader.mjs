import { GTFSStop, GTFSPlatformStop } from '../GTFSStop.mjs'
import CSVLineReader from './line-reader.mjs'

export default class GTFSStopsReader {
 
  /** @type {string} */
  #file
  #reader

  constructor(file) {
    this.#file = file
    this.#reader = new CSVLineReader(file)
  }

  /**
   * Opens the underlying `CSVLineReader`
   */
  async open() {
    await this.#reader.open()
  }

  /**
   * Checks if there are more stops available for reading
   * 
   * @returns {boolean} Returns true if there are more stops available
   */
  available() {
    return this.#reader.available()
  }

  /**
   * Gets the data of the next stop in the file.
   * 
   * @returns {Promise<GTFSStop>} The stop data of the next stop
   */
  async getNextStop() {
    return GTFSStopsReader.processStop(await this.#reader.nextLine())
  }

  /**
   * Converts a CSV row into a stop object
   * 
   * @param {object} data A JSON object containing the following fields:
   * - stopGTFSID: The stop ID
   * - stopName: The stop name
   * - stopLat/stopLon: The stop's latitude and longitude data
   * - platform (optional): The stop's platform number. Optional, stops without a platform (eg bus stops) do not need to provide this
   * 
   * @returns {GTFSStop} An object representing the stop data
   */
  static processStop(data) {
    let stopData = {
      stopGTFSID: data.stop_id,
      stopName: data.stop_name,
      stopLat: data.stop_lat,
      stopLon: data.stop_lon
    }

    if (data.platform_code && data.platform_code.length) {
      return new GTFSPlatformStop({
        ...stopData,
        platform: data.platform_code
      })
    }

    return new GTFSStop(stopData)
  }
}