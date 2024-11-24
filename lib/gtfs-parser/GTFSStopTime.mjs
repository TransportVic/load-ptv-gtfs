import { hhmmToMinutesPastMidnight } from '../utils.mjs'

export class GTFSStopTime {
 
  arrivalTime
  arrivalTimeMinutes
  departureTime
  departureTimeMinutes

  stopID
  stopSequence
  pickup
  dropoff
  distanceTravelled
  
  constructor({ arrivalTime, departureTime, stopID, stopSequence, pickup, dropoff, distance }) {
    this.arrivalTime = arrivalTime.slice(0, 5)
    this.departureTime = departureTime.slice(0, 5)

    this.arrivalTimeMinutes = hhmmToMinutesPastMidnight(this.arrivalTime)
    this.departureTimeMinutes = hhmmToMinutesPastMidnight(this.departureTime)

    this.stopID = stopID
    this.stopSequence = stopSequence
    this.pickup = parseInt(pickup)
    this.dropoff = parseInt(dropoff)
    this.distanceTravelled = distance
  }

}