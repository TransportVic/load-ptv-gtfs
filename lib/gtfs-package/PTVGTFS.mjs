import fetch from 'node-fetch'

export default class PTVGTFS {

  #url
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

}