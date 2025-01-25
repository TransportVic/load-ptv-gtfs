import RouteLoader from './lib/loader/RouteLoader.mjs'
import ShapeLoader from './lib/loader/ShapeLoader.mjs'
import StopsLoader from './lib/loader/StopsLoader.mjs'
import TripLoader from './lib/loader/TripLoader.mjs'

import GTFSAgency from './lib/gtfs-parser/GTFSAgency.mjs'
import GTFSCalendar from './lib/gtfs-parser/GTFSCalendar.mjs'
import GTFSCalendarDate from './lib/gtfs-parser/GTFSCalendarDate.mjs'
import GTFSRoute from './lib/gtfs-parser/GTFSRoute.mjs'
import { GTFSShape, GTFSShapePoint } from './lib/gtfs-parser/GTFSShape.mjs'
import { GTFSStop, GTFSPlatformStop } from './lib/gtfs-parser/GTFSStop.mjs'
import { GTFSStopTime } from './lib/gtfs-parser/GTFSStopTime.mjs'
import GTFSTrip from './lib/gtfs-parser/GTFSTrip.mjs'

import setRouteStops from './lib/post-processing/set-route-stops.mjs'
import setStopServices from './lib/post-processing/set-stop-services.mjs'

import GTFSAgencyReader from './lib/gtfs-parser/readers/GTFSAgencyReader.mjs'
import GTFSCalendarDateReader from './lib/gtfs-parser/readers/GTFSCalendarDatesReader.mjs'
import GTFSCalendarReader from './lib/gtfs-parser/readers/GTFSCalendarReader.mjs'
import GTFSRouteReader from './lib/gtfs-parser/readers/GTFSRouteReader.mjs'
import GTFSShapeReader from './lib/gtfs-parser/readers/GTFSShapeReader.mjs'
import GTFSStopsReader from './lib/gtfs-parser/readers/GTFSStopsReader.mjs'
import GTFSStopTimesReader from './lib/gtfs-parser/readers/GTFSStopTimesReader.mjs'
import GTFSTripReader from './lib/gtfs-parser/readers/GTFSTripReader.mjs'

const GTFSTypes = {
  GTFSAgency, GTFSCalendar, GTFSCalendarDate,
  GTFSRoute, GTFSShape, GTFSShapePoint,
  GTFSStop, GTFSPlatformStop,
  GTFSStopTime, GTFSTrip
}

const GTFSReaders = {
  GTFSAgencyReader, GTFSCalendarDateReader, GTFSCalendarReader,
  GTFSRouteReader, GTFSShapeReader, GTFSStopsReader, 
  GTFSStopTimesReader, GTFSTripReader
}

export {
  RouteLoader, ShapeLoader,
  StopsLoader, TripLoader,
  GTFSTypes, GTFSReaders,
  setRouteStops, setStopServices
}