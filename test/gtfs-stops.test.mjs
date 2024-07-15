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
      let stopData = GTFSStops.initialProcess({
        ...stopInput2,
        stop_name: '51a-Rex St/Taylors Rd (Kings Park)'
      })

      expect(stopData.suburb).to.equal('Kings Park')
      expect(stopData.stopNumber).to.equal('51A')
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

  describe('The getStopNameWithoutSuburb function', () => {
    it('Should strip the suburb from the stop name', () => {
      let stopData = GTFSStops.initialProcess(stopInput)

      expect(stopData.getStopNameWithoutSuburb()).to.equal('Dole Ave/Cheddar Rd')
    })
  })

  describe('The matchStopNumber function', () => {
    it('Should match stop numbers in the format XXX-STOPNAME', () => {
      let stopData = GTFSStops.initialProcess({
        ...stopInput,
        stop_name: '125-Yuille St/Centenary Ave (Melton)'
      })

      expect(stopData.matchStopNumber()).to.deep.equal({
        stopNumber: '125',
        stopName: 'Yuille St/Centenary Ave'
      })
    })

    it('Should match stop numbers in the format STOPNAME - Stop XXX', () => {
      let stopData = GTFSStops.initialProcess({
        ...stopInput,
        stop_name: 'Yuille St - Stop D99'
      })

      expect(stopData.matchStopNumber()).to.deep.equal({
        stopNumber: 'D99',
        stopName: 'Yuille St'
      })
    })

    it('Should ensure the stop numbers are all uppercase', () => {
      let stopData = GTFSStops.initialProcess({
        ...stopInput,
        stop_name: '125a-Southbank Tram Depot (South Melbourne)'
      })

      expect(stopData.matchStopNumber()).to.deep.equal({
        stopNumber: '125A',
        stopName: 'Southbank Tram Depot'
      })
    })

    it('Should return null if there is no stop number', () => {
      let stopData = GTFSStops.initialProcess({
        ...stopInput,
        stop_name: 'Southbank Tram Depot (South Melbourne)'
      })

      expect(stopData.matchStopNumber()).to.deep.equal({
        stopNumber: null,
        stopName: 'Southbank Tram Depot'
      })
    })
  })
})