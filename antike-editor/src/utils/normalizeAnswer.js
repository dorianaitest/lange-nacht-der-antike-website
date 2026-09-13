/**
 * Normalises answer for comparison. strips punctuation
 * removes unnecessary spaces, trims, and lowercases.
 * @param {string} str - answer string.
 * @returns {string} normalised answer.
 */
export function normalizeAnswer(str) {
  const noPunctuation = str.replace(/\p{P}/gu, '')
  const collapsed = noPunctuation.replace(/\s+/g, ' ')
  return collapsed.trim().toLowerCase()
}
