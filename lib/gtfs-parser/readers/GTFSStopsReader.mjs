import { GTFSStop, GTFSPlatformStop } from '../GTFSStop.mjs'
import GTFSReader from './GTFSReader.mjs'

export default class GTFSStopsReader extends GTFSReader {
 
  #suburbData

  constructor(file, suburbData) {
    super(file)
    this.#suburbData = suburbData
  }

  /**
   * Converts a CSV row into a stop object
   * 
   * @param {object} data A JSON object containing the following fields:
   * @param {string} data.stop_id The stop ID
   * @param {string} data.stop_name The stop's name
   * @param {string} data.stop_lat The stop's latitude
   * @param {string} data.stop_lon The stop's longitude
   * @param {string} [data.platform] The stop's platform number. Optional, stops without a platform (eg bus stops) do not need to provide this
   * 
   * @returns {GTFSStop} An object representing the stop data
   */
  processEntity(data) {
    let stopData = {
      stopGTFSID: data.stop_id,
      stopName: data.stop_name,
      stopLat: data.stop_lat,
      stopLon: data.stop_lon,
      platform: data.platform_code,
      locationType: data.location_type,
      parentStopGTFSID: data.parent_station
    }

    return GTFSStop.create(stopData, this.#suburbData)
  }
}