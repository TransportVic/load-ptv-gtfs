import { LokiDatabaseConnection } from '@sbs9642p/database'
import StopsLoader from '../lib/loader/StopsLoader.mjs'
import path from 'path'
import url from 'url'
import { expect } from 'chai'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const stopsFile = path.join(__dirname, 'sample-data', 'gtfs-splitting', 'sample_stops.txt')

const database = new LokiDatabaseConnection('test-db')
const stops = await database.createCollection('stops')

describe('The GTFS Stops Loader', () => {
  it('Should process the stops and add them to the database', async () => {
    let loader = new StopsLoader(stopsFile, 'bus', database)
    await loader.loadStops()

    let stop = await stops.findDocument({
      'bays.stopGTFSID': '10011'
    })
    expect(stop).to.not.be.null
    expect(stop.stopName).to.equal('Moffat Street/Main Road West')
  })
})