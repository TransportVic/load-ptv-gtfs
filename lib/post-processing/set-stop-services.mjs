import async from 'async'

const AGGREGATION_GROUP = {
  $group: {
    _id: {
      routeGTFSID: "$routeGTFSID",
      gtfsDirection: "$gtfsDirection",
      routeNumber: "$routeNumber"
    }
  }
}

function compareService(a, b) {
  return a.routeGTFSID.localeCompare(b.routeGTFSID) || a.gtfsDirection - b.gtfsDirection
}

export default async function setStopServices(database, onMilestone = () => {}) {
  let gtfsTimetables = database.getCollection('gtfs timetables')
  let stops = database.getCollection('stops')

  let stopIDs = await stops.distinct('_id')

  let total = stopIDs.length

  let count = 0
  await async.forEachLimit(stopIDs, 100, async id => {
    let stop = await stops.findDocument({ _id: id })

    await async.forEach(stop.bays, async bay => {
      let screenServices = await gtfsTimetables.aggregate([
        {
          $match: {
            mode: bay.mode,
            stopTimings: {
              $elemMatch: { stopGTFSID: bay.stopGTFSID, 'stopConditions.pickup': 0 }
            }
          }
        },
        AGGREGATION_GROUP
      ]).toArray()

      let services = await gtfsTimetables.aggregate([
        {
          $match: {
            mode: bay.mode,
            'stopTimings.stopGTFSID': bay.stopGTFSID
          }
        },
        AGGREGATION_GROUP
      ]).toArray()

      bay.services = services.map(e => e._id).sort(compareService)
      bay.screenServices = screenServices.map(e => e._id).sort(compareService)
    })

    await stops.updateDocument({ _id: id }, {
      $set: {
        bays: stop.bays
      }
    })

    if (++count % 500 === 0) onMilestone(count, total)
  })
}