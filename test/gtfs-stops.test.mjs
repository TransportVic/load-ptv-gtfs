import { expect } from 'chai'
import GTFSStops from '../lib/gtfs-parser/GTFSStops.mjs'

let stopInput = {
  stop_id: '1000',
  stop_name: 'Dole Ave/Cheddar Rd (Reservoir)',
  stop_lat: '-37.7007748061827',
  stop_lon: '145.018951051008'
}

let stopInput2 = {
  stop_id: '10001',
  stop_name: 'Rex St/Taylors Rd (Kings Park)',
  stop_lat: '-37.7269752097338',
  stop_lon: '144.776152425766'
}

describe('The GTFSStops class', () => {
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

    it('Should populate the suburb and stop number', () => {
      let stopData = GTFSStops.initialProcess(stopInput2)
      expect(stopData.suburb).to.equal('Kings Park')
      expect(stopData.stopNumber).to.equal(null)
    })
  })
})

describe('The GTFSStop class', () => {
  describe('The requiresSuburb function', () => {
    it('Should return false if the stop name already has a suburb', async () => {
      let stopData = GTFSStops.initialProcess(stopInput)
      expect(stopData.requiresSuburb()).to.be.false
    })

    it('Should return false if the stop name is missing the suburb', async () => {
      let stopData = GTFSStops.initialProcess({
        ...stopInput,
        stop_name: 'Dole Ave/Cheddar Rd'
      })
      expect(stopData.requiresSuburb()).to.be.true
    })
  })

  describe('The getSuburbFromName function', () => {
    it('Should extract the stop suburb from its name', () => {
      let stopData = GTFSStops.initialProcess(stopInput)
      expect(stopData.getSuburbFromName()).to.equal('Reservoir')
    })
  })

  describe('The getSuburbFromLocation function', () => {
    it('Should identify the suburb a stop is in', async () => {
      let stopData = GTFSStops.initialProcess(stopInput)

      expect(stopData.getSuburbFromLocation()).to.equal('Reservoir')
    })
  })
})