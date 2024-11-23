import GTFSCalendar from './GTFSCalendar.mjs'

export default class GTFSTrip {
  
  routeGTFSID
  operationDays
  tripID
  shapeID
  headsign
  direction
  block

  /**
   * 
   * @param {Object} param0 The trip data
   * @param {string} param0.routeGTFSID The route ID associated with the trip. This should be the raw ID, eg "6-123-mjp-1"
   * @param {GTFSCalendar} param0.calendar The calendar type
   * @param {string} param0.id The unique trip ID
   * @param {string} param0.shapeID The shape ID associate with the trip
   * @param {string} param0.headsign The headsign on the vehicle serving the trip
   * @param {string} param0.direction The direction of the trip. "0" for outbound and "1" for inbound trips.
   * @param {string} param0.block The block ID of the trip.
   */
  constructor({ routeGTFSID, calendar, id, shapeID, headsign, direction, block }) {
    this.routeGTFSID = routeGTFSID
    this.operationDays = calendar.getOperationDays()
    this.tripID = id
    this.shapeID = shapeID
    this.headsign = headsign
    this.direction = direction
    this.block = block
  }

}