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

const GTFSTypes = {
  GTFSAgency, GTFSCalendar, GTFSCalendarDate,
  GTFSRoute, GTFSShape, GTFSShapePoint,
  GTFSStop, GTFSPlatformStop,
  GTFSStopTime, GTFSTrip
}

export {
  RouteLoader, ShapeLoader,
  StopsLoader, TripLoader,
  GTFSTypes,
  setRouteStops, setStopServices
}