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
    expect(stopTimes.tripID).to.equal('02-ALM--12-T5-2000')
    expect(stopTimes.stops.length).to.equal(7)
    expect(stopTimes.stops[0].stopID).to.equal('11197')
    expect(stopTimes.stops[0].departureTime).to.equal('04:57')

    expect(stopTimes.stops[6].stopID).to.equal('11207')
    expect(stopTimes.stops[6].departureTime).to.equal('05:08')

    await reader.getNextEntity()
    await reader.getNextEntity()

    let lastTrip = await reader.getNextEntity()
    expect(lastTrip.tripID).to.equal('02-ALM--12-T5-2001')
    expect(lastTrip.stops.length).to.equal(7)
    expect(lastTrip.stops[0].stopID).to.equal('11207')
    expect(lastTrip.stops[0].departureTime).to.equal('23:31')
    
    expect(reader.available()).to.be.false
  })
})