import GTFSShape from '../GTFSShape.mjs'
import { GTFSStopTime } from '../GTFSStopTime.mjs'
import CSVLineReader from './line-reader.mjs'

export default class GTFSShapeReader {

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
    let firstLine = await this.#reader.nextLine()
    let shapeID = firstLine.shape_id
    
    let lines = [ firstLine ]

    while (this.#reader.available()) {
      let nextLine = await this.#reader.nextLine()
      if (nextLine.shape_id !== shapeID) {
        this.#reader.unreadLine()
        break
      } else {
        lines.push(nextLine)
      }
    }

    let points = lines.map(line => this.processEntity(line))

    return {
      shapeID,
      points,
      shapeLength: points[points.length - 1].distance
    }
  }

  /**
   * Converts a CSV row into a shape point object
   * 
   * @param {object} data A JSON object containing the following fields:
   * @param {string} data.shape_pt_lat The shape point's latitude
   * @param {string} data.shape_pt_lon The shape point's longitude
   * @param {string} data.shape_pt_sequence The shape point's sequence in the overall shape
   * @param {string} data.shape_dist_traveled The distance travelled up to that point in the shape
   * 
   * @returns {GTFSShape} An object representing the shape data
   */
  processEntity(data) {
    let shapeData = {
      latitude: parseFloat(data.shape_pt_lat),
      longitude: parseFloat(data.shape_pt_lon),
      distance: parseFloat(data.shape_dist_traveled)
    }

    return new GTFSShape(shapeData)
  }
}