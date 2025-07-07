import async from 'async'
import merge from './merge-stops.mjs'
import DatabaseConnection from '@transportme/database/lib/DatabaseConnection.mjs'
import { TRANSIT_MODES } from '../constants.mjs'

/**
 * Loads route stop data into the database. This is generated based off the timetable data.
 * 
 * @param {DatabaseConnection} database The database connection to use
 * @param {Object} directionsMap Used to store PTV API direction data 
 * @param {function} onMilestone Called for every 25 routes processed
 * @param {Object} colls Used to specify the collection names to write into
 * @param {string} colls.routeColl The collection to store the routes in. Defaults to gtfs-routes
 * @param {string} colls.stopColl The collection to store the stops in. Defaults to gtfs-stops
 * @param {string} colls.timetableColl The collection to store the timetables in. Defaults to gtfs-gtfs timetables
 */
export default async function setRouteStops(database, directionsMap, onMilestone = () => {}, {
    routeColl = 'gtfs-routes',
    timetableColl = 'gtfs-gtfs timetables'
  } = {}) {
  let gtfsTimetables = database.getCollection(timetableColl)
  let routes = database.getCollection(routeColl)

  let allRoutes = await routes.distinct('routeGTFSID')

  let stopsByService = {}

  let count = 0
  let total = allRoutes.length

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
        let isUp = currentDir.includes('Flinders Street') || currentDir.includes('Town Hall')

        let directionName = stopsByService[routeGTFSID][gtfsDirection].directionName

        if (routeData.routeName === 'Stony Point') {
          isUp = currentDir.includes('Frankston')
          directionName = directionName.slice(0, -16)
        } else if (routeData.routeName === 'City Circle') {
          isUp = false
          let directionStops = stopsByService[routeGTFSID][gtfsDirection]
          let isClockwise = directionStops.stops[1].stopName === 'Southern Cross Railway Station'
          directionName = `City Circle (${isClockwise ? 'Clockwise' : 'Anti-Clockwise'})`
        } else {
          directionName = isUp ? 'City' :  routeData.routeName
        }

        stopsByService[routeGTFSID][gtfsDirection].directionName = directionName
        stopsByService[routeGTFSID][gtfsDirection].trainDirection = isUp ? 'Up' : 'Down'
      }
    }

    if (++count % 25 === 0) onMilestone(count, total)
  })

  let bulkOperations = []
  
  Object.keys(stopsByService).forEach(routeGTFSID => {
    bulkOperations.push({
      updateOne: {
        filter: { routeGTFSID },
        update: { $set: {
          directions: stopsByService[routeGTFSID].filter(Boolean), // Apparently some routes dont have GTFS Dir 0
          ptvDirections: directionsMap[routeGTFSID]
        } }
      }
    })
  })

  await routes.bulkWrite(bulkOperations)
}