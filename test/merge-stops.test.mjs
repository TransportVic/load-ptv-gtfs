import { expect } from 'chai'
import merge from '../lib/post-processing/merge-stops.mjs'

describe('The stop merger', () => {
  it('Should insert a deviation (Altona Loop)', () => {
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

  it('Should merge 2 different branches (742)', () => {
    let variants = [
      [
        { "stopName" : "Blackburn Road/Ferntree Gully Road", "stopGTFSID" : "13038" },
				{ "stopName" : "Blackburn Road/Normanby Road", "stopGTFSID" : "15418" },
				{ "stopName" : "Howleys Road/Normanby Road", "stopGTFSID" : "15419" },
				{ "stopName" : "Monash University/Research Way", "stopGTFSID" : "22447" },
				{ "stopName" : "Hilltop Avenue/Gardiner Road", "stopGTFSID" : "22445" },
				{ "stopName" : "Ferntree Gully Road/Gardiner Road", "stopGTFSID" : "22442" },
				{ "stopName" : "Gardiner Road/Ferntree Gully Road", "stopGTFSID" : "13043" }
      ], 
      [
        { "stopName" : "Blackburn Road/Ferntree Gully Road", "stopGTFSID" : "13038" },
				{ "stopName" : "Blackburn Road/Normanby Road", "stopGTFSID" : "15418" },
				{ "stopName" : "Howleys Road/Normanby Road", "stopGTFSID" : "15419" },
				{ "stopName" : "CSIRO/Normanby Road", "stopGTFSID" : "40973" },
				{ "stopName" : "Ferntree Gully Road/Gardiner Road", "stopGTFSID" : "22442" },
				{ "stopName" : "Gardiner Road/Ferntree Gully Road", "stopGTFSID" : "13043" }
      ]
    ]

    expect(merge(variants)).to.deep.equal([
      { "stopName" : "Blackburn Road/Ferntree Gully Road", "stopGTFSID" : "13038" },
      { "stopName" : "Blackburn Road/Normanby Road", "stopGTFSID" : "15418" },
      { "stopName" : "Howleys Road/Normanby Road", "stopGTFSID" : "15419" },
      { "stopName" : "Monash University/Research Way", "stopGTFSID" : "22447" },
      { "stopName" : "Hilltop Avenue/Gardiner Road", "stopGTFSID" : "22445" },
      { "stopName" : "CSIRO/Normanby Road", "stopGTFSID" : "40973" },
      { "stopName" : "Ferntree Gully Road/Gardiner Road", "stopGTFSID" : "22442" },
      { "stopName" : "Gardiner Road/Ferntree Gully Road", "stopGTFSID" : "13043" }
    ])
  })


  it('Should merge 2 different branches (688)', () => {
    let variants = [
      [
        { "stopName" : "Montrose Town Centre/Mount Dandenong Tourist Road", "stopGTFSID" : "8936" },
        { "stopName" : "Acacia Avenue/Cambridge Road", "stopGTFSID" : "10295" },
        { "stopName" : "Alpine Way/Cambridge Road", "stopGTFSID" : "10296" },
        { "stopName" : "Regina Street/Cambridge Road", "stopGTFSID" : "11081" },
        { "stopName" : "Balmoral Street/Durham Road", "stopGTFSID" : "11082" },
        { "stopName" : "Elizabeth Bridge Reserve/Durham Road", "stopGTFSID" : "11083" },
        { "stopName" : "Hansen Park/Durham Road", "stopGTFSID" : "11084" },
        { "stopName" : "Charles Street/Durham Road", "stopGTFSID" : "11085" },
        { "stopName" : "Liverpool Road/Mount Dandenong Road", "stopGTFSID" : "11086" },
        { "stopName" : "Russo Place/Mount Dandenong Road", "stopGTFSID" : "8948" },
        { "stopName" : "Kilsyth Memorial Hall/Mount Dandenong Road", "stopGTFSID" : "8949" },
        { "stopName" : "Shelley Avenue/Mount Dandenong Road", "stopGTFSID" : "8950" },
        { "stopName" : "The Oaks/Mount Dandenong Road", "stopGTFSID" : "8951" },
        { "stopName" : "Ruskin Avenue/Mount Dandenong Road", "stopGTFSID" : "8952" },
        { "stopName" : "Gordon Street/Mount Dandenong Road", "stopGTFSID" : "8953" },
        { "stopName" : "Dorset Road/Mount Dandenong Road", "stopGTFSID" : "8954" },
        { "stopName" : "Norton Road/Mount Dandenong Road", "stopGTFSID" : "8955" },
        { "stopName" : "Arndale Shopping Centre/Mount Dandenong Road", "stopGTFSID" : "8956" },
        { "stopName" : "Mount Dandenong Road/Main Street", "stopGTFSID" : "13457" },
        { "stopName" : "Croydon Railway Station/Railway Avenue", "stopGTFSID" : "28719" }
      ], [
        { "stopName" : "Montrose Town Centre/Mount Dandenong Tourist Road", "stopGTFSID" : "8936" },
        { "stopName" : "Montrose Road/Mount Dandenong Road", "stopGTFSID" : "8937" },
        { "stopName" : "Montrose CFA/Mount Dandenong Road", "stopGTFSID" : "8938" },
        { "stopName" : "Canterbury Road/Mount Dandenong Road", "stopGTFSID" : "8939" },
        { "stopName" : "Bretby Way/Mount Dandenong Road", "stopGTFSID" : "8940" },
        { "stopName" : "Alpine Way/Mount Dandenong Road", "stopGTFSID" : "8941" },
        { "stopName" : "736 Mount Dandenong Road", "stopGTFSID" : "8942" },
        { "stopName" : "Geoffrey Drive/Mount Dandenong Road", "stopGTFSID" : "8943" },
        { "stopName" : "St. Richards Primary School/Mount Dandenong Road", "stopGTFSID" : "8944" },
        { "stopName" : "Cherylnne Crescent/Mount Dandenong Road", "stopGTFSID" : "8945" },
        { "stopName" : "Glendale Court/Mount Dandenong Road", "stopGTFSID" : "8946" },
        { "stopName" : "Durham Road/Mount Dandenong Road", "stopGTFSID" : "8947" },
        { "stopName" : "Liverpool Road/Mount Dandenong Road", "stopGTFSID" : "11086" },
        { "stopName" : "Russo Place/Mount Dandenong Road", "stopGTFSID" : "8948" },
        { "stopName" : "Kilsyth Memorial Hall/Mount Dandenong Road", "stopGTFSID" : "8949" },
        { "stopName" : "Shelley Avenue/Mount Dandenong Road", "stopGTFSID" : "8950" },
        { "stopName" : "The Oaks/Mount Dandenong Road", "stopGTFSID" : "8951" },
        { "stopName" : "Ruskin Avenue/Mount Dandenong Road", "stopGTFSID" : "8952" },
        { "stopName" : "Gordon Street/Mount Dandenong Road", "stopGTFSID" : "8953" },
        { "stopName" : "Dorset Road/Mount Dandenong Road", "stopGTFSID" : "8954" },
        { "stopName" : "Norton Road/Mount Dandenong Road", "stopGTFSID" : "8955" },
        { "stopName" : "Arndale Shopping Centre/Mount Dandenong Road", "stopGTFSID" : "8956" },
        { "stopName" : "Mount Dandenong Road/Main Street", "stopGTFSID" : "13457" },
        { "stopName" : "Croydon Railway Station/Railway Avenue", "stopGTFSID" : "28719" }
      ]
    ]

    expect(merge(variants)).to.deep.equal([
      { "stopName" : "Montrose Town Centre/Mount Dandenong Tourist Road", "stopGTFSID" : "8936" },
      { "stopName" : "Montrose Road/Mount Dandenong Road", "stopGTFSID" : "8937" },
      { "stopName" : "Montrose CFA/Mount Dandenong Road", "stopGTFSID" : "8938" },
      { "stopName" : "Canterbury Road/Mount Dandenong Road", "stopGTFSID" : "8939" },
      { "stopName" : "Bretby Way/Mount Dandenong Road", "stopGTFSID" : "8940" },
      { "stopName" : "Alpine Way/Mount Dandenong Road", "stopGTFSID" : "8941" },
      { "stopName" : "736 Mount Dandenong Road", "stopGTFSID" : "8942" },
      { "stopName" : "Geoffrey Drive/Mount Dandenong Road", "stopGTFSID" : "8943" },
      { "stopName" : "St. Richards Primary School/Mount Dandenong Road", "stopGTFSID" : "8944" },
      { "stopName" : "Cherylnne Crescent/Mount Dandenong Road", "stopGTFSID" : "8945" },
      { "stopName" : "Glendale Court/Mount Dandenong Road", "stopGTFSID" : "8946" },
      { "stopName" : "Durham Road/Mount Dandenong Road", "stopGTFSID" : "8947" },
      { "stopName" : "Acacia Avenue/Cambridge Road", "stopGTFSID" : "10295" },
      { "stopName" : "Alpine Way/Cambridge Road", "stopGTFSID" : "10296" },
      { "stopName" : "Regina Street/Cambridge Road", "stopGTFSID" : "11081" },
      { "stopName" : "Balmoral Street/Durham Road", "stopGTFSID" : "11082" },
      { "stopName" : "Elizabeth Bridge Reserve/Durham Road", "stopGTFSID" : "11083" },
      { "stopName" : "Hansen Park/Durham Road", "stopGTFSID" : "11084" },
      { "stopName" : "Charles Street/Durham Road", "stopGTFSID" : "11085" },
      { "stopName" : "Liverpool Road/Mount Dandenong Road", "stopGTFSID" : "11086" },
      { "stopName" : "Russo Place/Mount Dandenong Road", "stopGTFSID" : "8948" },
      { "stopName" : "Kilsyth Memorial Hall/Mount Dandenong Road", "stopGTFSID" : "8949" },
      { "stopName" : "Shelley Avenue/Mount Dandenong Road", "stopGTFSID" : "8950" },
      { "stopName" : "The Oaks/Mount Dandenong Road", "stopGTFSID" : "8951" },
      { "stopName" : "Ruskin Avenue/Mount Dandenong Road", "stopGTFSID" : "8952" },
      { "stopName" : "Gordon Street/Mount Dandenong Road", "stopGTFSID" : "8953" },
      { "stopName" : "Dorset Road/Mount Dandenong Road", "stopGTFSID" : "8954" },
      { "stopName" : "Norton Road/Mount Dandenong Road", "stopGTFSID" : "8955" },
      { "stopName" : "Arndale Shopping Centre/Mount Dandenong Road", "stopGTFSID" : "8956" },
      { "stopName" : "Mount Dandenong Road/Main Street", "stopGTFSID" : "13457" },
      { "stopName" : "Croydon Railway Station/Railway Avenue", "stopGTFSID" : "28719" }
    ])
  })

  it('Should not create any further stops if a deviation overlaps (City Loop)', () => {
    let variants = [
      [
        { "stopName" : "Flinders Street Railway Station", "stopGTFSID" : "19854" },
        { "stopName" : "Southern Cross Railway Station", "stopGTFSID" : "22180" },
        { "stopName" : "Flagstaff Railway Station", "stopGTFSID" : "19841" },
        { "stopName" : "Melbourne Central Railway Station", "stopGTFSID" : "19842" },
        { "stopName" : "Parliament Railway Station", "stopGTFSID" : "19843" },
        { "stopName" : "Richmond Railway Station", "stopGTFSID" : "19908" },
        { "stopName" : "East Richmond Railway Station", "stopGTFSID" : "19907" },
        { "stopName" : "Burnley Railway Station", "stopGTFSID" : "19906" },
        { "stopName" : "Hawthorn Railway Station", "stopGTFSID" : "19905" },
        { "stopName" : "Glenferrie Railway Station", "stopGTFSID" : "19904" },
        { "stopName" : "Auburn Railway Station", "stopGTFSID" : "19903" },
        { "stopName" : "Camberwell Railway Station", "stopGTFSID" : "19853" },
      ], [
        { "stopName" : "Flinders Street Railway Station", "stopGTFSID" : "19854" },
        { "stopName" : "Richmond Railway Station", "stopGTFSID" : "19908" },
        { "stopName" : "East Richmond Railway Station", "stopGTFSID" : "19907" },
        { "stopName" : "Burnley Railway Station", "stopGTFSID" : "19906" },
        { "stopName" : "Hawthorn Railway Station", "stopGTFSID" : "19905" },
        { "stopName" : "Glenferrie Railway Station", "stopGTFSID" : "19904" },
        { "stopName" : "Auburn Railway Station", "stopGTFSID" : "19903" },
        { "stopName" : "Camberwell Railway Station", "stopGTFSID" : "19853" },
      ]
    ]

    expect(merge(variants)).to.deep.equal(variants[0])
  })


  it('Should merge 2 different branches (NOR Group City Loop)', () => {
    let variants = [
      [
        { "stopName" : "Flinders Street Railway Station", "stopGTFSID" : "19854" },
        { "stopName" : "Southern Cross Railway Station", "stopGTFSID" : "22180" },
        { "stopName" : "North Melbourne Railway Station", "stopGTFSID" : "19973" },
        { "stopName" : "Macaulay Railway Station", "stopGTFSID" : "19972" },
      ], [
        { "stopName" : "Flinders Street Railway Station", "stopGTFSID" : "19854" },
        { "stopName" : "Parliament Railway Station", "stopGTFSID" : "19843" },
        { "stopName" : "Melbourne Central Railway Station", "stopGTFSID" : "19842" },
        { "stopName" : "Flagstaff Railway Station", "stopGTFSID" : "19841" },
        { "stopName" : "North Melbourne Railway Station", "stopGTFSID" : "19973" },
        { "stopName" : "Macaulay Railway Station", "stopGTFSID" : "19972" },
      ]
    ]

    expect(merge(variants)).to.deep.equal([
      { "stopName" : "Flinders Street Railway Station", "stopGTFSID" : "19854" },
      { "stopName" : "Parliament Railway Station", "stopGTFSID" : "19843" },
      { "stopName" : "Melbourne Central Railway Station", "stopGTFSID" : "19842" },
      { "stopName" : "Flagstaff Railway Station", "stopGTFSID" : "19841" },
      { "stopName" : "Southern Cross Railway Station", "stopGTFSID" : "22180" },
      { "stopName" : "North Melbourne Railway Station", "stopGTFSID" : "19973" },
      { "stopName" : "Macaulay Railway Station", "stopGTFSID" : "19972" },
    ])
  })
})