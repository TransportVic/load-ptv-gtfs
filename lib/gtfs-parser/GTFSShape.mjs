export class GTFSShapePoint {

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

export class GTFSShape {
  
  shapeID
  points

  shapeLength
  hash

  constructor(shapeID, points) {
    this.shapeID = shapeID
    this.points = points

    let lastPoint = points[points.length - 1]
    this.shapeLength = lastPoint.distance
    this.hash = `${this.shapeLength}-${points[0].coordinates.join(',')}-${lastPoint.coordinates.join(',')}`
  }

}