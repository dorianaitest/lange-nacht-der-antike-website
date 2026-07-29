export function normalizeAnswer(str) {
  const noPunctuation = str.replace(/\p{P}/gu, '')
  const collapsed = noPunctuation.replace(/\s+/g, ' ')
  return collapsed.trim().toLowerCase()
}
