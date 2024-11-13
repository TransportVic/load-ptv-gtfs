import { expect } from 'chai'
import GTFSRouteReader from '../lib/gtfs-parser/GTFSRouteReader.mjs'
import path from 'path'
import url from 'url'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const routesFile = path.join(__dirname, 'sample-data', 'routes', 'regional_bus_routes.txt')

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
      let routeReader = new GTFSRouteReader(routesFile)
      await routeReader.open()

      await routeReader.getNextRoute()
      let routeData = await routeReader.getNextRoute()

      expect(routeData.routeGTFSID).to.equal('6-013')
      expect(routeData.agencyID).to.equal('99')
      expect(routeData.routeNumber).to.equal('13')
      expect(routeData.routeName).to.equal('Paynesville - Bairnsdale Via Paynesville')
    })
  })
})