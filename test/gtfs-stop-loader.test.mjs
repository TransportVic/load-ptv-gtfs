import { LokiDatabaseConnection } from '@transportme/database'
import StopsLoader from '../lib/loader/StopsLoader.mjs'
import { TRANSIT_MODES } from '../lib/constants.mjs'
import path from 'path'
import url from 'url'
import { expect } from 'chai'
import suburbs from './sample-data/suburbs.json' with { type: 'json' }

import uniqueStops from './sample-data/stop-data/unique-stops.json' with { type: 'json' }
import nameOverrides from './sample-data/stop-data/name-overrides.json' with { type: 'json' }
import GTFSStopsReader from '../lib/gtfs-parser/readers/GTFSStopsReader.mjs'

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

    let loader = new StopsLoader(stopsFile, suburbs, TRANSIT_MODES.bus, database)
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

    let loader = new StopsLoader(stopsFile, suburbs, TRANSIT_MODES.bus, database)
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

    let loader = new StopsLoader(stopsFile, suburbs, TRANSIT_MODES.bus, database)
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

    let loader = new StopsLoader(stopsFile, suburbs, TRANSIT_MODES.bus, database)
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

    let loader = new StopsLoader(stopsFile, suburbs, TRANSIT_MODES.bus, database)
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

    function getMergeName(stop) {
      if (uniqueStops.includes(stop.fullStopName)) return stop.fullStopName
    }

    await (new StopsLoader(uniqueStopsBus, suburbs, TRANSIT_MODES.bus, database)).loadStops({ getMergeName })
    await (new StopsLoader(uniqueStopsTram, suburbs, 'tram', database)).loadStops({ getMergeName })

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

    await (new StopsLoader(stopNameOverrides, suburbs, TRANSIT_MODES.bus, database)).loadStops({
      processStop: stop => {
        let updatedName = nameOverrides[stop.fullStopName]
        if (updatedName) stop.fullStopName = updatedName

        return stop
      }
    })

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

    await (new StopsLoader(specialHeader, suburbs, TRANSIT_MODES.bus, database)).loadStops()

    let gumRd = await stops.findDocument({
      'bays.stopGTFSID': '10009'
    })

    expect(gumRd).to.not.be.null
    expect(gumRd.stopName).to.equal('Gum Road/Main Road West')
  })

  it('Should allow for individual stops to be loaded in', async () => {
    let database = new LokiDatabaseConnection('test-db')
    let stops = await database.createCollection('stops')

    let loader = new StopsLoader(specialHeader, suburbs, TRANSIT_MODES.bus, database)
    let reader = new GTFSStopsReader('')

    await loader.loadStop(reader.processEntity({
      stop_id: '51586',
      stop_name: 'Huntingdale Station/Haughton Road (Oakleigh)',
      stop_lat: '-37.9111998619901',
      stop_lon: '145.103064853799'
    }))

    let huntingdale = await stops.findDocument({
      'bays.stopGTFSID': '51586'
    })

    expect(huntingdale).to.not.be.null
    expect(huntingdale.stopName).to.equal('Huntingdale Railway Station/Haughton Road')

    await loader.loadStop(reader.processEntity({
      stop_id: '22440',
      stop_name: 'Huntingdale Station/Huntingdale Road (Oakleigh)',
      stop_lat: '-37.911010298723',
      stop_lon: '145.103604328761'
    }))

    huntingdale = await stops.findDocument({
      'bays.stopGTFSID': '22440'
    })

    expect(huntingdale).to.not.be.null
    expect(huntingdale.stopName).to.equal('Huntingdale Railway Station')
  })

  it('Should not load duplicate stops with the same mode in', async () => {
    let database = new LokiDatabaseConnection('test-db')
    let stops = await database.createCollection('stops')

    let loader = new StopsLoader(specialHeader, suburbs, TRANSIT_MODES.bus, database)
    let reader = new GTFSStopsReader('')

    await loader.loadStop(reader.processEntity({
      stop_id: '51586',
      stop_name: 'Huntingdale Station/Haughton Road (Oakleigh)',
      stop_lat: '-37.9111998619901',
      stop_lon: '145.103064853799'
    }))

    let huntingdale = await stops.findDocument({
      'bays.stopGTFSID': '51586'
    })
    expect(huntingdale.bays.length).to.equal(1)
    expect(huntingdale.bays[0].stopGTFSID).to.equal('51586')

    await loader.loadStop(reader.processEntity({
      stop_id: '51586',
      stop_name: 'Huntingdale Station/Haughton Road (Oakleigh)',
      stop_lat: '-37.9111998619901',
      stop_lon: '145.103064853799'
    }))

    huntingdale = await stops.findDocument({
      'bays.stopGTFSID': '51586'
    })
    expect(huntingdale.bays.length).to.equal(1)
  })

  it('Should load duplicate stops with the different mode in', async () => {
    let database = new LokiDatabaseConnection('test-db')
    let stops = await database.createCollection('stops')

    let busLoader = new StopsLoader(specialHeader, suburbs, TRANSIT_MODES.bus, database)
    let coachLoader = new StopsLoader(specialHeader, suburbs, TRANSIT_MODES.regionalCoach, database)
    let reader = new GTFSStopsReader('')

    await busLoader.loadStop(reader.processEntity({
      stop_id: '51586',
      stop_name: 'Huntingdale Station/Haughton Road (Oakleigh)',
      stop_lat: '-37.9111998619901',
      stop_lon: '145.103064853799'
    }))

    let huntingdale = await stops.findDocument({
      'bays.stopGTFSID': '51586'
    })
    expect(huntingdale.bays.length).to.equal(1)
    expect(huntingdale.bays[0].stopGTFSID).to.equal('51586')
    expect(huntingdale.bays[0].mode).to.equal(TRANSIT_MODES.bus)

    await coachLoader.loadStop(reader.processEntity({
      stop_id: '51586',
      stop_name: 'Huntingdale Station/Haughton Road (Oakleigh)',
      stop_lat: '-37.9111998619901',
      stop_lon: '145.103064853799'
    }))

    huntingdale = await stops.findDocument({
      'bays.stopGTFSID': '51586'
    })
    expect(huntingdale.bays.length).to.equal(2)
    expect(huntingdale.bays[1].stopGTFSID).to.equal('51586')
    expect(huntingdale.bays[1].mode).to.equal(TRANSIT_MODES.regionalCoach)
  })
})