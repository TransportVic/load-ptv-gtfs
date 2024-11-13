import GTFSAgency from './GTFSAgency.mjs'
import CSVLineReader from './line-reader.mjs'

export default class GTFSAgencyReader {
 
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
   * Checks if there are more operators available for reading
   * 
   * @returns {boolean} Returns true if there are more operators available
   */
  available() {
    return this.#reader.available()
  }

  /**
   * Gets the data of the next operator in the file.
   * 
   * @returns {Promise<GTFSAgency>} The data of the next operator
   */
  async getNextAgency() {
    return GTFSAgencyReader.processAgency(await this.#reader.nextLine())
  }

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
  static processAgency(data) {
    let agencyData = {
      id: data.agency_id,
      name: data.agency_name,
      website: data.agency_url,
      phone: data.agency_phone
    }

    return new GTFSAgency(agencyData)
  }
}