import { LokiDatabaseConnection } from '@sbs9642p/database'
import StopsLoader from '../lib/loader/StopsLoader.mjs'
import { TRANSIT_MODES } from '../lib/constants.mjs'
import path from 'path'
import url from 'url'
import { expect } from 'chai'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const stopsFile = path.join(__dirname, 'sample-data', 'gtfs-splitting', 'sample_stops.txt')

const uniqueStopsBus = path.join(__dirname, 'sample-data', 'gtfs-splitting', 'force_unique_stops_bus.txt')
const uniqueStopsTram = path.join(__dirname, 'sample-data', 'gtfs-splitting', 'force_unique_stops_tram.txt')

const stopNameOverrides = path.join(__dirname, 'sample-data', 'gtfs-splitting', 'name_overrides.txt')

const specialHeader = path.join(__dirname, 'sample-data', 'gtfs-splitting', 'special_chars_stops_csv.txt')

describe('The GTFS Stops Loader', () => {
  it('Should process the stops and add them to the database', async () => {
    let database = new LokiDatabaseConnection('test-db')
    let stops = await database.createCollection('stops')

    let loader = new StopsLoader(stopsFile, TRANSIT_MODES.bus, database)
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

    let loader = new StopsLoader(stopsFile, TRANSIT_MODES.bus, database)
    await loader.loadStops()

    let wavWatson = await stops.findDocument({
      'bays.stopGTFSID': '16074'
    })

    expect(wavWatson).to.not.be.null
    expect(wavWatson.stopName).to.equal('Waverley Road/Watsons Road')
    expect(wavWatson.bays.length).to.equal(2)
    expect(wavWatson.suburb).to.deep.equal(['Glen Waverley'])
    expect(wavWatson.cleanSuburbs).to.deep.equal(['glen-waverley'])

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

    let loader = new StopsLoader(stopsFile, TRANSIT_MODES.bus, database)
    await loader.loadStops()

    let stop = await stops.findDocument({
      'bays.stopGTFSID': '19580'
    })

    expect(stop).to.not.be.null
    expect(stop.bays.length).to.equal(3)
    expect(stop.stopName).to.equal('Belgrave Railway Station/Belgrave-Gembrook Road')
  })

  it('Should merge non street stops, and discard the secondary stop name if they are different', async () => {
    let database = new LokiDatabaseConnection('test-db')
    let stops = await database.createCollection('stops')

    let loader = new StopsLoader(stopsFile, TRANSIT_MODES.bus, database)
    await loader.loadStops()

    let stop = await stops.findDocument({
      'bays.stopGTFSID': '28191'
    })

    expect(stop).to.not.be.null
    expect(stop.bays.length).to.equal(3)
    expect(stop.stopName).to.equal('Lilydale Railway Station')
  })

  it('Should update the suburb list as well', async () => {
    let database = new LokiDatabaseConnection('test-db')
    let stops = await database.createCollection('stops')

    let loader = new StopsLoader(stopsFile, TRANSIT_MODES.bus, database)
    await loader.loadStops()

    let stop = await stops.findDocument({
      'bays.stopGTFSID': '51586'
    })

    expect(stop).to.not.be.null
    expect(stop.bays.length).to.equal(2)
    expect(stop.stopName).to.equal('Huntingdale Railway Station')
    expect(stop.suburb).to.deep.equal(['Huntingdale', 'Oakleigh'])
  })

  it('Should not merge stops that are forced to be unique and would otherwise be merged', async () => {
    let database = new LokiDatabaseConnection('test-db')
    let stops = await database.createCollection('stops')

    await (new StopsLoader(uniqueStopsBus, TRANSIT_MODES.bus, database)).loadStops()
    await (new StopsLoader(uniqueStopsTram, 'tram', database)).loadStops()

    let melbRoyal = await stops.findDocument({
      'bays.stopGTFSID': '16830'
    })

    expect(melbRoyal).to.not.be.null
    expect(melbRoyal.bays.length).to.equal(1)
    expect(melbRoyal.stopName).to.equal('Melbourne University/Royal Parade')

    let melbGrattan = await stops.findDocument({
      'bays.stopGTFSID': '28670'
    })

    expect(melbGrattan).to.not.be.null
    expect(melbGrattan.bays.length).to.equal(4)
    expect(melbGrattan.stopName).to.equal('Melbourne University/Grattan Street')

    let melbSwanston = await stops.findDocument({
      'bays.stopGTFSID': '87'
    })

    expect(melbSwanston).to.not.be.null
    expect(melbSwanston.bays.length).to.equal(3)
    expect(melbSwanston.stopName).to.equal('Melbourne University/Swanston Street')
  })

  it('Should override stop names if required', async () => {
    let database = new LokiDatabaseConnection('test-db')
    let stops = await database.createCollection('stops')

    await (new StopsLoader(stopNameOverrides, TRANSIT_MODES.bus, database)).loadStops()

    let ballarat = await stops.findDocument({
      'bays.stopGTFSID': '49020'
    })

    expect(ballarat).to.not.be.null
    expect(ballarat.bays.length).to.equal(3)
    expect(ballarat.stopName).to.equal('Ballarat Railway Station')
    expect(ballarat.bays[0].originalName).to.equal('Ballarat Bus Interchange (Soldiers Hill)')
  })

  it('Should handle CSV blank spaces and other unicode junk', async () => {
    let database = new LokiDatabaseConnection('test-db')
    let stops = await database.createCollection('stops')

    await (new StopsLoader(specialHeader, TRANSIT_MODES.bus, database)).loadStops()

    let gumRd = await stops.findDocument({
      'bays.stopGTFSID': '10009'
    })

    expect(gumRd).to.not.be.null
    expect(gumRd.stopName).to.equal('Gum Road/Main Road West')
  })
})