export default class GTFSShape {

  #latitude
  #longitude
  distance

  get coordinates() {
    return [
      this.#longitude, this.#latitude
    ]
  }

  constructor({ latitude, longitude, distance }) {
    this.#latitude = latitude
    this.#longitude = longitude

    this.distance = distance
  }

}