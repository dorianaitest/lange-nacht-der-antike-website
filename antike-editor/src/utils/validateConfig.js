/**
 * Checks the current editor state for errors and warnings,
 * and what those issues are.
 * @param {Object<string, Object>} elementsData - all elements
 * @param {string} mode - 'Standard' or 'SymbolRiddle'.
 * @param {string|null} finalRiddleId - The configured Abschluss-Rätsel
 * @param {Array} symbolPool - The list of symbols.
 * @param {{title: string, description: string}} startScreenData - Start screen title/description.
 * @param {string} completionMessage - The game completion message.
 * @param {{prompt: string, successText: string}} symbolPickerData - Abschluss-Rätsel texts.
 * @returns {{errors: string[], warnings: string[], hasStartRiddle: boolean,
 *   riddleCount: number, incompleteIds: string[], noAnswerIds: string[],
 *   unlinkedDecoIds: string[]}}
 */
export function validateConfig(
  elementsData,
  mode,
  finalRiddleId,
  symbolPool,
  startScreenData,
  completionMessage,
  symbolPickerData,
) {
  const errors = []
  const warnings = []

  let hasStartRiddle = false
  let riddleCount = 0
  const incompleteIds = []
  const noAnswerIds = []
  const unlinkedDecoIds = []
  for (const id in elementsData) {
    const entry = elementsData[id]
    if (entry.elementArt === 'Rätsel') {
      riddleCount++
      if (entry.riddle.unlockAfterIds.length === 0) {
        hasStartRiddle = true
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

  if (!hasStartRiddle) {
    errors.push(
      'Es gibt kein Start-Rätsel. Mindestens ein Rätsel muss als Start konfiguriert sein.',
    )
  }

  if (mode === 'SymbolRiddle' && !finalRiddleId) {
    errors.push('Es wurde kein Abschluss-Rätsel festgelegt.')
  }

  if (mode === 'SymbolRiddle' && symbolPool.length !== riddleCount) {
    errors.push(
      'Die Symbolanzahl muss genau der Rätselanzahl entsprechen (Momentan: ' +
        symbolPool.length +
        ' Symbole, ' +
        riddleCount +
        ' Rätsel).',
    )
  }

  if (!startScreenData.title || !startScreenData.description) {
    warnings.push('Der Startbildschirm ist nicht konfiguriert (Titel oder Beschreibung fehlt).')
  }

  if (!completionMessage) {
    warnings.push('Es wurde keine Abschlussnachricht konfiguriert.')
  }

  if (mode === 'SymbolRiddle' && (!symbolPickerData.prompt || !symbolPickerData.successText)) {
    warnings.push('Die Symbolauswahl-Texte sind nicht konfiguriert (Hinweistext oder Erfolgstext fehlt).')
  }

  return { errors, warnings, hasStartRiddle, riddleCount, incompleteIds, noAnswerIds, unlinkedDecoIds }
}
