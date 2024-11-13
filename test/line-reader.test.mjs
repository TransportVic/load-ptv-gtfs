import { expect } from 'chai'
import path from 'path'
import url from 'url'
import CSVLineReader from '../lib/gtfs-parser/readers/line-reader.mjs'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const stopsFile = path.join(__dirname, 'sample-data', 'gtfs-splitting', 'line_reader_test.txt')

describe('The CSVLineReader class', () => {
  it('Should open a CSV file and identify the headers', async () => {
    let reader = new CSVLineReader(stopsFile)
    await reader.open()

    expect(reader.getHeaders()).to.deep.equal([
      'stop_id', 'stop_name', 'stop_lat', 'stop_lon'
    ])

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
})