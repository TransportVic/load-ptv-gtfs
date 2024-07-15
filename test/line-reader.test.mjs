import { expect } from 'chai'
import path from 'path'
import url from 'url'
import CSVLineReader from '../lib/gtfs-parser/line-reader.mjs'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const stopsFile = path.join(__dirname, 'sample-data', 'gtfs-splitting', 'sample_stops.txt')

describe('The CSVLineReader class', () => {
  it('Should open a CSV file and identify the headers', async () => {
    let reader = new CSVLineReader(stopsFile)
    await reader.open()

    expect(reader.getHeaders()).to.deep.equal([
      'stop_id', 'stop_name', 'stop_lat', 'stop_lon'
    ])
  })
})