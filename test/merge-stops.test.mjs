import { expect } from 'chai'
import merge from '../lib/post-processing/merge-stops.mjs'

describe('The stop merger', () => {
  it('Should insert a deviation into a route', () => {
    let variants = [
      [
        { "stopName" : "Yarraville", "stopGTFSID" : "19996" },
        { "stopName" : "Spotswood", "stopGTFSID" : "19995" },
        { "stopName" : "Newport", "stopGTFSID" : "19994" },
        { "stopName" : "Seaholme", "stopGTFSID" : "19927" },
        { "stopName" : "Altona", "stopGTFSID" : "19926" },
        { "stopName" : "Westona", "stopGTFSID" : "19925" },
        { "stopName" : "Laverton", "stopGTFSID" : "19923" },
        { "stopName" : "Aircraft", "stopGTFSID" : "19924" }
      ], [
        { "stopName" : "North Melbourne", "stopGTFSID" : "19973" },
				{ "stopName" : "South Kensington", "stopGTFSID" : "20026" },
				{ "stopName" : "Footscray", "stopGTFSID" : "20025" },
				{ "stopName" : "Seddon", "stopGTFSID" : "19997" },
        { "stopName" : "Yarraville", "stopGTFSID" : "19996" },
        { "stopName" : "Spotswood", "stopGTFSID" : "19995" },
        { "stopName" : "Newport", "stopGTFSID" : "19994" },
        { "stopName" : "Laverton", "stopGTFSID" : "19923" },
        { "stopName" : "Aircraft", "stopGTFSID" : "19924" },
        { "stopName" : "Williams Landing", "stopGTFSID" : "46468" },
				{ "stopName" : "Hoppers Crossing", "stopGTFSID" : "19922" },
				{ "stopName" : "Werribee", "stopGTFSID" : "19921" }
      ]
    ]

    expect(merge(variants)).to.deep.equal([
      { "stopName" : "North Melbourne", "stopGTFSID" : "19973" },
      { "stopName" : "South Kensington", "stopGTFSID" : "20026" },
      { "stopName" : "Footscray", "stopGTFSID" : "20025" },
      { "stopName" : "Seddon", "stopGTFSID" : "19997" },
      { "stopName" : "Yarraville", "stopGTFSID" : "19996" },
      { "stopName" : "Spotswood", "stopGTFSID" : "19995" },
      { "stopName" : "Newport", "stopGTFSID" : "19994" },
      { "stopName" : "Seaholme", "stopGTFSID" : "19927" },
      { "stopName" : "Altona", "stopGTFSID" : "19926" },
      { "stopName" : "Westona", "stopGTFSID" : "19925" },
      { "stopName" : "Laverton", "stopGTFSID" : "19923" },
      { "stopName" : "Aircraft", "stopGTFSID" : "19924" },
      { "stopName" : "Williams Landing", "stopGTFSID" : "46468" },
      { "stopName" : "Hoppers Crossing", "stopGTFSID" : "19922" },
      { "stopName" : "Werribee", "stopGTFSID" : "19921" }
    ])
  })
})