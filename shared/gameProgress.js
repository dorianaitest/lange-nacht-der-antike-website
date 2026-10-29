/**
 * Saves a started game in localStorage so the viewer can continue it after a reload.
 * Every storage access is wrapped in try/catch: without storage the game just runs unsaved.
 *
 * Saved progress shape:
 * {
 *   startedAt: number,                          // ms timestamp of "Spiel starten"
 *   finishedAt: number|null,                    // ms timestamp of the last solved riddle
 *   penaltyEndsAt: number|null,                 // ms timestamp the final-riddle penalty ends
 *   completedRiddles: {riddleId: true},
 *   assignedSymbols: {riddleId: poolIndex},     // indices into symbolPool, not object urls
 *   symbolSelectionPassed: {riddleId: true},
 * }
 */

const STORAGE_KEY = 'antike-game-progress'
const FORMAT_VERSION = 1
const MAX_AGE_MS = 12 * 60 * 60 * 1000

/**
 * Saves the progress together with the config it belongs to.
 * @param {Object} config - the riddle-config.json shape the game runs on.
 * @param {Object} progress - progress in the shape described above.
 */
export function saveProgress(config, progress) {
  const saved = { version: FORMAT_VERSION, configJson: JSON.stringify(config), ...progress }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
  } catch {
    // storage missing, blocked or full: the game continues unsaved
  }
}

/** Removes any saved progress. */
export function clearProgress() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // nothing to clear without storage
  }
}

/**
 * Loads the saved progress for this config and clears it when it is unusable.
 * @param {Object} config - the riddle-config.json shape the game runs on.
 * @param {number} now - current ms timestamp.
 * @returns {Object|null} progress in the shape described above, or null for a fresh game.
 */
export function loadProgress(config, now) {
  const saved = readSaved()
  if (saved === null) return null

  if (!isUsable(saved, config, now)) {
    clearProgress()
    return null
  }

  return {
    startedAt: saved.startedAt,
    finishedAt: saved.finishedAt,
    penaltyEndsAt: saved.penaltyEndsAt,
    completedRiddles: saved.completedRiddles,
    assignedSymbols: saved.assignedSymbols,
    symbolSelectionPassed: saved.symbolSelectionPassed,
  }
}

/**
 * Reads and parses the stored entry.
 * @returns {*} parsed entry, `undefined` for corrupt JSON, or null when nothing is stored.
 */
function readSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return null
    return JSON.parse(raw)
  } catch {
    return undefined
  }
}

/**
 * Checks that a stored entry has the current format, belongs to this config and has not expired.
 * @param {*} saved - parsed stored entry.
 * @param {Object} config - the riddle-config.json shape the game runs on.
 * @param {number} now - current ms timestamp.
 * @returns {boolean} True if the entry can be restored.
 */
function isUsable(saved, config, now) {
  if (!isPlainObject(saved)) return false
  if (saved.version !== FORMAT_VERSION) return false
  if (saved.configJson !== JSON.stringify(config)) return false
  if (!hasValidShape(saved)) return false
  return now - saved.startedAt <= MAX_AGE_MS
}

/**
 * Checks the types of every progress field.
 * @param {Object} saved - parsed stored entry.
 * @returns {boolean} True if every field has the expected type.
 */
function hasValidShape(saved) {
  if (!Number.isFinite(saved.startedAt)) return false
  if (!isTimestampOrNull(saved.finishedAt)) return false
  if (!isTimestampOrNull(saved.penaltyEndsAt)) return false
  if (!isMapOf(saved.completedRiddles, (value) => value === true)) return false
  if (!isMapOf(saved.assignedSymbols, Number.isInteger)) return false
  return isMapOf(saved.symbolSelectionPassed, (value) => value === true)
}

/**
 * @param {*} value - value to check.
 * @returns {boolean} True if value is a finite number or null.
 */
function isTimestampOrNull(value) {
  return value === null || Number.isFinite(value)
}

/**
 * @param {*} value - value to check.
 * @returns {boolean} True if value is a non-null, non-array object.
 */
function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * @param {*} value - value to check.
 * @param {function(*): boolean} isValidEntry - check for each map value.
 * @returns {boolean} True if value is an object whose values all pass isValidEntry.
 */
function isMapOf(value, isValidEntry) {
  return isPlainObject(value) && Object.values(value).every(isValidEntry)
}
