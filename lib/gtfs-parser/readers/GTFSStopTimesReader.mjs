import { GTFSStopTime } from '../GTFSStopTime.mjs'
import CSVLineReader from './line-reader.mjs'

export default class GTFSStopTimesReader {

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
    let tripID = firstLine.trip_id
    
    let lines = [ firstLine ]

    while (this.#reader.available()) {
      let nextLine = await this.#reader.nextLine()
      if (nextLine.trip_id !== tripID) {
        this.#reader.unreadLine()
        break
      } else {
        lines.push(nextLine)
      }
    }

    return {
      tripID,
      stops: lines.map(line => this.processEntity(line))
    }
  }

  /**
   * Converts a CSV row into a stop time object
   * 
   * @param {object} data A JSON object containing the following fields:
   * @param {string} data.arrival_time The stop's arrival time
   * @param {string} data.departure_time The stop's departure time
   * @param {string} data.stop_id The stop ID
   * @param {string} data.stop_sequence The stop sequence
   * @param {string} data.pickup_type The pickup conditions. "0" for no restrictions and "1" for no pickup allowed
   * @param {string} data.drop_off_type The dropoff conditions. "0" for no restrictions and "1" for no dropoff allowed
   * @param {string} data.shape_dist_traveled The distance travelled along the shape
   * 
   * @returns {GTFSStopTime} An object representing the stop data
   */
  processEntity(data) {
    let stopData = {
      arrivalTime: data.arrival_time,
      departureTime: data.departure_time,
      stopID: data.stop_id,
      stopSequence: data.stop_sequence,
      pickup: data.pickup_type,
      dropoff: data.drop_off_type,
      distance: data.shape_dist_traveled
    }

    return new GTFSStopTime(stopData)
  }
}