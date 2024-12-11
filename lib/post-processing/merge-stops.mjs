import { hash } from 'node:crypto'

function tripHash(trip) {
  return parseInt(hash('md5', trip.map(stop => stop.stopGTFSID).join('-')), 16)
}

function isLoop(trip) {
  return trip[0].stopName === trip[trip.length - 1].stopName
}

/**
 * Merges different stopping patterns together to determine the overall stops for a route.
 *
 * @param {Object[][]} inputVariants A list of different stopping patterns being merged together
 */
export default function merge(inputVariants) {
  let loopVariants = [], nonLoopVariants = []
  
  inputVariants.toSorted((a, b) => {
    return b.length - a.length || tripHash(a) - tripHash(b)
  }).forEach(trip => {
    if (trip.length === 1) return
    if (isLoop(trip)) loopVariants.push(trip)
    else nonLoopVariants.push(trip)
  })

  let variants = loopVariants.concat(nonLoopVariants)
  let stopsList = variants[0]

  for (let variant of variants.slice(1)) {
    let branch = []
    let lastMainMatch = 0
    let isLoopVariant = isLoop(variant)

    let stopIndex = -1

    for (let variantStop of variant) {
      stopIndex++

      let matchIndex = lastMainMatch - 1

      let hasMatched = false
      for (let stop of stopsList.slice(lastMainMatch)) {
        matchIndex++

        hasMatched = stop.stopName === variantStop.stopName
        if (hasMatched) {
          if (branch.length > 0) { // lines are out of sync, but match detected = rejoining
            let firstHalf = stopsList.slice(0, matchIndex)
            let backHalf = stopsList.slice(matchIndex)

            stopsList = firstHalf.concat(branch).concat(backHalf)
            branch = []
          } else { // otherwise we're on sync, all good
            if (matchIndex < lastMainMatch) {
              let jumpPart = variant.slice(matchIndex, lastMainMatch + 1)
              let subBranch = []
              for (let jumpStop of jumpPart) {
                if (matched(jumpStop, variantStop)) break
                subBranch.push(jumpStop)
              }
              branch = branch.concat(subBranch)
            }
            lastMainMatch = matchIndex
          }
          break
        }
      }

      // no match, we're on a branch
      if (!hasMatched) branch.push(variantStop)
    }

    if (branch.length) { // we're still on a branch after completing the stops, means they have different destiantions
      // look at where they deviated, and join it in between

      let firstHalf = stopsList.slice(0, lastMainMatch + 1)
      let backHalf = stopsList.slice(lastMainMatch + 1)

      stopsList = firstHalf.concat(branch).concat(backHalf)
    }
  }

  return stopsList
}