import { expect } from 'chai'
import nock from 'nock'
import PTVGTFS from '../lib/gtfs-package/PTVGTFS.mjs'

let gtfsHost = 'http://data.ptv.vic.gov.au'
let gtfsURL = '/downloads/gtfs.zip'

let responseHeaders = {
  'last-modified': 'Fri, 12 Jul 2024 02:25:21 GMT',
  'content-length': '165927454',
  'content-type': 'application/zip'
}

describe('The PTVGTFS class', () => {
  describe('The getPublishedDate function', () => {
    it('Should read the last-modified header and return that', async () => {
      nock(gtfsHost).head(gtfsURL).reply(200, '', responseHeaders)

      let gtfs = new PTVGTFS(gtfsHost + gtfsURL)
      let publishedDate = await gtfs.getPublishedDate()

      expect(publishedDate.toISOString()).to.equal('2024-07-12T02:25:21.000Z')
    })
  })
})