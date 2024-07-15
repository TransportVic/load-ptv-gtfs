import lineReader from 'line-reader'

export default class CSVLineReader {

  #headers
  #file
  #unread
  #previousLine
  #reader

  constructor(file) {
    this.#headers = []
    this.#file = file
    this.#unread = false
    this.#previousLine = null
  }

  open() {
    return new Promise(resolve => {
      lineReader.open(this.#file, async (err, reader) => {
        this.#reader = reader

        this.#headers = (await this.#readNextLine()).split(',')
        resolve()
      })
    })
  }

  available() {
    return this.#reader.hasNextLine()
  }

  #readNextLine() {
    return new Promise(resolve => {
      this.#reader.nextLine((err, line) => {
        resolve(line)
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

  nextLine() {
    if (this.unread) {
      this.unread = false
      return this.previousLine
    }

    let line = this.#setHeaders(this.#readNextLine())
    this.previousLine = line

    return line
  }

  unreadLine() {
    this.unread = true
  }

  async close() {
    return new Promise(resolve => {
      this.#reader.close(() => {
        resolve()
      })
    })
  }

  getHeaders() {
    return this.#headers
  }
}