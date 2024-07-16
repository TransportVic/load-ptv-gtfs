import { expect } from 'chai'
import GTFSStopsReader from '../lib/gtfs-parser/GTFSStops.mjs'
import path from 'path'
import url from 'url'
import GTFSStop from '../lib/gtfs-parser/GTFSStop.mjs'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const stopsFile = path.join(__dirname, 'sample-data', 'gtfs-splitting', 'sample_stops.txt')

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
      let stopData = GTFSStopsReader.processStop(stopInput)

      expect(stopData.originalName).to.equal(stopInput.stop_name)
      expect(stopData.stopGTFSID).to.equal(stopInput.stop_id)
      expect(stopData.location).to.deep.equal({
        type: 'Point',
        coordinates: [145.018951051008, -37.7007748061827]
      })
    })

    it('Should populate the suburb and stop number', () => {
      let stopData = GTFSStopsReader.processStop({
        ...stopInput2,
        stop_name: '51a-Rex St/Taylors Rd (Kings Park)'
      })

      expect(stopData.suburb).to.equal('Kings Park')
      expect(stopData.stopNumber).to.equal('51A')
    })
  })

  describe('The getNextStop function', () => {
    it('Should read the CSV file and return the next stop', async () => {
      let stopReader = new GTFSStopsReader(stopsFile)
      await stopReader.open()

      let stopData = await stopReader.getNextStop()

      expect(stopData.rawStopName).to.equal('Dole Ave/Cheddar Rd')
      expect(stopData.stopGTFSID).to.equal('1000')
    })
  })

  describe('The available function', () => {
    it('Should return true if there is more data, and false otherwise', async () => {
      let stopReader = new GTFSStopsReader(stopsFile)
      await stopReader.open()

      for (let i = 0; i < 6; i++) await stopReader.getNextStop()
      expect(stopReader.available()).to.be.true
    
      await stopReader.getNextStop()
      expect(stopReader.available()).to.be.false
    })
  })
})

describe('The GTFSStop class', () => {
  describe('The requiresSuburb function', () => {
    it('Should return false if the stop name already has a suburb', async () => {
      let stopData = GTFSStopsReader.processStop(stopInput)
      expect(stopData.requiresSuburb()).to.be.false
    })

    it('Should return false if the stop name is missing the suburb', async () => {
      let stopData = GTFSStopsReader.processStop({
        ...stopInput,
        stop_name: 'Dole Ave/Cheddar Rd'
      })
      expect(stopData.requiresSuburb()).to.be.true
    })
  })

  describe('The getSuburbFromName function', () => {
    it('Should extract the stop suburb from its name', () => {
      let stopData = GTFSStopsReader.processStop(stopInput)
      expect(stopData.getSuburbFromName()).to.equal('Reservoir')
    })
  })

  describe('The getStopNameWithoutSuburb function', () => {
    it('Should strip the suburb from the stop name', () => {
      let stopData = GTFSStopsReader.processStop(stopInput)

      expect(stopData.getStopNameWithoutSuburb()).to.equal('Dole Ave/Cheddar Rd')
    })
  })

  describe('The matchStopNumber function', () => {
    it('Should match stop numbers in the format XXX-STOPNAME', () => {
      let stopData = GTFSStopsReader.processStop({
        ...stopInput,
        stop_name: '125-Yuille St/Centenary Ave (Melton)'
      })

      expect(stopData.matchStopNumber()).to.deep.equal({
        stopNumber: '125',
        stopName: 'Yuille St/Centenary Ave'
      })
    })

    // Can randomly happen when PTV exports the data without suburb names or secondary street names
    // See 25 Jan 2021 archive
    // Seems to be caused when they set some flag incorrectly as this seems to match the stop names on the printed timetables.
    // Weird huh.
    it('Should match stop numbers in the format STOPNAME - Stop XXX', () => {
      let stopData = GTFSStopsReader.processStop({
        ...stopInput,
        stop_name: 'Yuille St - Stop D99'
      })

      expect(stopData.matchStopNumber()).to.deep.equal({
        stopNumber: 'D99',
        stopName: 'Yuille St'
      })
    })

    it('Should ensure the stop numbers are all uppercase', () => {
      let stopData = GTFSStopsReader.processStop({
        ...stopInput,
        stop_name: '125a-Southbank Tram Depot (South Melbourne)'
      })

      expect(stopData.matchStopNumber()).to.deep.equal({
        stopNumber: '125A',
        stopName: 'Southbank Tram Depot'
      })
    })

    it('Should return null if there is no stop number', () => {
      let stopData = GTFSStopsReader.processStop({
        ...stopInput,
        stop_name: 'Southbank Tram Depot (South Melbourne)'
      })

      expect(stopData.matchStopNumber()).to.deep.equal({
        stopNumber: null,
        stopName: 'Southbank Tram Depot'
      })
    })
  })

  describe('The getPrimaryStopName function', () => {
    it('Should return the stop name up to the last instance of "/"', () => {
      let stopData = GTFSStopsReader.processStop(stopInput)
      expect(stopData.getPrimaryStopName()).to.equal('Dole Ave')
    })

    it('Should handle / appearing in a stop name', () => {
      let stopData = GTFSStopsReader.processStop({
        ...stopInput,
        stop_name: '124A-Casino/MCEC/Clarendon St (Southbank)'
      })
      expect(stopData.getPrimaryStopName()).to.equal('Casino/MCEC')
    })

    it('Should return the full name if there is no /', () => {
      let stopData = GTFSStopsReader.processStop({
        ...stopInput,
        stop_name: 'Southbank Tram Depot (Southbank)'
      })
      expect(stopData.getPrimaryStopName()).to.equal('Southbank Tram Depot')
    })
  })

  describe('The getSecondaryStopName function', () => {
    it('Should return the stop name up to the last instance of "/"', () => {
      let stopData = GTFSStopsReader.processStop(stopInput)
      expect(stopData.getSecondaryStopName()).to.equal('Cheddar Rd')
    })

    it('Should handle / appearing in a stop name', () => {
      let stopData = GTFSStopsReader.processStop({
        ...stopInput,
        stop_name: '124A-Casino/MCEC/Clarendon St (Southbank)'
      })
      expect(stopData.getSecondaryStopName()).to.equal('Clarendon St')
    })

    it('Should return the full name if there is no /', () => {
      let stopData = GTFSStopsReader.processStop({
        ...stopInput,
        stop_name: 'Southbank Tram Depot (Southbank)'
      })
      expect(stopData.getSecondaryStopName()).to.equal('')
    })
  })

  describe('The getFullStopName function', () => {
    it('Should expand the stop name', () => {
      let stopData = GTFSStopsReader.processStop(stopInput2)
      expect(stopData.getFullStopName()).to.equal('Rex Street/Taylors Road')
    })

    it('Should handle stops with only a primary name', () => {
      let stopData = GTFSStopsReader.processStop({
        ...stopInput,
        stop_name: 'Knox City SC (Knoxfield)'
      })
      expect(stopData.getFullStopName()).to.equal('Knox City Shopping Centre')      
    })

    it('Should handle the direction appearing as well', () => {
      let stopData = GTFSStopsReader.processStop({
        ...stopInput,
        stop_name: 'Newman Cres (north side)/east of Pechell St (Made Up Suburb)'
      })
      expect(stopData.getFullStopName()).to.equal('Newman Crescent - North/Pechell Street - East')      
    })
  })
})