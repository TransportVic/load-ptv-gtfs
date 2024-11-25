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

export default async function setStopServices(database) {
  let gtfsTimetables = database.getCollection('gtfs timetables')
  let stops = database.getCollection('stops')

  let stopIDs = await stops.distinct('_id')

  await async.forEachOfLimit(stopIDs, 100, async (id, index) => {
    let stop = await stops.findDocument({ _id: id })

    for (let bay of stop.bays) {
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
    }

    await stops.updateDocument({ _id: id }, {
      $set: {
        bays: stop.bays
      }
    })
  })
}