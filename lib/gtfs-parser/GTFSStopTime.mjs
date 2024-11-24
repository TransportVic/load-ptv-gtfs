export class GTFSStopTime {
 
  arrivalTime
  departureTime
  stopID
  stopSequence
  pickup
  dropoff
  distanceTravelled
  
  constructor({ arrivalTime, departureTime, stopID, stopSequence, pickup, dropoff, distance }) {
    this.arrivalTime = arrivalTime
    this.departureTime = departureTime
    this.stopID = stopID
    this.stopSequence = stopSequence
    this.pickup = parseInt(pickup)
    this.dropoff = parseInt(dropoff)
    this.distanceTravelled = distance
  }

}