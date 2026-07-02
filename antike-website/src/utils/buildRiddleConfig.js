export function buildRiddleConfig(elementsData, mode, symbolPool, abschlussRaetselId, abschlussRaetselPenalty, symbolPickerData, completionMessage, startScreenData, stylingConfig) {
  const entries = Object.entries(elementsData)
  const nodes = {}

  for (const [id, entry] of entries) {
    if (entry.elementArt === 'Rätsel') {
      const riddle = {
        question: entry.riddle.question,
        answer: entry.riddle.answer,
        successText: entry.riddle.successText,
      }

      if (mode !== 'Symbolraetsel' && entry.riddle.iconFile) {
        riddle.icon = entry.riddle.iconFile.name
      }

      nodes[id] = {
        type: 'rätsel',
        unlockAfterIds: entry.riddle.unlockAfterIds,
        style: entry.riddle.style || { gesperrt: 'shrouded', zugaenglich: 'highlighted', geloest: 'none' },
        riddle,
      }

      if (mode === 'Symbolraetsel' && id === abschlussRaetselId) {
        nodes[id].symbolPicker = {
          prompt: symbolPickerData.prompt,
          successText: symbolPickerData.successText,
        }
      }
    } else if (entry.elementArt === 'dynamische Dekoration') {
      nodes[id] = {
        type: 'dekoration',
        linkedElements: entry.deco.linkedElements,
        stateBefore: entry.deco.stateBefore,
        stateAfter: entry.deco.stateAfter,
      }
    }
  }

  const config = {
    svgFile: 'background.svg',
    mode,
    startScreen: { titel: startScreenData.titel, beschreibung: startScreenData.beschreibung },
    completionMessage,
    styles: {
      highlightColor: stylingConfig.highlightColor,
      highlightStrokeWidth: stylingConfig.highlightStrokeWidth,
      shroudedOpacity: stylingConfig.shroudedOpacity,
    },
    nodes,
  }

  if (mode === 'Symbolraetsel') {
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
