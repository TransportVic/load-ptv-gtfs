import async from 'async'

export default async function setStopServices(database) {
  let gtfsTimetables = database.getCollection('gtfs timetables')
  let stops = database.getCollection('stops')

  let stopIDs = await stops.distinct('_id')

  await async.forEachOfLimit(stopIDs, 100, async (id, index) => {
    let stop = await stops.findDocument({ _id: id })

    for (let bay of stop.bays) {
      let matchingTimetables = (await gtfsTimetables.findDocuments({
        mode: bay.mode,
        'stopTimings.stopGTFSID': bay.stopGTFSID
      }).toArray()).map(trip => ({
        id: {
          routeGTFSID: trip.routeGTFSID,
          gtfsDirection: trip.gtfsDirection,
          routeNumber: trip.routeNumber
        },
        pickup: trip.stopTimings.find(stop => stop.stopGTFSID === bay.stopGTFSID).stopConditions.pickup
      })).map(trip => {
        trip.fullID = `${trip.id.routeGTFSID}-${trip.id.gtfsDirection}-${trip.id.routeNumber}-${trip.pickup}`
        trip.partialID = `${trip.id.routeGTFSID}-${trip.id.gtfsDirection}-${trip.id.routeNumber}`
        
        return trip
      })

      let ids = new Set()
      let uniqueServices = matchingTimetables.filter(trip => {
        if (ids.has(trip.fullID)) return false

        ids.add(trip.fullID)
        return true
      }).sort((a, b) => a.id.routeGTFSID.localeCompare(b.id.routeGTFSID) || a.id.gtfsDirection - b.id.gtfsDirection)

      let partialIDs = new Set()
      bay.services = uniqueServices.filter(trip => {
        if (partialIDs.has(trip.partialID)) return false

        partialIDs.add(trip.partialID)
        return true
      }).map(service => service.id)
      bay.screenServices = uniqueServices.filter(service => service.pickup !== 1).map(service => service.id)
    }

    await stops.updateDocument({ _id: id }, {
      $set: {
        bays: stop.bays
      }
    })
  })
}