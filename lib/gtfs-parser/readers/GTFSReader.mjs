import CSVLineReader from './line-reader.mjs'

export default class GTFSReader {
 
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
   * Checks if there is more data available for reading
   * 
   * @returns {boolean} Returns true if there is more data available
   */
  available() {
    return this.#reader.available()
  }

  /**
   * Gets the data of the next entity in the file.
   * 
   * @returns {Promise<GTFSEntity>} The data of the next entity
   */
  async getNextEntity() {
    return this.processEntity(await this.#reader.nextLine())
  }

  /**
   * Converts a CSV row into its entity data
   * @param {object} data The CSV row data
   * 
   * @returns {GTFSEntity} An object representing the entity data
   */
  processEntity(data) {
    return null
  }
}