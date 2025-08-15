import { expect } from 'chai'
import { IdentifiableTrip } from '../lib/gtfs-parser/GTFSTrip.mjs'

const CALENDAR = {
  id: '',
  getOperationDays: () => []
}

describe('The new trip format class', () => {
  it('Parses Metro trips 02-SUY--11-T2-Z000', () => {
    expect(new IdentifiableTrip({
      calendar: CALENDAR,
      id: '02-SUY--11-T2-Z000'
    }).getRunID()).to.equal('Z000')
  })

  it('Parses Metro RRB trips 02-STY-R-12-T6-BP436', () => {
    expect(new IdentifiableTrip({
      calendar: CALENDAR,
      id: '02-STY-R-12-T6-BP436'
    }).getRunID()).to.equal('BP436')
  })

  it('Parses V/Line trips 01-BDE--10-T2-8460', () => {
    expect(new IdentifiableTrip({
      calendar: CALENDAR,
      id: '01-BDE--10-T2-8460'
    }).getRunID()).to.equal('8460')
  })

  it('Parses Tram trips 03-1--10-T2-133092762', () => {
    expect(new IdentifiableTrip({
      calendar: CALENDAR,
      id: '03-1--10-T2-133092762'
    }).getRunID()).to.equal('133092762')
  })

  it('Parses Coach trips 05-GEL--13-T3-C299', () => {
    expect(new IdentifiableTrip({
      calendar: CALENDAR,
      id: '05-GEL--13-T3-C299'
    }).getRunID()).to.equal('C299')
  })

  it('Parses Coach trips 05-GEL--3-T0-8807C', () => {
    expect(new IdentifiableTrip({
      calendar: CALENDAR,
      id: '05-GEL--3-T0-8807C'
    }).getRunID()).to.equal('8807C')
  })
})