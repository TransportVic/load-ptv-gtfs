import { expect } from 'chai'
import nock from 'nock'
import PTVGTFS from '../lib/gtfs-package/PTVGTFS.mjs'
import path from 'path'
import url from 'url'
import { dir as tmpdir } from 'tmp-promise'
import fs from 'fs/promises'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let gtfsHost = 'http://data.ptv.vic.gov.au'
let gtfsURL = '/downloads/gtfs.zip'

let responseHeaders = {
  'last-modified': 'Fri, 12 Jul 2024 02:25:21 GMT',
  'content-length': '165927454',
  'content-type': 'application/zip'
}

const stubGTFSUnzipping = (await fs.readFile(path.join(__dirname, 'sample-data', 'gtfs-unzipping', 'gtfs.zip')))

describe('The PTVGTFS class', () => {
  describe('The getPublishedDate function', () => {
    it('Should read the last-modified header and return that', async () => {
      nock(gtfsHost).head(gtfsURL).reply(200, '', responseHeaders)

      let gtfs = new PTVGTFS(gtfsHost + gtfsURL)
      let publishedDate = await gtfs.getPublishedDate()

      expect(publishedDate.toISOString()).to.equal('2024-07-12T02:25:21.000Z')
    })
  })

  describe('The download function', () => {
    it('Should save the gtfs file to the given folder, with the filename as gtfs.zip', async () => {
      nock(gtfsHost).get(gtfsURL).reply(200, stubGTFSUnzipping)
      let tmp = await tmpdir({ unsafeCleanup: true })

      let gtfs = new PTVGTFS(gtfsHost + gtfsURL)
      await gtfs.download(tmp.path)

      let stat = await fs.stat(path.join(tmp.path, 'gtfs.zip'))
      expect(stat.size).to.equal(23408)

      await tmp.cleanup()
    })
  })
})