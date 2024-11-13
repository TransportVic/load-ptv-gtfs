import { LokiDatabaseConnection } from '@sbs9642p/database'
import RouteLoader from '../lib/loader/RouteLoader.mjs'
import path from 'path'
import url from 'url'
import { expect } from 'chai'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const routesFile = path.join(__dirname, 'sample-data', 'routes', 'regional_bus_routes.txt')
const agencyFile = path.join(__dirname, 'sample-data', 'routes', 'agency.txt')

describe('The GTFS Routes Loader', () => {
  it('Should process the routes and add them to the database', async () => {
    let database = new LokiDatabaseConnection('test-db')
    let routes = await database.createCollection('routes')

    let loader = new RouteLoader(routesFile, agencyFile, 'bus', database)
    await loader.loadRoutes()

    let bal10 = await routes.findDocument({
      routeGTFSID: '6-10x'
    })

    expect(bal10).to.not.be.null
    expect(bal10.routeNumber).to.equal('10')
    expect(bal10.operators).to.equal(['Christians Bus Company (Bendigo)'])
  })
})