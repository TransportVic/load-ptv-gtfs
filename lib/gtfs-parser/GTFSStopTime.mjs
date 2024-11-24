import { booleanPointInPolygon } from '@turf/turf'

import path from 'path'
import url from 'url'
import fs from 'fs/promises'
import processName from '../../transportvic-data/stop-utils/expand-stop-name.mjs'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const suburbBoundariesFile = path.join(__dirname, '../..', 'transportvic-data', 'geospatial', 'suburb-boundaries', 'data.geojson')
const suburbBoundaries = JSON.parse(await fs.readFile(suburbBoundariesFile))

export class GTFSStopTime {
 
  arrivalTime
  departureTime
  stopID
  stopSequence
  pickup
  dropoff
  distanceTravelled
  
  constructor({ arrivalTime, departureTime, stopID, stopSequence, pickup, dropoff, distance }) {
    this.arrivalTime = arrivalTime
    this.departureTime = departureTime
    this.stopID = stopID
    this.stopSequence = stopSequence
    this.pickup = parseInt(pickup)
    this.dropoff = parseInt(dropoff)
    this.distanceTravelled = distance
  }

}