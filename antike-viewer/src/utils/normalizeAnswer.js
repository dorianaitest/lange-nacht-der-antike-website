/**
 * Normalizes a submitted answer for comparison. 
 * strips punctuation, collapses whitespace, and lowercases.
 * @param {string} answer text.
 * @returns {string} normalized answer.
 */
export function normalizeAnswer(str) {
  const noPunctuation = str.replace(/\p{P}/gu, '')
  const collapsed = noPunctuation.replace(/\s+/g, ' ')
  return collapsed.trim().toLowerCase()
}
