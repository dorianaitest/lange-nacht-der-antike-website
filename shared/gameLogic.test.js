import { describe, it, expect } from 'vitest'
import {
  isAnswerCorrect,
  isAccessible,
  getRiddleState,
  getDecorationState,
  formatTime,
  buildShuffledSymbolEntries,
  drawRandomSymbol,
  drawFinalRiddleSymbol,
} from './gameLogic.js'

const symbolRiddleConfig = {
  finalRiddleId: 'Roma',
  nodes: {
    Alpen: { type: 'riddle', unlockAfterIds: [] },
    Genua: { type: 'riddle', unlockAfterIds: ['Alpen'] },
    Rubico: { type: 'riddle', unlockAfterIds: ['Alpen'] },
    Roma: { type: 'riddle', unlockAfterIds: ['[last]'] },
  },
}

const standardConfig = {
  nodes: {
    Alpen: { type: 'riddle', unlockAfterIds: [] },
    Genua: { type: 'riddle', unlockAfterIds: ['Alpen'] },
    Rubico: { type: 'riddle', unlockAfterIds: ['Alpen'] },
    Roma: { type: 'riddle', unlockAfterIds: ['Rubico', 'Genua'] },
    Road: { type: 'decoration', linkedElements: ['Genua', 'Rubico'] },
  },
}

describe('isAnswerCorrect', () => {
  const riddle = { answers: ['Zeus, Sohn des Kronos'] }

  it('ignores case, punctuation and extra whitespace', () => {
    expect(isAnswerCorrect(riddle, ' zeus  sohn des   kroNOS.')).toBe(true)
  })

  it('does not remove whitespace inside words', () => {
    expect(isAnswerCorrect(riddle, ' ze  us  sohn des   kroNOS.')).toBe(false)
  })

  it('rejects a wrong answer', () => {
    expect(isAnswerCorrect(riddle, 'Hera')).toBe(false)
  })

  it('accepts any of several answers', () => {
    expect(isAnswerCorrect({ answers: ['Rom', 'Roma'] }, 'roma')).toBe(true)
  })
})

describe('isAccessible', () => {
  it('keeps the final riddle locked until every other riddle is completed', () => {
    expect(isAccessible('Roma', symbolRiddleConfig, { Alpen: true, Genua: true, Rubico: false })).toBe(false)
  })

  it('unlocks the final riddle once every other riddle is completed', () => {
    expect(isAccessible('Roma', symbolRiddleConfig, { Alpen: true, Genua: true, Rubico: true })).toBe(true)
  })

  it('keeps a riddle locked until at least one prerequisite is completed', () => {
    expect(isAccessible('Roma', standardConfig, { Alpen: true, Genua: false, Rubico: false })).toBe(false)
  })

  it('unlocks a riddle once any one of its prerequisites is completed', () => {
    expect(isAccessible('Roma', standardConfig, { Alpen: true, Genua: true, Rubico: false })).toBe(true)
  })

  it('always opens a riddle without prerequisites', () => {
    expect(isAccessible('Alpen', standardConfig, {})).toBe(true)
  })

  it('never opens completed riddles, decorations or unknown ids', () => {
    expect(isAccessible('Alpen', standardConfig, { Alpen: true })).toBe(false)
    expect(isAccessible('Road', standardConfig, {})).toBe(false)
    expect(isAccessible('Nowhere', standardConfig, {})).toBe(false)
  })

  it("opens every riddle with ordering 'unordered', even the final one", () => {
    const unordered = { ...symbolRiddleConfig, ordering: 'unordered' }
    expect(isAccessible('Genua', unordered, {})).toBe(true)
    expect(isAccessible('Roma', unordered, {})).toBe(true)
  })
})

describe('getRiddleState', () => {
  it('reports locked, accessible and completed', () => {
    expect(getRiddleState('Genua', standardConfig, {})).toBe('locked')
    expect(getRiddleState('Genua', standardConfig, { Alpen: true })).toBe('accessible')
    expect(getRiddleState('Genua', standardConfig, { Alpen: true, Genua: true })).toBe('completed')
  })
})

describe('getDecorationState', () => {
  const road = standardConfig.nodes.Road

  it('is locked while all linked riddles are locked', () => {
    expect(getDecorationState(road, standardConfig, {})).toBe('locked')
  })

  it('follows the most advanced linked riddle', () => {
    expect(getDecorationState(road, standardConfig, { Alpen: true })).toBe('accessible')
    expect(getDecorationState(road, standardConfig, { Alpen: true, Genua: true })).toBe('completed')
  })

  it('is locked without linked riddles', () => {
    expect(getDecorationState({ type: 'decoration' }, standardConfig, {})).toBe('locked')
  })
})

describe('formatTime', () => {
  it('pads minutes and seconds to MM:SS', () => {
    expect(formatTime(0)).toBe('00:00')
    expect(formatTime(75)).toBe('01:15')
    expect(formatTime(600)).toBe('10:00')
  })

  it('keeps counting minutes past an hour', () => {
    expect(formatTime(3725)).toBe('62:05')
  })
})

describe('symbol drawing', () => {
  const pool = [{ preview: 'a' }, { preview: 'b' }, { preview: 'c' }]

  it('draws every pool symbol exactly once, then null', () => {
    const used = {}
    const drawn = [drawRandomSymbol(pool, used), drawRandomSymbol(pool, used), drawRandomSymbol(pool, used)]
    expect([...drawn].sort()).toEqual(['a', 'b', 'c'])
    expect(drawRandomSymbol(pool, used)).toBe(null)
  })

  it('returns null for an empty pool', () => {
    expect(drawRandomSymbol([], {})).toBe(null)
    expect(drawFinalRiddleSymbol([], {})).toBe(null)
  })

  it('gives the final riddle the first symbol not yet drawn', () => {
    expect(drawFinalRiddleSymbol(pool, { 0: true, 2: true })).toBe('b')
  })

  it('shuffles all assigned symbols without losing or duplicating any', () => {
    const entries = buildShuffledSymbolEntries({ Alpen: 'a', Genua: 'b', Roma: 'c' })
    expect(entries.map((entry) => entry.riddleId).sort()).toEqual(['Alpen', 'Genua', 'Roma'])
    expect(entries.find((entry) => entry.riddleId === 'Roma').preview).toBe('c')
  })
})
