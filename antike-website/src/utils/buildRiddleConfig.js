export function buildRiddleConfig(elementsData, completionMessage) {
  const entries = Object.entries(elementsData)
  const nodes = {}

  const isOrdered = true

  for (const [id, entry] of entries) {
    if (entry.elementArt === 'Rätsel') {
      const riddle = {
        question: entry.riddle.question,
        answer: entry.riddle.answer,
        successText: entry.riddle.successText,
      }

      if (entry.riddle.iconFile) {
        riddle.icon = entry.riddle.iconFile.name
      }

      nodes[id] = {
        type: 'rätsel',
        unlockAfterId: entry.riddle.unlockAfterId,
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

  return {
    svgFile: 'background.svg',
    ordering: isOrdered ? 'ordered' : 'unordered',
    completionMessage,
    nodes,
  }
}
