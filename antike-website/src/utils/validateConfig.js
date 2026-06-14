export function validateConfig(elementsData, mode, abschlussRaetselId, symbolPool) {
  const errors = []

  let hasStartRaetsel = false
  let raetselCount = 0
  for (const id in elementsData) {
    const entry = elementsData[id]
    if (entry.elementArt === 'Rätsel') {
      raetselCount++
      if (!entry.riddle.unlockAfterId) {
        hasStartRaetsel = true
      }
    }
  }

  if (!hasStartRaetsel) {
    errors.push(
      'Es gibt kein Start-Rätsel. Mindestens ein Rätsel muss als Start konfiguriert sein.',
    )
  }

  if (mode === 'Spezial' && !abschlussRaetselId) {
    errors.push('Es wurde kein Abschluss-Rätsel festgelegt.')
  }

  if (mode === 'Spezial' && symbolPool.length !== raetselCount) {
    errors.push(
      'Die Symbolanzahl muss genau der Rätselanzahl entsprechen (Momentan:' +
        symbolPool.length +
        ' Symbole, ' +
        raetselCount +
        ' Rätsel).',
    )
  }

  return errors
}
