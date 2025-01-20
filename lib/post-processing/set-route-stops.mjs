import async from 'async'
import merge from './merge-stops.mjs'
import DatabaseConnection from '@transportme/database/lib/DatabaseConnection.mjs'
import { TRANSIT_MODES } from '../constants.mjs'

/**
 * Loads route stop data into the database. This is generated based off the timetable data.
 * 
 * @param {DatabaseConnection} database The database connection to use
 */
export default async function setRouteStops(database) {
  let gtfsTimetables = database.getCollection('gtfs timetables')
  let routes = database.getCollection('routes')

  let allRoutes = await routes.distinct('routeGTFSID')

  let stopsByService = {}

  await async.forEachLimit(allRoutes, 100, async routeGTFSID => {
    let routeData = await routes.findDocument({ routeGTFSID })
    let routeVariants = routeData.routePath.map(variant => ({ shapeID: variant.fullGTFSIDs[0], routeGTFSID }))
    let routeDirections = [[], []]

    for (let variant of routeVariants) {
      let timetable = await gtfsTimetables.findDocument(variant)
      if (!timetable) {
        console.log('No timetable match for shapeID', variant)
        continue
      }

      routeDirections[timetable.gtfsDirection].push(timetable.stopTimings.map(stop => ({
        stopName: stop.stopName,
        stopNumber: stop.stopNumber,
        suburb: stop.suburb,
        stopGTFSID: stop.stopGTFSID
      })))
    }

    for (let gtfsDirection = 0; gtfsDirection < routeDirections.length; gtfsDirection++) {
      let routeDirection = routeDirections[gtfsDirection]
      if (!routeDirection.length) continue

      let directionStops = merge(routeDirection, (a, b) => a.stopName === b.stopName)
      let mostCommonDestinations = (await gtfsTimetables.aggregate([
        { $match: { routeGTFSID, gtfsDirection } },
        { $sortByCount: '$destination' }
      ]).toArray()).map(e => e._id)

      let lastStop = directionStops[directionStops.length - 1]
      let lastStopName = lastStop.stopName

      let directionName = lastStopName
      if (directionName.includes('School') || directionName.includes('College')) {
        directionName = mostCommonDestinations[0]
      }

      if (!stopsByService[routeGTFSID]) stopsByService[routeGTFSID] = []
      stopsByService[routeGTFSID][gtfsDirection] = {
        directionName,
        gtfsDirection,
        stops: directionStops
      }

      if (routeData.mode === TRANSIT_MODES.metroTrain) {
        let currentDir = stopsByService[routeGTFSID][gtfsDirection].directionName
        if (currentDir.includes('Flinders Street') || currentDir.includes('Town Hall')) {
          stopsByService[routeGTFSID][gtfsDirection].directionName = 'City'
        } else {
          stopsByService[routeGTFSID][gtfsDirection].directionName = currentDir.slice(0, -16)
        }
      }
    }
  })

  let bulkOperations = []
  
  Object.keys(stopsByService).forEach(routeGTFSID => {
    bulkOperations.push({
      updateOne: {
        filter: { routeGTFSID },
        update: { $set: {
          directions: stopsByService[routeGTFSID].filter(Boolean) // Apparently some routes dont have GTFS Dir 0
        } }
      }
    })
  })

  await routes.bulkWrite(bulkOperations)
}