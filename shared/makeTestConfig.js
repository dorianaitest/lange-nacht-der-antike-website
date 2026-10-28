/**
 * Builds a minimal valid config, shaped like buildRiddleConfig's output.
 * @param {'Standard'|'SymbolRiddle'} mode - config mode.
 * @returns {Object} fresh riddle-config.json object.
 */
export function makeConfig(mode) {
  const config = {
    svgFile: 'background.svg',
    mode,
    startScreen: { title: '', description: '' },
    completionMessage: 'Geschafft',
    styles: { highlightColor: '#8c7b3e', highlightStrokeWidth: 1, shroudedOpacity: 0.2 },
    nodes: {
      Alpen: {
        type: 'riddle',
        unlockAfterIds: [],
        style: { locked: 'shrouded', accessible: 'highlighted', completed: 'none' },
        riddle: { question: 'Welches Gebirge?', answers: ['Alpen'], successText: '' },
      },
      Roma: {
        type: 'riddle',
        unlockAfterIds: ['Alpen'],
        style: { locked: 'hidden', accessible: 'none', completed: 'none' },
        riddle: { question: 'Welche Stadt?', answers: ['Rom', 'Roma'], successText: 'Richtig' },
      },
      Road: {
        type: 'decoration',
        linkedElements: ['Alpen'],
        style: { locked: 'hidden', accessible: 'shrouded', completed: 'none' },
      },
    },
  }

  if (mode === 'Standard') {
    config.nodes.Alpen.riddle.icon = 'alpen.png'
  } else {
    config.nodes.Roma.symbolPicker = { prompt: '', successText: '' }
    config.symbolPool = ['a.png', 'b.png']
    config.finalRiddleId = 'Roma'
    config.finalRiddlePenalty = 30
  }
  return config
}

/**
 * Builds an elementsData entry the way the editor's App.vue does, with a riddle and a deco part.
 * @param {string} elementArt - 'Rätsel', 'dynamische Dekoration' or 'Inaktiv'.
 * @param {Object} riddle - overrides for the riddle part.
 * @param {Object} deco - overrides for the deco part.
 * @returns {Object} elementsData entry.
 */
export function makeEntry(elementArt, riddle = {}, deco = {}) {
  return {
    elementArt,
    riddle: {
      question: '',
      answers: [''],
      successText: '',
      iconFile: null,
      iconPreview: null,
      unlockAfterIds: [],
      style: { locked: 'shrouded', accessible: 'highlighted', completed: 'none' },
      ...riddle,
    },
    deco: { linkedElements: [], style: { locked: 'hidden', accessible: 'shrouded', completed: 'none' }, ...deco },
  }
}
