import { LokiDatabaseConnection } from '@transportme/database'
import RouteLoader from '../lib/loader/RouteLoader.mjs'
import GTFSAgencyReader from '../lib/gtfs-parser/readers/GTFSAgencyReader.mjs'

import { TRANSIT_MODES } from '../lib/constants.mjs'

import path from 'path'
import url from 'url'
import { expect } from 'chai'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const regionalRoutesFile = path.join(__dirname, 'sample-data', 'routes', 'regional_bus_routes.txt')
const metroRoutesFile = path.join(__dirname, 'sample-data', 'routes', 'metro_bus_routes.txt')
const metroLinesFile = path.join(__dirname, 'sample-data', 'routes', 'metro_lines.txt')
const agencyFile = path.join(__dirname, 'sample-data', 'routes', 'agency.txt')
const wgtFile = path.join(__dirname, 'sample-data', 'routes', 'west_gipp_transit.txt')
const vlineFile = path.join(__dirname, 'sample-data', 'routes', 'vline.txt')

describe('The GTFS Agency Reader', () => {
  it('Should read the agencies one line at a time', async () => {
    let reader = new GTFSAgencyReader(agencyFile)
    await reader.open()
    let operator = await reader.getNextEntity()

    expect(operator.id).to.equal('43')
    expect(operator.name).to.equal('CDC Ballarat')
    expect(operator.website).to.equal('https://www.ptv.vic.gov.au/footer/customer-service/operator-contact-details/?utm_source=open_data_click_agency&utm_medium=open_data_agency_click&utm_campaign=open_data_click')
    expect(operator.phone).to.equal('1800 800 007')
  })
})

describe('The GTFS Routes Loader', () => {
  it('Should process the routes and add them to the database', async () => {
    let database = new LokiDatabaseConnection('test-db')
    let routes = await database.createCollection('routes')

    let loader = new RouteLoader(regionalRoutesFile, agencyFile, TRANSIT_MODES.bus, database)
    await loader.loadRoutes()

    let bal10 = await routes.findDocument({
      routeGTFSID: '6-10x'
    })

    expect(bal10).to.not.be.null
    expect(bal10.routeNumber).to.equal('10')
    expect(bal10.operators).to.deep.equal(['CDC Ballarat'])
  })

  it('Should open the agency.txt file and load all operators', async () => {
    let database = new LokiDatabaseConnection('test-db')
    await database.createCollection('routes')

    let loader = new RouteLoader(regionalRoutesFile, agencyFile, TRANSIT_MODES.bus, database)
    await loader.loadAgencies()
    
    let paynesville = loader.getOperator('99')

    expect(paynesville).to.not.be.undefined
    expect(paynesville.name).to.equal('Paynesville Bus Lines')
  })

  it('Should handle smartrak routes', async () => {
    let database = new LokiDatabaseConnection('test-db')
    let routes = await database.createCollection('routes')

    let loader = new RouteLoader(metroRoutesFile, agencyFile, TRANSIT_MODES.bus, database)
    await loader.loadRoutes()

    let smart900 = await routes.findDocument({
      routeGTFSID: '4-900'
    })

    expect(smart900).to.not.be.null
    expect(smart900.mode).to.equal(TRANSIT_MODES.bus)
    expect(smart900.routeNumber).to.equal('900')
    expect(smart900.operators).to.have.members(['CDC', 'Ventura Bus Lines'])
  })

  it('Should handle metro train routes', async () => {
    let database = new LokiDatabaseConnection('test-db')
    let routes = await database.createCollection('routes')

    let loader = new RouteLoader(metroLinesFile, agencyFile, TRANSIT_MODES.metroTrain, database)
    await loader.loadRoutes()

    let stony = await routes.findDocument({
      routeGTFSID: '2-STY'
    })

    expect(stony).to.not.be.null
    expect(stony.mode).to.equal('metro train')
    expect(stony.routeNumber).to.be.null
    expect(stony.routeName).to.equal('Stony Point')
    expect(stony.operators).to.have.members(['Metro'])
  })

  it('Should allow for custom route rewriting', async () => {
    let database = new LokiDatabaseConnection('test-db')
    let routes = await database.createCollection('routes')

    let loader = new RouteLoader(wgtFile, agencyFile, TRANSIT_MODES.bus, database)
    await loader.loadRoutes({
      processRoute: route => {
        if (route.routeGTFSID.match(/6-w\d\d/)) {
          route.routeGTFSID = '6-WGT'
          route.routeName = 'West Gippsland Transit'
        }

        return route
      }
    })

    let wgt = await routes.findDocument({
      routeGTFSID: '6-WGT'
    })

    expect(wgt, 'Expected West Gippsland Transit route 6-WGT to be created').to.not.be.null
    expect(wgt.mode).to.equal('bus')
    expect(wgt.routeNumber).to.be.null
    expect(wgt.routeName).to.equal('West Gippsland Transit')
    expect(wgt.operators).to.have.members(['Warragul Bus Lines'])

    expect(await routes.findDocument({
      routeGTFSID: '6-w40'
    }), 'Expected 6-w40 Moe - Garfield to not exist').to.be.null

    expect(await routes.findDocument({
      routeGTFSID: '6-w41'
    }), 'Expected 6-w41 Warragul - Pakenham to not exist').to.be.null

    let nojee = await routes.findDocument({
      routeGTFSID: '6-W89'
    })
    expect(nojee, 'Expected 6-W89 Warragul - Nojee to exist and not be modified').to.not.be.null
    expect(nojee.mode).to.equal('bus')
    expect(nojee.routeNumber).to.equal('89')
    expect(nojee.routeName).to.equal('Noojee - Warragul Station Via Buln Buln')
    expect(nojee.operators).to.have.members(['Warragul Bus Lines'])
  })


  it('Should return a route ID map', async () => {
    let database = new LokiDatabaseConnection('test-db')
    let routes = await database.createCollection('routes')

    let loader = new RouteLoader(wgtFile, agencyFile, TRANSIT_MODES.bus, database)
    await loader.loadRoutes({
      processRoute: route => {
        if (route.routeGTFSID.match(/6-w\d\d/)) {
          route.routeGTFSID = '6-WGT'
          route.routeName = 'West Gippsland Transit'
        }

        return route
      }
    })

    let map = loader.getRouteIDMap()
    expect(map['6-w19-mjp-1']).to.equal('6-WGT')
    expect(map['6-W89-mjp-1']).to.equal('6-W89')
  })

  it('Should allow for dropping of unwanted routes', async () => {
    let database = new LokiDatabaseConnection('test-db')
    let routes = await database.createCollection('routes')

    let loader = new RouteLoader(vlineFile, agencyFile, TRANSIT_MODES.regionalTrain, database)
    await loader.loadRoutes({
      processRoute: route => {
        if (route.routeGTFSID === '1-vPK') return null
        return route
      }
    })

    expect(await routes.findDocument({
      routeGTFSID: '1-vPK'
    }), 'Expected 1-vPK V/Line Dandenong Metro Services to not exist').to.be.null

    let traralgon = await routes.findDocument({
      routeGTFSID: '1-TRN'
    })
    expect(traralgon, 'Expected 1-TRN Warragul - Nojee to exist and not be modified').to.not.be.null
    expect(traralgon.mode).to.equal('regional train')
    expect(traralgon.routeNumber).to.be.null
    expect(traralgon.routeName).to.equal('Traralgon - Melbourne Via Pakenham, Moe & Morwell')
    expect(traralgon.operators).to.have.members(['V/Line'])
  })
})