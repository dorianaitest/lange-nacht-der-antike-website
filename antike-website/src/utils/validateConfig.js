export function validateConfig(elementsData, mode) {
  const errors = []

  let hasStartRaetsel = false
  for (const id in elementsData) {
    const entry = elementsData[id]
    if (entry.elementArt === 'Rätsel' && !entry.riddle.unlockAfterId) {
      hasStartRaetsel = true
      break
    }
  }

  if (!hasStartRaetsel) {
    errors.push(
      'Es gibt kein Start-Rätsel. Mindestens ein Rätsel muss als Start konfiguriert sein.',
    )
  }

  return errors
}
