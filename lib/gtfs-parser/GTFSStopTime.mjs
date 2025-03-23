import { hhmmToMinutesPastMidnight, minutesPastMidnightToHHMMWrap } from '../utils.mjs'

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
    this.arrivalTimeMinutes = hhmmToMinutesPastMidnight(arrivalTime)
    this.departureTimeMinutes = hhmmToMinutesPastMidnight(departureTime)

    this.arrivalTime = minutesPastMidnightToHHMMWrap(this.arrivalTimeMinutes)
    this.departureTime = minutesPastMidnightToHHMMWrap(this.departureTimeMinutes)

    this.stopID = stopID
    this.stopSequence = stopSequence
    this.pickup = parseInt(pickup)
    this.dropoff = parseInt(dropoff)
    this.distanceTravelled = distance
  }

}