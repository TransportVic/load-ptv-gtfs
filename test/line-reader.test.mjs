import { expect } from 'chai'
import path from 'path'
import url from 'url'
import CSVLineReader from '../lib/gtfs-parser/readers/line-reader.mjs'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const stopsFile = path.join(__dirname, 'sample-data', 'gtfs-splitting', 'line_reader_test.txt')
const oneLineFile = path.join(__dirname, 'sample-data', 'one_line.csv')

const noQuotesFile = path.join(__dirname, 'sample-data', 'mtm-rail', 'stops.txt')

describe('The CSVLineReader class', () => {
  it('Should open a CSV file and identify the headers', async () => {
    let reader = new CSVLineReader(stopsFile)
    await reader.open()

    expect(reader.getHeaders()).to.deep.equal([
      'stop_id', 'stop_name', 'stop_lat', 'stop_lon'
    ])

    await reader.close()
  })

  it('Can handle files that are not quoted', async () => {
    let reader = new CSVLineReader(noQuotesFile)
    await reader.open()

    let line = await reader.nextLine()
    expect(line).to.deep.equal({
      stop_id: '77945',
      stop_code: '',
      stop_name: 'Alamein_Up',
      stop_desc: '',
      stop_lat: '-37.868383',
      stop_lon: '145.079837',
      zone_id: '',
      stop_url: '',
      location_type: '0',
      parent_station: '',
      stop_timezone: '',
      wheelchair_boarding: '',
      platform_code: '',
      tts_stop_name: ''
    })
    await reader.close()
  })

  it('Should return the first line of the CSV, with the fields mapped to their headers', async () => {
    let reader = new CSVLineReader(stopsFile)
    await reader.open()

    let line = await reader.nextLine()
    expect(line).to.deep.equal({
      stop_id: '1000',
      stop_name: 'Dole Ave/Cheddar Rd (Reservoir)',
      stop_lat: '-37.7007748061827',
      stop_lon: '145.018951051008'
    })

    await reader.close()
  })

  it('Should be able to peek if a line is available', async () => {
    let reader = new CSVLineReader(stopsFile)
    await reader.open()

    for (let i = 0; i < 6; i++) await reader.nextLine()

    expect(reader.available()).to.be.true
    expect(await reader.nextLine()).to.deep.equal({
      stop_id: '10011',
      stop_name: 'Moffat St/Main Rd West (St Albans)',
      stop_lat: '-37.7423246041343',
      stop_lon: '144.783466504334'
    })
    expect(reader.available()).to.be.false
  })

  it('Should be unable to unread a single line from the file', async () => {
    let reader = new CSVLineReader(stopsFile)
    await reader.open()
    let expectedLine = {
      stop_id: '1000',
      stop_name: 'Dole Ave/Cheddar Rd (Reservoir)',
      stop_lat: '-37.7007748061827',
      stop_lon: '145.018951051008'
    }

    let line = await reader.nextLine()
    expect(line).to.deep.equal(expectedLine)
    reader.unreadLine()

    expect(await reader.nextLine()).to.deep.equal(expectedLine)
  })

  it('Should be unable to unread the last line from the file, then read it again', async () => {
    let reader = new CSVLineReader(oneLineFile)

    await reader.open()
    let expectedLine = {
      trip_id: '1.T2.2-ALM-vpt-1.1.R'
    }

    expect(reader.available()).to.be.true
    let line = await reader.nextLine()
    expect(line).to.deep.equal(expectedLine)
    
    expect(reader.available(), 'No more data should be available').to.be.false

    reader.unreadLine()

    expect(reader.available(), 'More data should be available after unreading the last line').to.be.true

    expect(await reader.nextLine()).to.deep.equal(expectedLine)

    expect(reader.available()).to.be.false
  })
})