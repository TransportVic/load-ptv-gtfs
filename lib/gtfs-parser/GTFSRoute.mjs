export default class GTFSRoute {

  routeGTFSID
  agencyID
  operator
  routeNumber
  routeName

  constructor({ routeGTFSID, agencyID, routeNumber, routeName }) {
    this.routeGTFSID = this.parseRouteID(routeGTFSID)
    this.agencyID = agencyID
    this.routeNumber = routeNumber
    this.routeName = routeName
  }

  parseRouteID(routeGTFSID) {
    let [ _, mode, id ] = routeGTFSID.match(/^(\d+)\-(\w+)/)

    return `${mode}-${`000${id}`.slice(-3)}`
  }

  static canProcess(routeGTFSID) {
    return true 
  }

  static create(data) {
    let { routeGTFSID } = data
    let routeTypes = [ SmartrakGTFSRoute, GTFSRoute ]
    for (let type of routeTypes) {
      if (type.canProcess(routeGTFSID)) return new type(data)
    }
  }
}

class SmartrakGTFSRoute extends GTFSRoute {

  parseRouteID(routeGTFSID) {
    let [ _, routeNumber ] = routeGTFSID.match(/^\d+\-(\w+)/)
    return `4-${routeNumber}`
  }  

  static canProcess(routeGTFSID) {
    return routeGTFSID.includes('-aus-')
  }

}