import fetch from 'node-fetch'
import AdmZip from 'adm-zip'
import { pipeline } from 'stream/promises'
import path from 'path'
import { createWriteStream } from 'fs'

export default class PTVGTFS {

  #url
  #destinationFolder
  #gtfsFile
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

    this.#gtfsFile = path.join(destinationFolder, 'gtfs.zip')
    let outputStream = createWriteStream(this.#gtfsFile)

    await pipeline(response.body, outputStream)
  }

  async #unzipMode(mode) {
    let modeFolder = path.join(this.#destinationFolder, mode)
    let modeFile = path.join(modeFolder, 'google_transit.zip')
    let zip = new AdmZip(modeFile)

    await new Promise(resolve => zip.extractAllToAsync(modeFolder, true, resolve))
  }

  async unzip() {
    if (!this.#destinationFolder) throw new Error('Need to download GTFS file first!')

    let zip = new AdmZip(this.#gtfsFile)
    await new Promise(resolve => zip.extractAllToAsync(this.#destinationFolder, true, resolve))

    for (let mode = 1; mode <= 11; mode++) {
      if (mode === 9) continue
      await this.#unzipMode(mode.toString())
    }
  }
}