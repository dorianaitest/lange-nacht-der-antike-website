import { describe, it, expect, vi } from 'vitest'
import { validateRiddleConfig, assertValidRiddleConfig, summarizeMessages, RiddleConfigError } from './validateRiddleConfig.js'
import { buildRiddleConfig } from '../antike-editor/src/utils/buildRiddleConfig.js'
import { makeConfig, makeEntry } from './makeTestConfig.js'

describe('validateRiddleConfig', () => {
  it('accepts a valid Standard config', () => {
    expect(validateRiddleConfig(makeConfig('Standard'))).toEqual({ valid: true, errors: [], messages: [] })
  })

  it('accepts a valid SymbolRiddle config', () => {
    expect(validateRiddleConfig(makeConfig('SymbolRiddle'))).toEqual({ valid: true, errors: [], messages: [] })
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
    expect(validateRiddleConfig(config)).toEqual({ valid: true, errors: [], messages: [] })
  })

  it('accepts a built SymbolRiddle config', () => {
    const symbolPool = [{ file: { name: 'a.png' } }, { file: { name: 'b.png' } }]
    const config = buildRiddleConfig(elementsData, 'SymbolRiddle', symbolPool, 'Roma', 45, symbolPickerData, '', startScreenData, stylingConfig)
    expect(validateRiddleConfig(config)).toEqual({ valid: true, errors: [], messages: [] })
  })
})

describe('validateRiddleConfig messages', () => {
  /**
   * Validates a broken copy of a valid config and returns its German messages.
   * @param {'Standard'|'SymbolRiddle'} mode - mode of the base config.
   * @param {function(Object): void} breakConfig - mutates the config copy.
   * @returns {string[]} German messages.
   */
  function messagesFor(mode, breakConfig) {
    const config = makeConfig(mode)
    breakConfig(config)
    return validateRiddleConfig(config).messages
  }

  it('names the node, the field label and the allowed style values', () => {
    expect(messagesFor('Standard', (config) => (config.nodes.Alpen.style.accessible = 'hidden'))).toEqual([
      'Rätsel „Alpen“: „Erscheinung > Zugänglich“ (style.accessible): „versteckt“ (hidden) ist nicht erlaubt. Erlaubt: „verschleiert“ (shrouded), „hervorgehoben“ (highlighted), „normal“ (none).',
    ])
  })

  it('names a decoration as Dekoration', () => {
    expect(messagesFor('Standard', (config) => (config.nodes.Road.style.locked = 'blurred'))[0]).toMatch(/^Dekoration „Road“: /)
  })

  it('reports an unknown mode without the repeating then/else errors', () => {
    expect(messagesFor('Standard', (config) => (config.mode = 'X'))).toEqual(['„Modus“ (mode): „X“ ist nicht erlaubt. Erlaubt: „Standard“, „SymbolRiddle“.'])
  })

  it('reports a missing field', () => {
    expect(messagesFor('SymbolRiddle', (config) => delete config.finalRiddleId)).toEqual(['„Abschluss-Rätsel“ (finalRiddleId) fehlt.'])
  })

  it('reports an unknown field by its key', () => {
    expect(messagesFor('Standard', (config) => (config.nodes.Alpen.difficulty = 'hard'))).toEqual(['Rätsel „Alpen“: Unbekanntes Feld „difficulty“.'])
  })

  it('reports fields of the other mode', () => {
    expect(messagesFor('SymbolRiddle', (config) => (config.nodes.Alpen.riddle.icon = 'alpen.png'))).toEqual([
      'Rätsel „Alpen“: „Rätselinhalt > Icon“ (riddle.icon) gibt es nur im Modus Standard.',
    ])
    expect(messagesFor('Standard', (config) => (config.finalRiddleId = 'Roma'))).toEqual(['„Abschluss-Rätsel“ (finalRiddleId) gibt es nur im Modus SymbolRiddle.'])
  })

  it('reports an empty field', () => {
    expect(messagesFor('Standard', (config) => (config.nodes.Alpen.riddle.answers = []))).toEqual([
      'Rätsel „Alpen“: „Rätselinhalt > Antworten“ (riddle.answers) darf nicht leer sein.',
    ])
  })

  it('numbers list entries from 1', () => {
    expect(messagesFor('Standard', (config) => (config.nodes.Alpen.riddle.answers = ['Alpen', '']))).toEqual([
      'Rätsel „Alpen“: „Rätselinhalt > Antworten > Nr. 2“ (riddle.answers.1) darf nicht leer sein.',
    ])
  })

  it('reports a number out of range with a German decimal', () => {
    expect(messagesFor('Standard', (config) => (config.styles.highlightStrokeWidth = 0.1))).toEqual([
      '„Darstellung > Strichstärke“ (styles.highlightStrokeWidth) muss mindestens 0,2 sein.',
    ])
  })

  it('reports an invalid color', () => {
    expect(messagesFor('Standard', (config) => (config.styles.highlightColor = 'red'))).toEqual([
      '„Darstellung > Farbe für hervorgehobene Elemente“ (styles.highlightColor) ist keine gültige Farbe, erwartet wird das Format #rrggbb.',
    ])
  })

  it('reports a wrong type', () => {
    expect(messagesFor('Standard', (config) => (config.completionMessage = 42))).toEqual(['„Abschlussnachricht“ (completionMessage) muss ein Text sein.'])
  })

  it('reports a config that is not an object', () => {
    expect(validateRiddleConfig([]).messages).toEqual(['Die Konfiguration muss ein Objekt sein.'])
  })
})

describe('assertValidRiddleConfig', () => {
  it('passes a valid config', () => {
    expect(() => assertValidRiddleConfig(makeConfig('Standard'))).not.toThrow()
  })

  it('throws a RiddleConfigError carrying the German messages', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const config = makeConfig('Standard')
    config.mode = 'X'
    expect(() => assertValidRiddleConfig(config)).toThrow(RiddleConfigError)
    try {
      assertValidRiddleConfig(config)
    } catch (error) {
      expect(error.messages).toEqual(['„Modus“ (mode): „X“ ist nicht erlaubt. Erlaubt: „Standard“, „SymbolRiddle“.'])
    }
    vi.restoreAllMocks()
  })
})

describe('summarizeMessages', () => {
  it('keeps up to 5 messages as they are', () => {
    expect(summarizeMessages(['a', 'b', 'c', 'd', 'e'])).toEqual(['a', 'b', 'c', 'd', 'e'])
  })

  it('cuts after 5 messages and counts the rest', () => {
    expect(summarizeMessages(['a', 'b', 'c', 'd', 'e', 'f', 'g'])).toEqual(['a', 'b', 'c', 'd', 'e', 'und 2 weitere'])
  })
})
