/**
 * Build the default svg-element
 * @returns {Object} svg-element - A default, unclassified elementsData entry.
 */
function buildDefaultEntry() {
  return {
    elementArt: 'Inaktiv',
    riddle: {
      question: '',
      answers: [''],
      successText: '',
      iconFile: null,
      iconPreview: null,
      unlockAfterIds: [],
      style: { locked: 'shrouded', accessible: 'highlighted', completed: 'none' },
    },
    deco: { linkedElements: [], style: { locked: 'hidden', accessible: 'shrouded', completed: 'none' } },
  }
}

/**
 * create a riddle element from the config
 * @param {Object} element - The riddle element from riddle-config.json.
 * @param {Object<string, File>} iconFiles - Icon files.
 * @returns {Object} riddle - Rätsel entry.
 */
function buildRiddleEntry(element, iconFiles) {
  const entry = buildDefaultEntry()
  entry.elementArt = 'Rätsel'

  const iconFile = element.riddle.icon ? iconFiles[element.riddle.icon] : null
  entry.riddle = {
    question: element.riddle.question,
    answers: element.riddle.answers.length > 0 ? [...element.riddle.answers] : [''],
    successText: element.riddle.successText,
    iconFile,
    iconPreview: iconFile ? URL.createObjectURL(iconFile) : null,
    unlockAfterIds: element.unlockAfterIds,
    style: element.style,
  }

  return entry
}

/**
 * builds a decoration element from config
 * @param {Object} element - The decoration element from cofnig.
 * @returns {Object} deco - dynamische Dekoration entry.
 */
function buildDecorationEntry(element) {
  const entry = buildDefaultEntry()
  entry.elementArt = 'dynamische Dekoration'
  entry.deco = { linkedElements: element.linkedElements, style: element.style }
  return entry
}

/**
 * Create the riddle elementsData that overrides the default one from the editor
 * for every 'special' element
 * @param {Object} elements - all 'special' (meaning riddle or deco) elements
 * @param {Object<string, File>} iconFiles - Icon files.
 * @returns {Object} elementsData - element entries.
 */
function buildElementOverrides(elements, iconFiles) {
  const overrides = {}
  for (const [id, element] of Object.entries(elements)) {
    overrides[id] = element.type === 'riddle' ? buildRiddleEntry(element, iconFiles) : buildDecorationEntry(element)
  }
  return overrides
}

/**
 * Build the symbol pool mappings
 * @param {string[]} poolFileNames - Filenames.
 * @param {Object<string, File>} symbolFiles - Symbol files.
 * @returns {Array<{file: File, preview: string}>} Symbol pool entries.
 */
function buildSymbolPool(poolFileNames, symbolFiles) {
  return poolFileNames.map((fileName) => {
    const file = symbolFiles[fileName]
    return { file, preview: URL.createObjectURL(file) }
  })
}

/**
 * SymbolRiddle modes texts for the symbol picker
 * @param {Object} elements - the config's elements
 * @returns {{prompt: string, successText: string}} Symbol picker texts.
 */
function findSymbolPickerData(elements) {
  for (const element of Object.values(elements)) {
    if (element.symbolPicker) return { ...element.symbolPicker }
  }
  return { prompt: '', successText: '' }
}

/**
 * Takes the project Bundle zip and converts it to the editor state.
 * @param {Object} config - the config json
 * @param {Object<string, File>} iconFiles - Icon files.
 * @param {Object<string, File>} symbolFiles - Symbol files.
 * @returns {Object} selectedMode, elementOverrides, symbolPool, finalRiddleId,
 *   finalRiddlePenalty, completionMessage, startScreenData, symbolPickerData,
 *   and stylingConfig for App.vue to apply.
 */
export function applyProjectConfig(config, iconFiles, symbolFiles) {
  const isSymbolRiddle = config.mode === 'SymbolRiddle'

  return {
    selectedMode: config.mode,
    elementOverrides: buildElementOverrides(config.nodes, iconFiles),
    symbolPool: isSymbolRiddle ? buildSymbolPool(config.symbolPool, symbolFiles) : [],
    finalRiddleId: isSymbolRiddle ? config.finalRiddleId : null,
    finalRiddlePenalty: isSymbolRiddle ? config.finalRiddlePenalty : 30,
    completionMessage: config.completionMessage,
    startScreenData: { ...config.startScreen },
    symbolPickerData: findSymbolPickerData(config.nodes),
    stylingConfig: { ...config.styles },
  }
}
