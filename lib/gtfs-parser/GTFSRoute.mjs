export default class GTFSRoute {

  routeGTFSID
  agencyID
  operator
  routeNumber
  routeName

  constructor({ routeGTFSID, agencyID, routeNumber, routeName }) {
    this.routeGTFSID = routeGTFSID
    this.agencyID = agencyID
    this.routeNumber = routeNumber
    this.routeName = routeName
  }

}