import { LokiDatabaseConnection } from '@transportme/database'
import StopsLoader from '../lib/loader/StopsLoader.mjs'
import { TRANSIT_MODES } from '../lib/constants.mjs'
import path from 'path'
import url from 'url'
import { expect } from 'chai'
import suburbs from './sample-data/suburbs.json' with { type: 'json' }

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const stopsFile = path.join(__dirname, 'sample-data', 'gtfs-splitting', 'nov_2024_train_data.txt')

describe('The GTFS Stops Loader (Testing on the projected Nov 2024 data)', () => {
  it('Should process the stops and add them to the database', async () => {
    let database = new LokiDatabaseConnection('test-db')
    let stops = await database.createCollection('stops')

    let loader = new StopsLoader(stopsFile, suburbs, TRANSIT_MODES.metroTrain, database)
    await loader.loadStops()

    let stop = await stops.findDocument({
      'stopName': 'Camberwell Railway Station'
    })

    expect(stop).to.not.be.null
  })

  it('Should label the individual platforms with their platform numbers', async () => {
    let database = new LokiDatabaseConnection('test-db')
    let stops = await database.createCollection('stops')

    let loader = new StopsLoader(stopsFile, suburbs, TRANSIT_MODES.metroTrain, database)
    await loader.loadStops()

    let stop = await stops.findDocument({
      'stopName': 'Camberwell Railway Station'
    })

    let platformIDs = ["11207", "11208", "11209"]
    let platforms = platformIDs.map(id => stop.bays.find(bay => bay.stopGTFSID === id))

    for (let i = 0; i < platformIDs.length; i++) {
      let platform = platforms[i]
      expect(platform).to.not.be.undefined
      expect(platforms[i].platform).to.equal((i + 1).toString())
    }
  })
})