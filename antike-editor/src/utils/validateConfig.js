export function validateConfig(
  elementsData,
  mode,
  abschlussRaetselId,
  symbolPool,
) {
  const errors = []
  const warnings = []

  let hasStartRaetsel = false
  let raetselCount = 0
  const incompleteIds = []
  const noAnswerIds = []
  const unlinkedDecoIds = []
  for (const id in elementsData) {
    const entry = elementsData[id]
    if (entry.elementArt === 'Rätsel') {
      raetselCount++
      if (entry.riddle.unlockAfterIds.length === 0) {
        hasStartRaetsel = true
      }
      let hasAnswer = false
      for (const answer of entry.riddle.answers) {
        if (answer.trim()) {
          hasAnswer = true
          break
        }
      }
      if (!hasAnswer) {
        noAnswerIds.push(id)
      }
      if (!entry.riddle.question || !entry.riddle.successText) {
        incompleteIds.push(id)
      }
    } else if (entry.elementArt === 'dynamische Dekoration' && entry.deco.linkedElements.length === 0) {
      unlinkedDecoIds.push(id)
    }
  }

  if (incompleteIds.length > 0) {
    warnings.push(
      incompleteIds.length +
        ' Rätsel haben leere Felder (Frage oder Erfolgstext): ' +
        incompleteIds.join(', ') +
        '.',
    )
  }

  if (noAnswerIds.length > 0) {
    errors.push(
      noAnswerIds.length +
        ' Rätsel haben keine gültige Antwort: ' +
        noAnswerIds.join(', ') +
        '.',
    )
  }

  if (unlinkedDecoIds.length > 0) {
    warnings.push(
      unlinkedDecoIds.length +
        ' dynamische Dekoration(en) haben kein verknüpftes Rätsel: ' +
        unlinkedDecoIds.join(', ') +
        '.',
    )
  }

  if (!hasStartRaetsel) {
    errors.push(
      'Es gibt kein Start-Rätsel. Mindestens ein Rätsel muss als Start konfiguriert sein.',
    )
  }

  if (mode === 'Symbolraetsel' && !abschlussRaetselId) {
    errors.push('Es wurde kein Abschluss-Rätsel festgelegt.')
  }

  if (mode === 'Symbolraetsel' && symbolPool.length !== raetselCount) {
    errors.push(
      'Die Symbolanzahl muss genau der Rätselanzahl entsprechen (Momentan: ' +
        symbolPool.length +
        ' Symbole, ' +
        raetselCount +
        ' Rätsel).',
    )
  }

  return { errors, warnings }
}
