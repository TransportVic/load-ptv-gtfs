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

async function downloadGTFS() {
  nock(gtfsHost).get(gtfsURL).reply(200, stubGTFSUnzipping)
  let tmp = await tmpdir({ unsafeCleanup: true })

  let gtfs = new PTVGTFS(gtfsHost + gtfsURL)
  await gtfs.download(tmp.path)

  return {
    gtfs, tmp
  }
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

  describe('The download function', () => {
    it('Should save the gtfs file to the given folder, with the filename as gtfs.zip', async () => {
      let { gtfs, tmp } = await downloadGTFS()

      let stat = await fs.stat(path.join(tmp.path, 'gtfs.zip'))
      expect(stat.size).to.equal(23408)

      await tmp.cleanup()
    })
  })

  describe('The unzip function', () => {
    it('Should throw and error if the file has not been downloaded first', async () => {
      let gtfs = new PTVGTFS(gtfsHost + gtfsURL)
      expect((await gtfs.unzip().catch(e => e)).message).to.equal('Need to download GTFS file first!')
    })

    it('Should unzip gtfs.zip, producing the numbered folders', async () => {
      let { gtfs, tmp } = await downloadGTFS()
      await gtfs.unzip()

      let stat = await fs.stat(path.join(tmp.path, '1', 'google_transit.zip'))
      expect(stat).to.not.be.null

      await tmp.cleanup()
    })

    it('Should unzip the google_transit.zip files in the numbered folders as well', async () => {
      let { gtfs, tmp } = await downloadGTFS()
      await gtfs.unzip()

      for (let i = 1; i <= 11; i++) {
        if (i === 9) continue
        let stat = await fs.stat(path.join(tmp.path, i.toString(), 'stops.txt'))
        expect(stat).to.not.be.null
      }

      await tmp.cleanup()
    })
  })

  describe('The cleanup function', () => {
    it('Should remove the zip files, keeping the CSV files intact', async () => {
      let { gtfs, tmp } = await downloadGTFS()
      await gtfs.unzip()
      await gtfs.cleanup()

      let mainStat = await fs.stat(path.join(tmp.path, 'gtfs.zip')).catch(e => e)
      expect(mainStat).to.be.instanceof(Error)

      for (let i = 1; i <= 11; i++) {
        if (i === 9) continue
        let stat = await fs.stat(path.join(tmp.path, i.toString(), 'google_transit.zip')).catch(e => e)
        expect(stat).to.be.instanceof(Error)
      }

      await tmp.cleanup()
    })
  })
})