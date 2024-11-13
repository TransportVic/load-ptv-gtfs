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

  static canProcess(routeGTFSID, mode) {
    return true 
  }

  static create(data, mode) {
    let { routeGTFSID } = data
    let routeTypes = [ MetroGTFSRoute, SmartrakGTFSRoute, GTFSRoute ]
    for (let type of routeTypes) {
      if (type.canProcess(routeGTFSID, mode)) return new type(data)
    }
  }
}

class SmartrakGTFSRoute extends GTFSRoute {

  parseRouteID(routeGTFSID) {
    let [ _, routeNumber ] = routeGTFSID.match(/^\d+\-(\w+)/)
    return `4-${routeNumber}`
  }  

  static canProcess(routeGTFSID, mode) {
    return routeGTFSID.includes('-aus-')
  }

}

class MetroGTFSRoute extends GTFSRoute {

  static canProcess(routeGTFSID, mode) {
    return mode === 'metro train'
  }

}