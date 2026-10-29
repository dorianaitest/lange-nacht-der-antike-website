import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { saveProgress, loadProgress, clearProgress } from './gameProgress.js'

const STORAGE_KEY = 'antike-game-progress'
const HOUR_MS = 60 * 60 * 1000
const START = 1_000_000

const config = {
  mode: 'SymbolRiddle',
  finalRiddleId: 'Roma',
  nodes: {
    Alpen: { type: 'riddle', unlockAfterIds: [] },
    Roma: { type: 'riddle', unlockAfterIds: ['[last]'] },
  },
}

const progress = {
  startedAt: START,
  finishedAt: null,
  penaltyEndsAt: START + 30_000,
  completedRiddles: { Alpen: true },
  assignedSymbols: { Alpen: 2, Roma: 0 },
  symbolSelectionPassed: {},
}

/**
 * Builds a minimal in-memory localStorage.
 * @returns {Object} object with getItem, setItem and removeItem.
 */
function makeMemoryStorage() {
  const items = new Map()
  return {
    getItem: (key) => (items.has(key) ? items.get(key) : null),
    setItem: (key, value) => items.set(key, String(value)),
    removeItem: (key) => items.delete(key),
  }
}

/**
 * Stores progress under the real key with some fields overridden.
 * @param {Object} overrides - fields to replace in the saved entry.
 */
function saveWith(overrides) {
  saveProgress(config, progress)
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...saved, ...overrides }))
}

beforeEach(() => {
  vi.stubGlobal('localStorage', makeMemoryStorage())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('saveProgress and loadProgress', () => {
  it('restores what was saved', () => {
    saveProgress(config, progress)
    expect(loadProgress(config, START + HOUR_MS)).toEqual(progress)
  })

  it('accepts a config parsed again from the same JSON', () => {
    saveProgress(config, progress)
    const reparsed = JSON.parse(JSON.stringify(config))
    expect(loadProgress(reparsed, START)).toEqual(progress)
  })

  it('still restores right at the 12 hour limit', () => {
    saveProgress(config, progress)
    expect(loadProgress(config, START + 12 * HOUR_MS)).toEqual(progress)
  })
})

describe('loadProgress returns null and clears storage', () => {
  it('when nothing is saved', () => {
    expect(loadProgress(config, START)).toBeNull()
  })

  it('when the saved data is not JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{not json')
    expect(loadProgress(config, START)).toBeNull()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('when the saved data is not an object', () => {
    localStorage.setItem(STORAGE_KEY, '[1, 2]')
    expect(loadProgress(config, START)).toBeNull()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('when the format version differs', () => {
    saveWith({ version: 0 })
    expect(loadProgress(config, START)).toBeNull()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('when the config differs', () => {
    saveProgress(config, progress)
    const changed = { ...config, finalRiddlePenalty: 60 }
    expect(loadProgress(changed, START)).toBeNull()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('when more than 12 hours have passed since the start', () => {
    saveProgress(config, progress)
    expect(loadProgress(config, START + 12 * HOUR_MS + 1)).toBeNull()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('when the game is finished and more than 12 hours have passed since the start', () => {
    saveProgress(config, { ...progress, finishedAt: START + HOUR_MS })
    expect(loadProgress(config, START + 13 * HOUR_MS)).toBeNull()
  })

  it.each([
    ['startedAt is missing', { startedAt: undefined }],
    ['finishedAt is a string', { finishedAt: 'yesterday' }],
    ['penaltyEndsAt is missing', { penaltyEndsAt: undefined }],
    ['completedRiddles is an array', { completedRiddles: ['Alpen'] }],
    ['a completed riddle is not true', { completedRiddles: { Alpen: 'yes' } }],
    ['an assigned symbol is not an integer', { assignedSymbols: { Alpen: 'blob:x' } }],
    ['symbolSelectionPassed is null', { symbolSelectionPassed: null }],
  ])('when %s', (_, overrides) => {
    saveWith(overrides)
    expect(loadProgress(config, START)).toBeNull()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })
})

describe('clearProgress', () => {
  it('removes saved progress', () => {
    saveProgress(config, progress)
    clearProgress()
    expect(loadProgress(config, START)).toBeNull()
  })
})

describe('without usable storage', () => {
  const throwing = () => {
    throw new Error('blocked')
  }

  it('does not throw when every access throws', () => {
    vi.stubGlobal('localStorage', { getItem: throwing, setItem: throwing, removeItem: throwing })
    expect(() => saveProgress(config, progress)).not.toThrow()
    expect(loadProgress(config, START)).toBeNull()
    expect(() => clearProgress()).not.toThrow()
  })

  it('does not throw when localStorage does not exist', () => {
    vi.stubGlobal('localStorage', undefined)
    expect(() => saveProgress(config, progress)).not.toThrow()
    expect(loadProgress(config, START)).toBeNull()
    expect(() => clearProgress()).not.toThrow()
  })
})
