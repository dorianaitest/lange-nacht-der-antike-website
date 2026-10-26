/**
 * Framework-free game rules shared by the editor preview and the viewer.
 * Every function works on the riddle-config.json shape (`config.nodes`, `config.finalRiddleId`, ...)
 * and a `completedRiddles` map of riddle id to `true`.
 */

const NODE_STATES = ['locked', 'accessible', 'completed']

/**
 * Normalizes a submitted answer for comparison.
 * strips punctuation, collapses whitespace, and lowercases.
 * @param {string} str - answer text.
 * @returns {string} normalized answer.
 */
export function normalizeAnswer(str) {
  const noPunctuation = str.replace(/\p{P}/gu, '')
  const collapsed = noPunctuation.replace(/\s+/g, ' ')
  return collapsed.trim().toLowerCase()
}

/**
 * Checks a submitted answer against a riddle's accepted answers, ignoring case/punctuation/extra whitespace.
 * @param {Object} riddle - Riddle data with an answers array.
 * @param {string} input - submitted answer text.
 * @returns {boolean} True if input matches any accepted answer.
 */
export function isAnswerCorrect(riddle, input) {
  const normalizedInput = normalizeAnswer(input)

  for (const answer of riddle.answers) {
    if (normalizeAnswer(answer) === normalizedInput) return true
  }
  return false
}

/**
 * Determines if a node is currently unlocked and not completed.
 * The final riddle unlocks only once every other riddle is done, any other
 * riddle unlocks when it has no prerequisites or any one of them is completed.
 * @param {string} id - the riddle id to check
 * @param {Object} config - the full riddle config
 * @param {Object} completedRiddles - map of riddle id to completion status
 * @returns {boolean} True if riddle is unlocked and not completed
 */
export function isAccessible(id, config, completedRiddles) {
  if (completedRiddles[id] === true) return false

  const element = config.nodes[id]
  if (!element) return false
  if (element.type !== 'riddle') return false

  if (config.ordering === 'unordered') {
    return true
  }

  if (config.finalRiddleId && id === config.finalRiddleId) {
    return isFinalRiddleFullyUnlocked(id, config, completedRiddles)
  }

  if (!element.unlockAfterIds || element.unlockAfterIds.length === 0) {
    return true
  }

  for (const parentId of element.unlockAfterIds) {
    if (completedRiddles[parentId] === true) return true
  }
  return false
}

/**
 * Checks if every other riddle has been completed, the unlock condition
 * for the final riddle.
 * @param {string} id - final riddle's id
 * @param {Object} config - The full riddle config
 * @param {Object} completedRiddles - map of riddle id to completed status
 * @returns {boolean} True if all other riddles are completed.
 */
export function isFinalRiddleFullyUnlocked(id, config, completedRiddles) {
  for (const [nodeId, node] of Object.entries(config.nodes)) {
    if (nodeId !== id && node.type === 'riddle' && completedRiddles[nodeId] !== true) {
      return false
    }
  }
  return true
}

/**
 * Returns a riddle's current visual state.
 * @param {string} id - riddle node id.
 * @param {Object} config - the full riddle config
 * @param {Object} completedRiddles - map of riddle id to completion status
 * @returns {'locked'|'accessible'|'completed'} the riddle's state.
 */
export function getRiddleState(id, config, completedRiddles) {
  if (completedRiddles[id] === true) return 'completed'
  if (isAccessible(id, config, completedRiddles)) return 'accessible'
  return 'locked'
}

/**
 * Returns a decoration's state: the most advanced state among its linked riddles,
 * 'locked' when it has none.
 * @param {Object} decoration - decoration node config.
 * @param {Object} config - the full riddle config
 * @param {Object} completedRiddles - map of riddle id to completion status
 * @returns {'locked'|'accessible'|'completed'} the decoration's state.
 */
export function getDecorationState(decoration, config, completedRiddles) {
  let maxLevel = 0
  for (const linkedId of decoration.linkedElements || []) {
    const level = NODE_STATES.indexOf(getRiddleState(linkedId, config, completedRiddles))
    if (level > maxLevel) maxLevel = level
  }
  return NODE_STATES[maxLevel]
}

/**
 * Formats a duration in seconds as MM:SS.
 * @param {number} totalSeconds - Duration in seconds.
 * @returns {string} Formatted time string.
 */
export function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
  const seconds = (totalSeconds % 60).toString().padStart(2, '0')
  return minutes + ':' + seconds
}

/**
 * Builds a shuffled list of all assigned symbols for the final riddle's picker.
 * @param {Object<string, string>} assignedSymbols - map of riddle id to symbol preview url.
 * @returns {Array<{riddleId: string, preview: string}>} Shuffled entries.
 */
export function buildShuffledSymbolEntries(assignedSymbols) {
  const entries = []
  for (const riddleId in assignedSymbols) {
    entries.push({ riddleId: riddleId, preview: assignedSymbols[riddleId] })
  }

  for (let i = entries.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = entries[i]
    entries[i] = entries[j]
    entries[j] = temp
  }

  return entries
}

/**
 * Draws a random unused pool symbol and marks it as used.
 * @param {Array<{preview: string}>} symbolPool - all pool symbols.
 * @param {Object<number, boolean>} usedSymbolIndices - pool indices already drawn, updated in place.
 * @returns {string|null} preview url of the drawn symbol, or null if the pool is used up.
 */
export function drawRandomSymbol(symbolPool, usedSymbolIndices) {
  const available = []
  for (let i = 0; i < symbolPool.length; i++) {
    if (!usedSymbolIndices[i]) {
      available.push(i)
    }
  }
  if (available.length === 0) return null

  const pick = available[Math.floor(Math.random() * available.length)]
  usedSymbolIndices[pick] = true
  return symbolPool[pick].preview
}

/**
 * Takes the first unused pool symbol and marks it as used, for the final riddle's own symbol.
 * @param {Array<{preview: string}>} symbolPool - all pool symbols.
 * @param {Object<number, boolean>} usedSymbolIndices - pool indices already drawn, updated in place.
 * @returns {string|null} preview url of the symbol, or null if the pool is used up.
 */
export function drawFinalRiddleSymbol(symbolPool, usedSymbolIndices) {
  for (let i = 0; i < symbolPool.length; i++) {
    if (!usedSymbolIndices[i]) {
      usedSymbolIndices[i] = true
      return symbolPool[i].preview
    }
  }
  return null
}
