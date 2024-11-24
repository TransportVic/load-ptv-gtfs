import { expect } from 'chai'
import path from 'path'
import url from 'url'
import GTFSStopTimesReader from '../lib/gtfs-parser/readers/GTFSStopTimesReader.mjs'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const stopTimesFile = path.join(__dirname, 'sample-data', 'trips', 'stop_times.txt')

describe('The GTFSStopTimesReader class', () => {
  it('Should read the stop times one trips worth at a time', async () => {
    let reader = new GTFSStopTimesReader(stopTimesFile)

    await reader.open()

    let stopTimes = await reader.getNextEntity()
    expect(stopTimes.tripID).to.equal('1.T2.2-ALM-vpt-1.1.R')
    expect(stopTimes.stops.length).to.equal(7)
    expect(stopTimes.stops[0].stopID).to.equal('19847')
    expect(stopTimes.stops[0].departureTime).to.equal('04:57:00')

    expect(stopTimes.stops[6].stopID).to.equal('19853')
    expect(stopTimes.stops[6].departureTime).to.equal('05:08:00')
  })
})