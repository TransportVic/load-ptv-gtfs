import { expect } from 'chai'
import GTFSStops from '../lib/gtfs-parser/GTFSStops.mjs'

describe('The GTFSStops class', () => {
  let stopInput = {
    stop_id: '1000',
    stop_name: 'Dole Ave/Cheddar Rd (Reservoir)',
    stop_lat: '-37.7007748061827',
    stop_lon: '145.018951051008'
  }

  describe('The initialProcess function', () => {
    it('Should take in the raw CSV line and process it', () => {
      let stopData = GTFSStops.initialProcess(stopInput)

      expect(stopData.originalName).to.equal(stopInput.stop_name)
      expect(stopData.stopGTFSID).to.equal(stopInput.stop_id)
      expect(stopData.location).to.deep.equal({
        type: 'Point',
        coordinates: [145.018951051008, -37.7007748061827]
      })
    })
  })

  describe('The requiresSuburb function', () => {
    it('Should return false if the stop name already has a suburb', async () => {
      let stopData = GTFSStops.initialProcess(stopInput)
      expect(GTFSStops.requiresSuburb(stopData)).to.be.false
    })

    it('Should return false if the stop name is missing the suburb', async () => {
      let stopData = GTFSStops.initialProcess({
        ...stopInput,
        stop_name: 'Dole Ave/Cheddar Rd'
      })
      expect(GTFSStops.requiresSuburb(stopData)).to.be.true
    })
  })

  // describe('The addSuburb function', () => {
  //   it('Should identify the suburb a stop is in and append the suburb to the name', async () => {
  //     expect(GTFSStops.addSuburb('Moffat St/Main Rd West')).to.equal()
  //   })
  // })
})