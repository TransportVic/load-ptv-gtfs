import lineReader from 'line-reader'

export default class CSVLineReader {

  /** @type {String[]}  */
  #headers
  /** @type {string}  */
  #file
  /** @type {boolean}  */
  #unread
  /** @type {Object.<string, string>}  */
  #previousLine
  /** @type {LineReader}  */
  #reader

  /**
   * Constructs a new CSVLineReader for a given file.
   * 
   * @param {string} file The CSV file path
   */
  constructor(file) {
    this.#headers = []
    this.#file = file
    this.#unread = false
    this.#previousLine = null
  }

  /**
   * Opens the CSV file for reading, and reads the first line for the headers.
   */
  async open() {
    await new Promise((resolve, reject) => {
      lineReader.open(this.#file, async (err, reader) => {
        if (err) return reject(err)

        this.#reader = reader
        this.#headers = (await this.#readNextLine()).split(',')
        resolve()
      })
    })
  }

  /**
   * Checks if there is still more data available for reading
   * 
   * @returns {boolean} If there is still a line available
   */
  available() {
    return this.#reader.hasNextLine()
  }

  #readNextLine() {
    return new Promise(resolve => {
      this.#reader.nextLine((err, line) => {
        resolve(line.trim())
      })
    })
  }

  #setHeaders(line) {
    let parts = line.match(/"([^"]*)"/g).map(f => f.slice(1, -1))
    return this.#headers.reduce((acc, header, i) => {
      acc[header] = parts[i]
      return acc
    }, {})
  }

  /**
   * Returns the next line of CSV data, taking into account any unreads.
   * 
   * @async
   * @returns {Promise<Object.<string,string>>} The line data, parsed according to the headers
   */
  async nextLine() {
    if (this.#unread) {
      this.#unread = false
      return this.#previousLine
    }

    let line = this.#setHeaders(await this.#readNextLine())
    this.#previousLine = line

    return line
  }

  /**
   * Unreads a line, causing it to be returned again during the next call to `nextLine()`
   */
  unreadLine() {
    this.#unread = true
  }

  /**
   * Closes the CSV line reader.
   */
  async close() {
    await new Promise(resolve => {
      this.#reader.close(() => {
        resolve()
      })
    })
  }

  /**
   * Returns the CSV headers.
   * 
   * @returns {string[]} A list of headers
   */
  getHeaders() {
    return this.#headers
  }
}