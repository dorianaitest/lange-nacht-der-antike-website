import { describe, it, expect } from 'vitest'
import { validateRiddleConfig } from './validateRiddleConfig.js'
import { buildRiddleConfig } from '../antike-editor/src/utils/buildRiddleConfig.js'

/**
 * Builds a minimal valid config, shaped like buildRiddleConfig's output.
 * @param {'Standard'|'SymbolRiddle'} mode - config mode.
 * @returns {Object} fresh riddle-config.json object.
 */
function makeConfig(mode) {
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

describe('validateRiddleConfig', () => {
  it('accepts a valid Standard config', () => {
    expect(validateRiddleConfig(makeConfig('Standard'))).toEqual({ valid: true, errors: [] })
  })

  it('accepts a valid SymbolRiddle config', () => {
    expect(validateRiddleConfig(makeConfig('SymbolRiddle'))).toEqual({ valid: true, errors: [] })
  })

  it('rejects an unknown mode', () => {
    const config = makeConfig('Standard')
    config.mode = 'X'
    expect(validateRiddleConfig(config).errors).toContainEqual(expect.objectContaining({ path: '/mode' }))
  })

  it('rejects a config without nodes', () => {
    const config = makeConfig('Standard')
    delete config.nodes
    expect(validateRiddleConfig(config).valid).toBe(false)
  })

  it('rejects an unknown key', () => {
    const config = makeConfig('Standard')
    config.nodes.Road.extra = true
    expect(validateRiddleConfig(config).valid).toBe(false)
  })

  it('rejects SymbolRiddle fields in Standard mode', () => {
    const config = makeConfig('Standard')
    config.symbolPool = []
    expect(validateRiddleConfig(config).errors).toContainEqual(expect.objectContaining({ path: '/symbolPool' }))
  })

  it('rejects a symbolPicker in Standard mode', () => {
    const config = makeConfig('Standard')
    config.nodes.Roma.symbolPicker = { prompt: '', successText: '' }
    expect(validateRiddleConfig(config).valid).toBe(false)
  })

  it('rejects an icon in SymbolRiddle mode', () => {
    const config = makeConfig('SymbolRiddle')
    config.nodes.Alpen.riddle.icon = 'alpen.png'
    expect(validateRiddleConfig(config).valid).toBe(false)
  })

  it('rejects a SymbolRiddle config without finalRiddleId', () => {
    const config = makeConfig('SymbolRiddle')
    delete config.finalRiddleId
    expect(validateRiddleConfig(config).valid).toBe(false)
  })

  it('rejects a null finalRiddleId', () => {
    const config = makeConfig('SymbolRiddle')
    config.finalRiddleId = null
    expect(validateRiddleConfig(config).errors).toContainEqual(expect.objectContaining({ path: '/finalRiddleId' }))
  })

  it('rejects an unknown style value', () => {
    const config = makeConfig('Standard')
    config.nodes.Road.style.locked = 'blurred'
    expect(validateRiddleConfig(config).errors).toContainEqual(expect.objectContaining({ path: '/nodes/Road/style/locked' }))
  })

  it('rejects a hidden accessible riddle', () => {
    const config = makeConfig('Standard')
    config.nodes.Alpen.style.accessible = 'hidden'
    expect(validateRiddleConfig(config).errors).toContainEqual(expect.objectContaining({ path: '/nodes/Alpen/style/accessible' }))
  })

  it('rejects a riddle without answers', () => {
    const config = makeConfig('Standard')
    config.nodes.Alpen.riddle.answers = []
    expect(validateRiddleConfig(config).valid).toBe(false)
  })
})

/**
 * Builds an elementsData entry the way the editor's App.vue does, with a riddle and a deco part.
 * @param {string} elementArt - 'Rätsel', 'dynamische Dekoration' or 'Inaktiv'.
 * @param {Object} riddle - overrides for the riddle part.
 * @param {Object} deco - overrides for the deco part.
 * @returns {Object} elementsData entry.
 */
function makeEntry(elementArt, riddle = {}, deco = {}) {
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

const elementsData = {
  Alpen: makeEntry('Rätsel', { question: 'Welches Gebirge?', answers: ['Alpen', ' '], iconFile: { name: 'alpen.png' } }),
  Roma: makeEntry('Rätsel', { question: 'Welche Stadt?', answers: ['Rom'], unlockAfterIds: ['Alpen'] }),
  Road: makeEntry('dynamische Dekoration', {}, { linkedElements: ['Alpen'] }),
  Sea: makeEntry('Inaktiv'),
}
const symbolPickerData = { prompt: 'Wähle ein Symbol', successText: '' }
const startScreenData = { title: 'Start', description: '' }
const stylingConfig = { highlightColor: '#8c7b3e', highlightStrokeWidth: 1, shroudedOpacity: 0.2 }

describe('validateRiddleConfig with buildRiddleConfig output', () => {
  it('accepts a built Standard config', () => {
    const config = buildRiddleConfig(elementsData, 'Standard', [], null, 30, symbolPickerData, '', startScreenData, stylingConfig)
    expect(validateRiddleConfig(config)).toEqual({ valid: true, errors: [] })
  })

  it('accepts a built SymbolRiddle config', () => {
    const symbolPool = [{ file: { name: 'a.png' } }, { file: { name: 'b.png' } }]
    const config = buildRiddleConfig(elementsData, 'SymbolRiddle', symbolPool, 'Roma', 45, symbolPickerData, '', startScreenData, stylingConfig)
    expect(validateRiddleConfig(config)).toEqual({ valid: true, errors: [] })
  })
})
