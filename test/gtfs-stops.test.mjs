import { expect } from 'chai'
import GTFSStopsReader from '../lib/gtfs-parser/readers/GTFSStopsReader.mjs'
import path from 'path'
import url from 'url'
import suburbs from './sample-data/suburbs.json' with { type: 'json' }

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const stopsFile = path.join(__dirname, 'sample-data', 'gtfs-splitting', 'line_reader_test.txt')

const parentStopsFile = path.join(__dirname, 'sample-data', 'parent-stop', 'stops.txt')

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

let stopInput3 = {
  stop_id: '13486',
  stop_name: 'Narre Warren, Fountain Gate Primary School/Victoria Rd',
  stop_lat: '-38.0093755011572',
  stop_lon: '145.296182027229'
}

describe('The GTFSStopReader class', () => {
  describe('The initialProcess function', () => {
    it('Should take in the raw CSV line and process it', () => {
      let stopData = new GTFSStopsReader('', suburbs).processEntity(stopInput)

      expect(stopData.originalName).to.equal(stopInput.stop_name)
      expect(stopData.stopGTFSID).to.equal(stopInput.stop_id)
      expect(stopData.location).to.deep.equal({
        type: 'Point',
        coordinates: [145.018951051008, -37.7007748061827]
      })
    })

    it('Should populate the suburb and stop number', () => {
      let stopData = new GTFSStopsReader('', suburbs).processEntity({
        ...stopInput2,
        stop_name: '51a-Rex St/Taylors Rd (Kings Park)'
      })

      expect(stopData.suburb).to.equal('Kings Park')
      expect(stopData.stopNumber).to.equal('51A')
    })

    it('Should return the parent stop data if available', async () => {
      let stopReader = new GTFSStopsReader(parentStopsFile, suburbs)
      await stopReader.open()

      let stopData = await stopReader.getNextEntity()
      expect(stopData.rawStopName).to.equal('Clifton Hill Station')
      expect(stopData.stopGTFSID).to.equal('14330')
      expect(stopData.parentStopGTFSID).to.equal('vic:rail:CHL')
    })

    it('Should allow a custom stop suburb hook', async () => {
      let stopReader = new GTFSStopsReader(parentStopsFile, suburbs, () => 'Test')
      await stopReader.open()

      let stopData = await stopReader.getNextEntity()
      expect(stopData.rawStopName).to.equal('Clifton Hill Station')
      expect(stopData.suburb).to.equal('Test')
    })
  })

  describe('The getNextEntity function', () => {
    it('Should read the CSV file and return the next stop', async () => {
      let stopReader = new GTFSStopsReader(stopsFile)
      await stopReader.open()

      let stopData = await stopReader.getNextEntity()

      expect(stopData.rawStopName).to.equal('Dole Ave/Cheddar Rd')
      expect(stopData.stopGTFSID).to.equal('1000')
    })
  })

  describe('The available function', () => {
    it('Should return true if there is more data, and false otherwise', async () => {
      let stopReader = new GTFSStopsReader(stopsFile)
      await stopReader.open()

      for (let i = 0; i < 6; i++) await stopReader.getNextEntity()
      expect(stopReader.available()).to.be.true
    
      await stopReader.getNextEntity()
      expect(stopReader.available()).to.be.false
    })
  })
})

