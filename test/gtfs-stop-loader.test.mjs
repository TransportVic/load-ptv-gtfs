import { LokiDatabaseConnection } from '@sbs9642p/database'
import StopsLoader from '../lib/loader/StopsLoader.mjs'
import path from 'path'
import url from 'url'
import { expect } from 'chai'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const stopsFile = path.join(__dirname, 'sample-data', 'gtfs-splitting', 'sample_stops.txt')

describe('The GTFS Stops Loader', () => {
  it('Should process the stops and add them to the database', async () => {
    let database = new LokiDatabaseConnection('test-db')
    let stops = await database.createCollection('stops')

    let loader = new StopsLoader(stopsFile, 'bus', database)
    await loader.loadStops()

    let stop = await stops.findDocument({
      'bays.stopGTFSID': '10011'
    })
    expect(stop).to.not.be.null
    expect(stop.stopName).to.equal('Moffat Street/Main Road West')
  })

  it('Should merge street-level stops matching with the exact same name', async () => {
    let database = new LokiDatabaseConnection('test-db')
    let stops = await database.createCollection('stops')

    let loader = new StopsLoader(stopsFile, 'bus', database)
    await loader.loadStops()

    let wavWatson = await stops.findDocument({
      'bays.stopGTFSID': '16074'
    })

    expect(wavWatson).to.not.be.null
    expect(wavWatson.stopName).to.equal('Waverley Road/Watsons Road')
    expect(wavWatson.bays.length).to.equal(2)

    let wavWarrigal = await stops.findDocument({
      'bays.stopGTFSID': '9379'
    })
    
    expect(wavWarrigal).to.not.be.null
    expect(wavWarrigal.stopName).to.equal('Waverley Road/Warrigal Road')
    expect(wavWarrigal.bays.length).to.equal(2)
  })

  it('Should merge non street stops, and keep the secondary stop name if they are the same', async () => {
    let database = new LokiDatabaseConnection('test-db')
    let stops = await database.createCollection('stops')

    let loader = new StopsLoader(stopsFile, 'bus', database)
    await loader.loadStops()

    let stop = await stops.findDocument({
      'bays.stopGTFSID': '19580'
    })

    expect(stop).to.not.be.null
    expect(stop.bays.length).to.equal(3)
    expect(stop.stopName).to.equal('Belgrave Railway Station/Belgrave-Gembrook Road')
  })

})