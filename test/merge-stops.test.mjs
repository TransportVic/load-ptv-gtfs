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

  it('Should handle a branch that is also an alternate destination (681)', () => {
    let commonStops = [
      { "stopName" : "Knox City Shopping Centre/Burwood Highway", "stopGTFSID" : "19629" },
      { "stopName" : "Burwood Highway/Stud Road", "stopGTFSID" : "15219" },
      { "stopName" : "Swinburne TAFE - Wantirna/Stud Road", "stopGTFSID" : "14191" },
      { "stopName" : "High Street Road/Stud Road", "stopGTFSID" : "14190" },
      { "stopName" : "Harcrest Boulevard/Stud Road", "stopGTFSID" : "14189" },
      { "stopName" : "Mockridge Street/Stud Road", "stopGTFSID" : "14188" },
      { "stopName" : "Armin Street/Stud Road", "stopGTFSID" : "14187" },
      { "stopName" : "Evans Street/Stud Road", "stopGTFSID" : "14186" },
      { "stopName" : "Glenifer Avenue/Stud Road", "stopGTFSID" : "14184" },
      { "stopName" : "Scoresby Village Shopping Centre/Stud Road", "stopGTFSID" : "14183" },
      { "stopName" : "Ferntree Gully Road/Stud Road", "stopGTFSID" : "14182" },
      { "stopName" : "Centre Road/Stud Road", "stopGTFSID" : "14181" },
      { "stopName" : "Kingsley Close/Stud Road", "stopGTFSID" : "14180" },
      { "stopName" : "Kelletts Road/Stud Road", "stopGTFSID" : "14179" },
      { "stopName" : "Lakeside Boulevard/Stud Road", "stopGTFSID" : "14178" },
      { "stopName" : "Stud Park Shopping Centre", "stopGTFSID" : "21314" },
      { "stopName" : "Rowville Community Centre/Fulham Road", "stopGTFSID" : "13339" },
      { "stopName" : "Erie Avenue/Bridgewater Way", "stopGTFSID" : "13346" },
      { "stopName" : "Kelletts Road/Taylors Lane", "stopGTFSID" : "15227" },
      { "stopName" : "Valleyview Drive/Karoo Road", "stopGTFSID" : "15242" },
      { "stopName" : "Oakdene Court/Landsborough Avenue", "stopGTFSID" : "15243" },
      { "stopName" : "Kellbourne Drive/Landsborough Avenue", "stopGTFSID" : "15244" },
      { "stopName" : "Karoo Primary School/Karoo Road", "stopGTFSID" : "15245" },
      { "stopName" : "Camley Court/Karoo Road", "stopGTFSID" : "15246" },
      { "stopName" : "Sovereign Manors Crescent/Karoo Road", "stopGTFSID" : "15247" },
      { "stopName" : "Langhorne Crescent/Victoria Knox Avenue", "stopGTFSID" : "15248" },
      { "stopName" : "Sovereign Crest Boulevard/Victoria Knox Avenue", "stopGTFSID" : "15249" },
      { "stopName" : "Greenhaven Court/Sovereign Crest Boulevard", "stopGTFSID" : "15250" },
      { "stopName" : "Lakesfield Drive/Napoleon Road", "stopGTFSID" : "15251" },
      { "stopName" : "Lakesfield Drive/Kelletts Road", "stopGTFSID" : "15252" },
      { "stopName" : "Rosewood Boulevard/Heritage Way", "stopGTFSID" : "15202" },
      { "stopName" : "Windsor Drive/Heritage Way", "stopGTFSID" : "15201" },
      { "stopName" : "Windsor Drive/Rosewood Boulevard", "stopGTFSID" : "15200" },
      { "stopName" : "Heritage Way/Rosewood Boulevard", "stopGTFSID" : "15198" },
      { "stopName" : "Kelletts Road/Rosewood Boulevard", "stopGTFSID" : "15199" },
      { "stopName" : "Grenfell Place/Major Crescent", "stopGTFSID" : "15258" },
      { "stopName" : "Malata Way/Major Crescent", "stopGTFSID" : "15259" },
      { "stopName" : "Regency Terrace/Major Crescent", "stopGTFSID" : "15260" },
      { "stopName" : "Major Crescent/Sullivan Avenue", "stopGTFSID" : "15261" },
      { "stopName" : "Barry Reserve/Anthony Drive", "stopGTFSID" : "15262" },
      { "stopName" : "Napoleon Road/Anthony Drive", "stopGTFSID" : "15263" },
      { "stopName" : "Gill Court/Napoleon Road", "stopGTFSID" : "15264" },
      { "stopName" : "Park Road/Napoleon Road", "stopGTFSID" : "15265" },
      { "stopName" : "Teofilo Drive/Napoleon Road", "stopGTFSID" : "15266" },
      { "stopName" : "Wetherby Court/Dandelion Drive", "stopGTFSID" : "15267" },
      { "stopName" : "Peregrine Reserve/Dandelion Drive", "stopGTFSID" : "15268" },
      { "stopName" : "Armstrong Drive/Dandelion Drive", "stopGTFSID" : "15269" },
      { "stopName" : "Wellington Village Shopping Centre/Braeburn Parade", "stopGTFSID" : "15271" },
      { "stopName" : "Ada Street/Braeburn Parade", "stopGTFSID" : "41177" },
      { "stopName" : "Dalmatia Court/Gearon Avenue", "stopGTFSID" : "15272" },
      { "stopName" : "Suzana Place/Pia Drive", "stopGTFSID" : "15273" },
      { "stopName" : "Pia Drive/Trisha Drive", "stopGTFSID" : "15275" },
      { "stopName" : "Koombahla Court/Liviana Drive", "stopGTFSID" : "23180" },
      { "stopName" : "Fowler Road/Shearer Drive", "stopGTFSID" : "23038" },
      { "stopName" : "Liberty Avenue/Shearer Drive", "stopGTFSID" : "15277" },
      { "stopName" : "Buckingham Drive/Liberty Avenue", "stopGTFSID" : "15278" },
      { "stopName" : "Liberty Avenue Reserve/Liberty Avenue", "stopGTFSID" : "15279" },
      { "stopName" : "Virgilia Court/Liberty Avenue", "stopGTFSID" : "23037" },
      { "stopName" : "Liberty Avenue/Clauscen Drive", "stopGTFSID" : "15281" },
      { "stopName" : "McKay Road/Taylors Lane", "stopGTFSID" : "15282" },
      { "stopName" : "Taylors Lane/Bernard Hamilton Way", "stopGTFSID" : "15283" },
      { "stopName" : "Turramurra Drive/Bridgewater Way", "stopGTFSID" : "15284" },
      { "stopName" : "Simon Avenue/Bridgewater Way", "stopGTFSID" : "15285" },
      { "stopName" : "Rowville Community Centre/Fulham Road", "stopGTFSID" : "15184" },
      { "stopName" : "Stud Park Shopping Centre", "stopGTFSID" : "21314" },
      { "stopName" : "Stud Park Shopping Centre/Stud Road", "stopGTFSID" : "15149" }
    ]

    let studKnox = [
      { "stopName" : "Lakeside Boulevard/Stud Road", "stopGTFSID" : "15150" },
      { "stopName" : "Kelletts Road/Stud Road - West", "stopGTFSID" : "15151" },
      { "stopName" : "Kingsley Close/Stud Road", "stopGTFSID" : "15152" },
      { "stopName" : "Centre Road/Stud Road", "stopGTFSID" : "15153" },
      { "stopName" : "Scoresby Village Shopping Centre/Stud Road", "stopGTFSID" : "15154" },
      { "stopName" : "The Close/Stud Road", "stopGTFSID" : "15155" },
      { "stopName" : "Sheppard Drive/Stud Road", "stopGTFSID" : "15156" },
      { "stopName" : "Evans Street/Stud Road", "stopGTFSID" : "15157" },
      { "stopName" : "George Street/Stud Road", "stopGTFSID" : "15158" },
      { "stopName" : "Mockridge Street/Stud Road", "stopGTFSID" : "15159" },
      { "stopName" : "Harcrest Boulevard/Stud Road", "stopGTFSID" : "15160" },
      { "stopName" : "High Street Road/Stud Road", "stopGTFSID" : "15161" },
      { "stopName" : "Swinburne TAFE - Wantirna/Stud Road", "stopGTFSID" : "15162" },
      { "stopName" : "Knox City Shopping Centre/Burwood Highway", "stopGTFSID" : "19629" }
    ]

    let studWav = [
      { "stopName" : "Turramurra Drive/Stud Road", "stopGTFSID" : "14176" },
      { "stopName" : "Stud Road/Wellington Road", "stopGTFSID" : "16505" },
      { "stopName" : "Viewtech Place/Wellington Road", "stopGTFSID" : "16506" },
      { "stopName" : "Jaydee Court/Wellington Road", "stopGTFSID" : "16507" },
      { "stopName" : "Eastlink/Wellington Road", "stopGTFSID" : "16508" },
      { "stopName" : "Haverbrack Drive/Wellington Road", "stopGTFSID" : "2351" },
      { "stopName" : "Wellington Road/Jacksons Road", "stopGTFSID" : "22714" },
      { "stopName" : "Stirling Theological College/Jacksons Road", "stopGTFSID" : "22715" },
      { "stopName" : "Carboni Court/Jacksons Road", "stopGTFSID" : "22716" },
      { "stopName" : "Gladeswood Drive/Jacksons Road", "stopGTFSID" : "21327" },
      { "stopName" : "Waverley Gardens Shopping Centre/Hansworth Street", "stopGTFSID" : "21310" }
    ]

    let variants = [
      [
        ...commonStops,
        ...studKnox
      ],
      [
        ...commonStops,
        ...studWav
      ]
    ]

    expect(merge(variants)).to.deep.equal(
      [
        ...commonStops,
        ...studWav,
        ...studKnox
      ]
    )
  })
})