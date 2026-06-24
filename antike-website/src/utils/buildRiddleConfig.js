export function buildRiddleConfig(elementsData, completionMessage, mode, symbolPool, abschlussRaetselId, abschlussRaetselPenalty) {
  const entries = Object.entries(elementsData)
  const nodes = {}

  for (const [id, entry] of entries) {
    if (entry.elementArt === 'Rätsel') {
      const riddle = {
        question: entry.riddle.question,
        answer: entry.riddle.answer,
        successText: entry.riddle.successText,
      }

      if (mode !== 'Spezial' && entry.riddle.iconFile) {
        riddle.icon = entry.riddle.iconFile.name
      }

      nodes[id] = {
        type: 'rätsel',
        unlockAfterId: entry.riddle.unlockAfterId,
        style: entry.riddle.style || { gesperrt: 'shrouded', zugaenglich: 'highlighted', geloest: 'none' },
        riddle,
      }
    } else if (entry.elementArt === 'Dekoration') {
      nodes[id] = {
        type: 'dekoration',
        linkedElement: entry.deco.linkedElement,
        stateBefore: entry.deco.stateBefore,
        stateAfter: entry.deco.stateAfter,
      }
    }
  }

  const config = {
    svgFile: 'background.svg',
    mode,
    completionMessage,
    nodes,
  }

  if (mode === 'Spezial') {
    const poolFileNames = []
    for (const symbol of symbolPool) {
      poolFileNames.push(symbol.file.name)
    }
    config.symbolPool = poolFileNames
    config.abschlussRaetselId = abschlussRaetselId || null
    config.abschlussRaetselPenalty = abschlussRaetselPenalty || 30
  }

  return config
}
