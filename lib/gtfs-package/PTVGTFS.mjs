import fetch from 'node-fetch'
import AdmZip from 'adm-zip'
import { pipeline } from 'stream/promises'
import path from 'path'
import { createWriteStream } from 'fs'
import { unlink } from 'fs/promises'

export default class PTVGTFS {

  #url
  #destinationFolder
  #gtfsFile
  #headResponse
  
  /**
   * Constructs a new instance of a PTVGTFS class representing a GTFS release.
   * 
   * @param {string} url The URL pointing to the GTFS resource
   */
  constructor(url) {
    this.#url = url
  }

  /**
   * Gets when the GTFS file was released.
   * 
   * @returns {Promise<Date>} The date/time at which the GTFS file was released.
   */
  async getPublishedDate() {
    this.#headResponse = await fetch(this.#url, {
      method: 'HEAD'
    })

    let lastModified = this.#headResponse.headers.get('last-modified')
    return new Date(lastModified)
  }

  /**
   * Downloads the PTV GTFS file to the specified folder. It will be given the name `gtfs.zip`. 
   * 
   * @param {string} destinationFolder The folder to save the GTFS archive to.
   */
  async download(destinationFolder) {
    this.#destinationFolder = destinationFolder
    let response = await fetch(this.#url)

    this.#gtfsFile = path.join(destinationFolder, 'gtfs.zip')
    let outputStream = createWriteStream(this.#gtfsFile)

    await pipeline(response.body, outputStream)
  }

  #getModeFolder(mode) {
    return path.join(this.#destinationFolder, mode)
  }

  #getModeFile(mode) {
    let modeFolder = this.#getModeFolder(mode)
    return path.join(modeFolder, 'google_transit.zip')
  }

  async #unzipMode(mode) {
    let modeFolder = this.#getModeFolder(mode)
    let modeFile = this.#getModeFile(mode)
    let zip = new AdmZip(modeFile)

    await new Promise(resolve => zip.extractAllToAsync(modeFolder, true, resolve))
  }

  /**
   * Unzips the PTV GTFS archive into its individual transit mode folders, then unzips the invididual mode archives as well.
   */
  async unzip() {
    if (!this.#destinationFolder) throw new Error('Need to download GTFS file first!')

    let zip = new AdmZip(this.#gtfsFile)
    await new Promise(resolve => zip.extractAllToAsync(this.#destinationFolder, true, resolve))

    for (let mode = 1; mode <= 11; mode++) {
      if (mode === 9) continue
      await this.#unzipMode(mode.toString())
    }
  }

  /**
   * Cleans up the zip files only.
   */
  async cleanup() {
    await unlink(this.#gtfsFile)

    for (let mode = 1; mode <= 11; mode++) {
      if (mode === 9) continue
      await unlink(this.#getModeFile(mode.toString()))
    }
  }
}