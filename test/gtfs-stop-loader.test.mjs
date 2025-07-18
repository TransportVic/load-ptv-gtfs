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

const generalStores = path.join(__dirname, 'sample-data', 'gtfs-splitting', 'general-stores.txt')

const uniqueStopsBus = path.join(__dirname, 'sample-data', 'gtfs-splitting', 'force_unique_stops_bus.txt')
const uniqueStopsTram = path.join(__dirname, 'sample-data', 'gtfs-splitting', 'force_unique_stops_tram.txt')

const stopNameOverrides = path.join(__dirname, 'sample-data', 'gtfs-splitting', 'name_overrides.txt')

const specialHeader = path.join(__dirname, 'sample-data', 'gtfs-splitting', 'special_chars_stops_csv.txt')

const unionWithSpaces = path.join(__dirname, 'sample-data', 'gtfs-splitting', 'union_with_spaces.txt')

const parentStopsFile = path.join(__dirname, 'sample-data', 'parent-stop', 'stops.txt')
const multiParentStopFile = path.join(__dirname, 'sample-data', 'parent-stop', 'multi_stop.txt')

describe('The GTFS Stops Loader', () => {
  it('Should process the stops and add them to the database', async () => {
    let database = new LokiDatabaseConnection('test-db')
    let stops = await database.createCollection('gtfs-stops')

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
    let stops = await database.createCollection('gtfs-stops')

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

    expect(wavWarrigal.location.coordinates).to.deep.equal([
      [145.091009789504, -37.879427459666],
      [145.090653754117, -37.8795658733597]
    ])
  })

  it('Should merge non street stops, and keep the secondary stop name if they are the same', async () => {
    let database = new LokiDatabaseConnection('test-db')
    let stops = await database.createCollection('gtfs-stops')

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
    let stops = await database.createCollection('gtfs-stops')

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
    let stops = await database.createCollection('gtfs-stops')

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
    let stops = await database.createCollection('gtfs-stops')

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
    let stops = await database.createCollection('gtfs-stops')

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
    let stops = await database.createCollection('gtfs-stops')

    await (new StopsLoader(specialHeader, suburbs, TRANSIT_MODES.bus, database)).loadStops()

    let gumRd = await stops.findDocument({
      'bays.stopGTFSID': '10009'
    })

    expect(gumRd).to.not.be.null
    expect(gumRd.stopName).to.equal('Gum Road/Main Road West')
  })

  it('Should allow for a custom suburb hook', async () => {
    let database = new LokiDatabaseConnection('test-db')
    let stops = await database.createCollection('gtfs-stops')

    let testSuburbs = ['A', 'B', 'C', null, 'D']

    let loader = new StopsLoader(stopsFile, suburbs, TRANSIT_MODES.bus, database, () => testSuburbs.shift())
    await loader.loadStops()

    expect((await stops.findDocument({ 'bays.stopGTFSID': '1000' })).suburb[0]).to.equal('A')
    expect((await stops.findDocument({ 'bays.stopGTFSID': '10001' })).suburb[0]).to.equal('B')
    expect((await stops.findDocument({ 'bays.stopGTFSID': '10002' })).suburb[0]).to.equal('C')
    expect((await stops.findDocument({ 'bays.stopGTFSID': '10009' })).suburb[0]).to.equal('Albanvale') // Null so not used
    expect((await stops.findDocument({ 'bays.stopGTFSID': '1001' })).suburb[0]).to.equal('D')
  })

  it('Should allow for individual stops to be loaded in', async () => {
    let database = new LokiDatabaseConnection('test-db')
    let stops = await database.createCollection('gtfs-stops')

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
    let stops = await database.createCollection('gtfs-stops')

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
    let stops = await database.createCollection('gtfs-stops')

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

  it('Should not merge stops with the same name that are located far away from one another', async () => {
    let database = new LokiDatabaseConnection('test-db')
    let stops = await database.createCollection('gtfs-stops')

    await (new StopsLoader(generalStores, suburbs, TRANSIT_MODES.bus, database)).loadStops()

    expect((await stops.findDocument({ 'bays.stopGTFSID': '17124' })).bays.length).to.equal(2) // Piangil
    expect((await stops.findDocument({ 'bays.stopGTFSID': '17977' })).bays.length).to.equal(2) // Tempy
    expect((await stops.findDocument({ 'bays.stopGTFSID': '43916' })).bays.length).to.equal(1) // Coronet Bay
  })

  it('Should handle extra spaces within the stop name', async () => {
    let database = new LokiDatabaseConnection('test-db')
    let stops = await database.createCollection('gtfs-stops')

    await (new StopsLoader(unionWithSpaces, suburbs, TRANSIT_MODES.bus, database)).loadStops()

    expect(await stops.countDocuments({})).to.equal(1)
    expect((await stops.findDocument({ 'bays.stopGTFSID': '26535' })).bays.length).to.equal(4) // Union Station
  })

  it('Should merge stops into their designated parent stops even if the names do not match', async () => {
    let database = new LokiDatabaseConnection('test-db')
    let stops = await database.createCollection('gtfs-stops')

    await (new StopsLoader(parentStopsFile, suburbs, TRANSIT_MODES.metroTrain, database)).loadStops()

    expect(await stops.countDocuments({})).to.equal(1)
    let stopData = await stops.findDocument({})
    expect(stopData.bays.find(bay => bay.stopGTFSID === '14331').stopType).to.equal('stop')
    expect(stopData.bays.find(bay => bay.stopGTFSID === 'vic:rail:CHL').stopType).to.equal('station')
    expect(stopData.bays.find(bay => bay.stopGTFSID === 'vic:rail:CHL_DP3').stopType).to.equal('generic')
    expect(stopData.bays.find(bay => bay.stopGTFSID === 'vic:rail:CHL_EN1').stopType).to.equal('entrance')

    expect(stopData.bays.find(bay => bay.stopGTFSID === '14331').parentStopGTFSID).to.equal('vic:rail:CHL')
    expect(stopData.bays.find(bay => bay.stopGTFSID === 'vic:rail:CHL').parentStopGTFSID).to.be.null

    // TODO: Find out what the Connex stop is for
    expect(stopData.cleanNames).to.deep.equal(['clifton-hill-railway-station', 'connex'])
  })

  it('Should handle the parent being part of a merged stop', async () => {
    let database = new LokiDatabaseConnection('test-db')
    let stops = await database.createCollection('gtfs-stops')

    await (new StopsLoader(multiParentStopFile, suburbs, TRANSIT_MODES.regionalCoach, database)).loadStops()

    expect(await stops.countDocuments({})).to.equal(1)
    let stopData = await stops.findDocument({})
    expect(stopData.bays.find(bay => bay.stopGTFSID === '17799').mode).to.equal('regional coach')
    expect(stopData.bays.find(bay => bay.stopGTFSID === '17799').stopType).to.equal('stop')
    
    expect(stopData.bays.find(bay => bay.stopGTFSID === 'vic:rail:ART').stopType).to.equal('station')
    expect(stopData.bays.find(bay => bay.stopGTFSID === 'vic:rail:ART').parentStopGTFSID).to.be.null

    expect(stopData.bays.find(bay => bay.stopGTFSID === '20288').parentStopGTFSID).to.equal('vic:rail:ART')
  })

  it('Should use stop and station names and suburbs', async () => {
    let database = new LokiDatabaseConnection('test-db')
    let stops = await database.createCollection('gtfs-stops')

    let data = [{
      "stop_id": "vic:rail:THL",
      "stop_name": "Town Hall Railway Station (Melbourne)",
      "stop_lat": "-37.815926",
      "stop_lon": "144.967134",
      "parent_station": "",
      "location_type": "1",
      "platform_code": ""
    },
    {
      "stop_id": "vic:rail:TSC",
      "stop_name": "Town Hall Railway Station (Melbourne)",
      "stop_lat": "-37.815926",
      "stop_lon": "144.967134",
      "parent_station": "",
      "location_type": "1",
      "platform_code": ""
    }]

    let stopLoader = new StopsLoader('', suburbs, TRANSIT_MODES.metroTrain, database)
    let reader = new GTFSStopsReader('', suburbs)

    for (let stop of data) await stopLoader.loadStop(reader.processEntity(stop))

    expect(await stops.countDocuments({})).to.equal(1)
    let stopData = await stops.findDocument({})
    expect(stopData.stopName).to.equal('Town Hall Railway Station')
    expect(stopData.cleanNames).to.deep.equal(['town-hall-railway-station'])
    expect(stopData.suburb).to.deep.equal(['Melbourne'])
    expect(stopData.cleanSuburbs).to.deep.equal(['melbourne'])
  })
})