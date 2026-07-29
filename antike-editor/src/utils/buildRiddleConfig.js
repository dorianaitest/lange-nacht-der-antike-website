export function buildRiddleConfig(elementsData, mode, symbolPool, finalRiddleId, finalRiddlePenalty, symbolPickerData, completionMessage, startScreenData, stylingConfig) {
  const entries = Object.entries(elementsData)
  const nodes = {}

  for (const [id, entry] of entries) {
    if (entry.elementArt === 'Rätsel') {
      const answers = []
      for (const answer of entry.riddle.answers) {
        const trimmed = answer.trim()
        if (trimmed) answers.push(trimmed)
      }

      const riddle = {
        question: entry.riddle.question,
        answers,
        successText: entry.riddle.successText,
      }

      if (mode !== 'SymbolRiddle' && entry.riddle.iconFile) {
        riddle.icon = entry.riddle.iconFile.name
      }

      nodes[id] = {
        type: 'riddle',
        unlockAfterIds: entry.riddle.unlockAfterIds,
        style: entry.riddle.style || { locked: 'shrouded', accessible: 'highlighted', completed: 'none' },
        riddle,
      }

      if (mode === 'SymbolRiddle' && id === finalRiddleId) {
        nodes[id].symbolPicker = {
          prompt: symbolPickerData.prompt,
          successText: symbolPickerData.successText,
        }
      }
    } else if (entry.elementArt === 'dynamische Dekoration') {
      nodes[id] = {
        type: 'decoration',
        linkedElements: entry.deco.linkedElements,
        style: entry.deco.style,
      }
    }
  }

  const config = {
    svgFile: 'background.svg',
    mode,
    startScreen: { title: startScreenData.title, description: startScreenData.description },
    completionMessage,
    styles: {
      highlightColor: stylingConfig.highlightColor,
      highlightStrokeWidth: stylingConfig.highlightStrokeWidth,
      shroudedOpacity: stylingConfig.shroudedOpacity,
    },
    nodes,
  }

  if (mode === 'SymbolRiddle') {
    const poolFileNames = []
    for (const symbol of symbolPool) {
      poolFileNames.push(symbol.file.name)
    }
    config.symbolPool = poolFileNames
    config.finalRiddleId = finalRiddleId || null
    config.finalRiddlePenalty = finalRiddlePenalty || 30
  }

  return config
}
