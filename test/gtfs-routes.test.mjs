import { expect } from 'chai'
import GTFSRouteReader from '../lib/gtfs-parser/GTFSRouteReader.mjs'
import path from 'path'
import url from 'url'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const regionalRoutesFile = path.join(__dirname, 'sample-data', 'routes', 'regional_bus_routes.txt')
const metroRoutesFile = path.join(__dirname, 'sample-data', 'routes', 'metro_bus_routes.txt')

let regionalBusRoute = {
  route_id: '6-10x-mjp-1',
  agency_id: '43',
  route_short_name: '10',
  route_long_name: 'Alfredton - Ballarat Station Via Wendouree'
}

describe('The GTFSRouteReader class', () => {
  describe('The processRoute function', () => {
    it('Should take in the raw CSV line and process it', () => {
      let routeData = GTFSRouteReader.processRoute(regionalBusRoute)

      expect(routeData.routeGTFSID).to.equal('6-10x')
      expect(routeData.agencyID).to.equal(regionalBusRoute.agency_id)
      expect(routeData.routeNumber).to.equal(regionalBusRoute.route_short_name)
      expect(routeData.routeName).to.equal(regionalBusRoute.route_long_name)
    })
  })

  describe('The getNextRoute function', () => {
    it('Should read the CSV file and return the next stop', async () => {
      let routeReader = new GTFSRouteReader(regionalRoutesFile)
      await routeReader.open()

      await routeReader.getNextRoute()
      let routeData = await routeReader.getNextRoute()

      expect(routeData.agencyID).to.equal('99')
      expect(routeData.routeNumber).to.equal('13')
      expect(routeData.routeName).to.equal('Paynesville - Bairnsdale Via Paynesville')
    })
  })
})

describe('The GTFSRoute class', () => {
  describe('The route ID parsing', () => {
    it('Should parse a regular route ID and remove the -mjp- portion', async () => {
      let routeReader = new GTFSRouteReader(regionalRoutesFile)
      await routeReader.open()

      let routeData = await routeReader.getNextRoute()
      
      expect(routeData.routeGTFSID).to.equal('6-10x')
    })

    it('Should parse a regular route ID and pad with 0s as needed', async () => {
      let routeReader = new GTFSRouteReader(regionalRoutesFile)
      await routeReader.open()

      await routeReader.getNextRoute()
      let routeData = await routeReader.getNextRoute()
      
      expect(routeData.routeGTFSID).to.equal('6-013')
    })

    it('Should detect a smartrak route ID and convert to a legacy 4-XXX trip', async () => {
      let routeReader = new GTFSRouteReader(metroRoutesFile)
      await routeReader.open()

      expect((await routeReader.getNextRoute()).routeGTFSID).to.equal('4-900')
      expect((await routeReader.getNextRoute()).routeGTFSID).to.equal('4-900')
      expect((await routeReader.getNextRoute()).routeGTFSID).to.equal('4-601')
    })
  })
})