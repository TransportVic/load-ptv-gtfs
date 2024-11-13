import GTFSAgency from '../GTFSAgency.mjs'
import GTFSReader from './GTFSReader.mjs'

export default class GTFSAgencyReader extends GTFSReader {
 
  /**
   * Converts a CSV row into an operator object
   * 
   * @param {object} data A JSON object containing the following fields:
   * - id: The operator ID
   * - name: The operator name
   * - website: The operator's website
   * - phone: The operator's phone number
   * 
   * @returns {GTFSAgency} An object representing the operator data
   */
  processEntity(data) {
    let agencyData = {
      id: data.agency_id,
      name: data.agency_name,
      website: data.agency_url,
      phone: data.agency_phone
    }

    return new GTFSAgency(agencyData)
  }
}