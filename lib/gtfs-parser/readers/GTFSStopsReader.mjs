import { GTFSStop, GTFSPlatformStop } from '../GTFSStop.mjs'
import GTFSReader from './GTFSReader.mjs'

export default class GTFSStopsReader extends GTFSReader {
 
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
  processEntity(data) {
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