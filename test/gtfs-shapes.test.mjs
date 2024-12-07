import { expect } from 'chai'
import path from 'path'
import url from 'url'
import GTFSShapeReader from '../lib/gtfs-parser/readers/GTFSShapeReader.mjs'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const shapeFile = path.join(__dirname, 'sample-data', 'shapes', 'shapes.txt')

describe('The GTFSShapeReader class', () => {
  it('Should read the trips.txt file and return a GTFSTrip object', async () => {
    let reader = new GTFSShapeReader(shapeFile)
    await reader.open()

    let shape = await reader.getNextEntity()

    expect(shape.shapeID).to.equal('49-601-aus-1.2.R')
    expect(shape.points.length).to.equal(46)
    expect(shape.shapeLength).to.equal(3069.43)
    expect(shape.hash).to.equal(`3069.43-145.102663,-37.910905-145.131911,-37.913896`)
  })
})