describe('The GTFSStop class', () => {
  describe('The requiresSuburb function', () => {
    it('Should return false if the stop name already has a suburb', async () => {
      let stopData = new GTFSStopsReader('', suburbs).processEntity(stopInput)
      expect(stopData.requiresSuburb()).to.be.false
    })

    it('Should return false if the stop name is missing the suburb', async () => {
      let stopData = new GTFSStopsReader('', suburbs).processEntity({
        ...stopInput,
        stop_name: 'Dole Ave/Cheddar Rd'
      })
      expect(stopData.requiresSuburb()).to.be.true
    })
  })

  describe('The getSuburbFromName function', () => {
    it('Should extract the stop suburb from its name in brackets', () => {
      let stopData = new GTFSStopsReader('', suburbs).processEntity(stopInput)
      expect(stopData.getSuburbFromName()).to.equal('Reservoir')
    })

    it('Should extract the stop suburb from its name if it appears at the front', () => {
      let stopData = new GTFSStopsReader('', suburbs).processEntity(stopInput3)
      expect(stopData.suburbIsInFront()).to.be.true
      expect(stopData.getSuburbFromName()).to.equal('Narre Warren')
    })
  })

  describe('The getSuburbState function', () => {
    it('Should extract the state form a suburb in the form (Suburb (State))', () => {
      let stopName = 'Albury Botanic Gardens/Wodonga Pl (Albury (NSW))'
      let stopData = new GTFSStopsReader('', suburbs).processEntity({
        ...stopInput,
        stop_name: stopName
      })

      expect(stopData.getSuburbState(stopName.lastIndexOf('('))).to.equal('NSW')
    })
  })

  it('Should process interstate suburbs in the format (Suburb (State))', () => {
    let stopData = new GTFSStopsReader('', suburbs).processEntity({
      ...stopInput,
      stop_name: 'Albury Botanic Gardens/Wodonga Pl (Albury (NSW))'
    })
    expect(stopData.getSuburbFromName()).to.equal('Albury, NSW')
  })

  it('Should process interstate suburbs in the format (Suburb (Local Area - State))', () => {
    let stopData = new GTFSStopsReader('', suburbs).processEntity({
      ...stopInput,
      stop_name: 'Emma Way/Wright St (Glenroy (Albury - NSW))'
    })
    expect(stopData.getSuburbFromName()).to.equal('Glenroy, NSW')
  })

  it('Should expand St in the suburb name', () => {
    let stopData = new GTFSStopsReader('', suburbs).processEntity({
      ...stopInput,
      stop_name: 'Dundas St/Market St (St Arnaud)'
    })
    expect(stopData.getSuburbFromName()).to.equal('St. Arnaud')
  })

  it('Should expand Mt in the suburb name', () => {
    let stopData = new GTFSStopsReader('', suburbs).processEntity({
      ...stopInput,
      stop_name: 'Tourist Information Centre/Jubilee Hwy East (Mt Gambier (SA))'
    })
    expect(stopData.getSuburbFromName()).to.equal('Mount Gambier, SA')
  })

  describe('The getSuburbFromLocation function', () => {
    it('Should expand St in the suburb name', () => {
      let stopData = new GTFSStopsReader('', suburbs).processEntity({
        stop_id: '912',
        stop_name: 'Princes St/Barkly St',
        stop_lat: '-37.8597466731382',
        stop_lon: '144.98247799877'
      })
      expect(stopData.getSuburbFromLocation(suburbs)).to.equal('St. Kilda')
    })

    it('Should return a generic Interstate suburb if it cannot identify the suburb', () => {
      let stopData = new GTFSStopsReader('', suburbs).processEntity({
        stop_id: '20815',
        stop_name: '85 Franklin St',
        stop_lat: '-34.9274852283649',
        stop_lon: '138.595751207359'
      })
      expect(stopData.getSuburbFromLocation(suburbs)).to.equal('Interstate')
    })
  })

  describe('The getStopNameWithoutSuburb function', () => {
    it('Should strip the suburb from the stop name if the suburb appears behind', () => {
      let stopData = new GTFSStopsReader('', suburbs).processEntity(stopInput)

      expect(stopData.getStopNameWithoutSuburb()).to.equal('Dole Ave/Cheddar Rd')
    })

    it('Should strip the suburb from the stop name for NSW/SA stops', () => {
      let stopName = 'Albury Railway Station (Albury (NSW))'
      let stopData = new GTFSStopsReader('', suburbs).processEntity({
        ...stopInput,
        stop_name: stopName
      })

      expect(stopData.getStopNameWithoutSuburb()).to.equal('Albury Railway Station')
    })

    it('Should strip the suburb from the stop name if the suburb is in front', () => {
      let stopData = new GTFSStopsReader('', suburbs).processEntity(stopInput3)

      expect(stopData.getStopNameWithoutSuburb()).to.equal('Fountain Gate Primary School/Victoria Rd')
    })
  })

  describe('The matchStopNumber function', () => {
    it('Should match stop numbers in the format XXX-STOPNAME', () => {
      let stopData = new GTFSStopsReader('', suburbs).processEntity({
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
      let stopData = new GTFSStopsReader('', suburbs).processEntity({
        ...stopInput,
        stop_name: 'Yuille St - Stop D99'
      })

      expect(stopData.matchStopNumber()).to.deep.equal({
        stopNumber: 'D99',
        stopName: 'Yuille St'
      })
    })

    it('Should ensure the stop numbers are all uppercase', () => {
      let stopData = new GTFSStopsReader('', suburbs).processEntity({
        ...stopInput,
        stop_name: '125a-Southbank Tram Depot (South Melbourne)'
      })

      expect(stopData.matchStopNumber()).to.deep.equal({
        stopNumber: '125A',
        stopName: 'Southbank Tram Depot'
      })
    })

    it('Should return null if there is no stop number', () => {
      let stopData = new GTFSStopsReader('', suburbs).processEntity({
        ...stopInput,
        stop_name: 'Southbank Tram Depot (South Melbourne)'
      })

      expect(stopData.matchStopNumber()).to.deep.equal({
        stopNumber: null,
        stopName: 'Southbank Tram Depot'
      })
    })

    it('Should not match street numbers spanning multiple units', () => {
      let stopData = new GTFSStopsReader('', suburbs).processEntity({
        ...stopInput,
        stop_name: '227-243 Wellington Rd (Mulgrave)'
      })

      expect(stopData.matchStopNumber()).to.deep.equal({
        stopNumber: null,
        stopName: '227-243 Wellington Rd'
      })
    })
  })

  describe('The getFullStopName function', () => {
    it('Should expand the stop name', () => {
      let stopData = new GTFSStopsReader('', suburbs).processEntity(stopInput2)
      expect(stopData.getFullStopName()).to.equal('Rex Street/Taylors Road')
    })

    it('Should handle stops with only a primary name', () => {
      let stopData = new GTFSStopsReader('', suburbs).processEntity({
        ...stopInput,
        stop_name: 'Knox City SC (Knoxfield)'
      })
      expect(stopData.getFullStopName()).to.equal('Knox City Shopping Centre')      
    })

    it('Should handle the direction appearing as well', () => {
      let stopData = new GTFSStopsReader('', suburbs).processEntity({
        ...stopInput,
        stop_name: 'Newman Cres (north side)/east of Pechell St (Made Up Suburb)'
      })
      expect(stopData.getFullStopName()).to.equal('Newman Crescent - North/Pechell Street - East')      
    })
  })
})