import { describe, it, expect } from 'vitest'
import { validateConfig } from '../antike-editor/src/utils/validateConfig.js'
import { makeEntry } from './makeTestConfig.js'

/**
 * Runs the editor's validateConfig with filled-in texts, so only the unlock graph can fail.
 * @param {Object<string, Object>} elementsData - editor elements.
 * @param {'Standard'|'SymbolRiddle'} mode - editor mode.
 * @param {string|null} finalRiddleId - the Abschluss-Rätsel id.
 * @returns {{errors: string[], warnings: string[]}} the validation result.
 */
function validate(elementsData, mode = 'Standard', finalRiddleId = null) {
  const riddleCount = Object.values(elementsData).filter((entry) => entry.elementArt === 'Rätsel').length
  const symbolPool = Array.from({ length: riddleCount }, () => ({}))
  return validateConfig(elementsData, mode, finalRiddleId, symbolPool, { title: 'T', description: 'D' }, 'Ende', { prompt: 'P', successText: 'S' })
}

/**
 * Builds a complete riddle entry.
 * @param {string[]} unlockAfterIds - prerequisites.
 * @returns {Object} elementsData entry.
 */
function riddle(...unlockAfterIds) {
  return makeEntry('Rätsel', { question: 'Q', answers: ['A'], successText: 'S', unlockAfterIds })
}

describe('validateConfig unlock graph messages', () => {
  it('accepts the real exports graph without errors or warnings', () => {
    const elementsData = { Alpen: riddle(), Genua: riddle('Alpen', 'Rubico'), Rubico: riddle('Genua', 'Alpen'), Roma: riddle('[last]') }
    expect(validate(elementsData, 'SymbolRiddle', 'Roma')).toMatchObject({ errors: [], warnings: [] })
  })

  it('reports unreachable riddles as an error', () => {
    const elementsData = { Alpen: riddle(), Genua: riddle('Rubico'), Rubico: riddle('Genua') }
    expect(validate(elementsData).errors).toEqual([
      '2 Rätsel können nie freigeschaltet werden, weil keine ihrer Voraussetzungen von einem Start-Rätsel aus erreichbar ist: Genua, Rubico.',
    ])
  })

  it('treats [last] as a dead reference in Standard mode', () => {
    const elementsData = { Alpen: riddle(), Roma: riddle('[last]') }
    const result = validate(elementsData, 'Standard', 'Roma')
    expect(result.errors).toEqual(['1 Rätsel können nie freigeschaltet werden, weil keine ihrer Voraussetzungen von einem Start-Rätsel aus erreichbar ist: Roma.'])
    expect(result.warnings).toEqual(['1 Freischalt-Bedingung(en) verweisen auf Elemente, die keine Rätsel sind: Roma → [last].'])
  })

  it('warns about references to elements that are no riddles', () => {
    const elementsData = {
      Alpen: riddle(),
      Genua: riddle('Alpen', 'Alt'),
      Alt: makeEntry('Inaktiv'),
      Road: makeEntry('dynamische Dekoration', {}, { linkedElements: ['Alpen', 'Alt'] }),
    }
    expect(validate(elementsData)).toMatchObject({
      errors: [],
      warnings: [
        '1 Freischalt-Bedingung(en) verweisen auf Elemente, die keine Rätsel sind: Genua → Alt.',
        '1 Verknüpfung(en) dynamischer Dekorationen verweisen auf Elemente, die keine Rätsel sind: Road → Alt.',
      ],
    })
  })
})
