import fetch from 'node-fetch'
import AdmZip from 'adm-zip'
import { pipeline } from 'stream/promises'
import path from 'path'
import { createWriteStream } from 'fs'

export default class PTVGTFS {

  #url
  #destinationFolder
  #headResponse
  
  /**
   * Constructs a new instance of a PTVGTFS class representing a GTFS release
   * 
   * @param {string} url The URL pointing to the GTFS resource
   */
  constructor(url) {
    this.#url = url
  }

  async getPublishedDate() {
    this.#headResponse = await fetch(this.#url, {
      method: 'HEAD'
    })

    let lastModified = this.#headResponse.headers.get('last-modified')
    return new Date(lastModified)
  }

  async download(destinationFolder) {
    this.#destinationFolder = destinationFolder
    let response = await fetch(this.#url)

    let outputFile = path.join(destinationFolder, 'gtfs.zip')
    let outputStream = createWriteStream(outputFile)

    await pipeline(response.body, outputStream)
  }
}