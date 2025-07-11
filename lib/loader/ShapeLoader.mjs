import { GTFSStop } from '../gtfs-parser/GTFSStop.mjs'
import GTFSShapeReader from '../gtfs-parser/readers/GTFSShapeReader.mjs'

export default class ShapeLoader {

  #routes
  #shapeReader

  #routeCache = {}

  /**
   * Creates a new Shape Loader.
   * 
   * @param {string} shapeFile The path for the shapes.txt file
   * @param {DatabaseConnection} database A database connection
   */
  constructor(shapeFile, database) {
    this.#routes = this.getRoutesDB(database)
    this.#shapeReader = this.createShapeReader(shapeFile)
  }

  getRoutesDB(db) {
    return db.getCollection('gtfs-routes')
  }

  createShapeReader(shapeFile) {
    return new GTFSShapeReader(shapeFile)
  }

  async findMatchingRoute(routeGTFSID) {
    if (this.#routeCache[routeGTFSID]) return this.#routeCache[routeGTFSID]

    let route = await this.#routes.findDocument({
      routeGTFSID: routeGTFSID
    })

    this.#routeCache[routeGTFSID] = route
    return route
  }

  async updateRoute(routeGTFSID, routePath) {
    this.#routeCache[routeGTFSID].routePath = routePath
  }

  generateDBShapeData(shape) {
    return {
      fullGTFSIDs: [ shape.shapeID ],
      hash: shape.hash,
      length: shape.shapeLength,
      path: {
        type: 'LineString',
        coordinates: shape.points.map(point => point.coordinates)
      }
    }
  }

  /**
   * Loads a shape into the database.
   *
   * @param {GTFSStop} shape The shape being added
   * @param {function} options.shapeIDMap A mapping of shape IDs to their trip IDs.
   */
  async loadShape(shape, shapeIDMap) {
    let routeGTFSID = shapeIDMap[shape.shapeID]
    if (!routeGTFSID) return // All trips corresponding to that shape must have been dropped

    let routeData = await this.findMatchingRoute(routeGTFSID)

    let matchingShape = routeData.routePath.find(path => path.hash === shape.hash)
    if (matchingShape) {
      matchingShape.fullGTFSIDs.push(shape.shapeID)
    } else {
      routeData.routePath.push(this.generateDBShapeData(shape))
    }

    await this.updateRoute(routeGTFSID, routeData.routePath)
  }

  /**
   * Loads the shapes into the database.
   *
   * @param {object} options Options for loading the shape data in
   * @param {function} options.shapeIDMap A mapping of shape IDs to their trip IDs.
   */
  async loadShapes({ shapeIDMap }) {
    await this.#shapeReader.open()

    let shapesLoaded = 0

    while (this.#shapeReader.available()) {
      let shape = await this.#shapeReader.getNextEntity()
      await this.loadShape(shape, shapeIDMap)

      if (++shapesLoaded === 1000) {
        await this.writeShapes()
        shapesLoaded = 0
      }
    }
    await this.writeShapes()
  }

  async writeShapes() {
    let dirtyShapes = Object.keys(this.#routeCache)
    if (!dirtyShapes.length) return

    let bulkUpdate = dirtyShapes.map(routeGTFSID => ({
      updateOne: {
        filter: { routeGTFSID },
        update: {
          $set: { routePath: this.#routeCache[routeGTFSID].routePath }
        }
      }
    }))

    await this.#routes.bulkWrite(bulkUpdate)
    this.#routeCache = {}
  }
}