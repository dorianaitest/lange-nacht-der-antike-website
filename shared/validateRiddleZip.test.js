// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { assertValidRiddleZip } from './validateRiddleZip.js'
import { RiddleConfigError } from './validateRiddleConfig.js'
import { makeConfig } from './makeTestConfig.js'

const SVG = '<svg xmlns="http://www.w3.org/2000/svg"><path id="Alpen" d="M0 0h1v1z"/></svg>'

/**
 * Builds the unzipped entries of a valid riddle zip for the given mode.
 * @param {'Standard'|'SymbolRiddle'} mode - config mode.
 * @returns {Object<string, Uint8Array>} entries keyed by path, as fflate's unzipSync returns them.
 */
function makeFiles(mode) {
  const encoder = new TextEncoder()
  const config = makeConfig(mode)
  const files = {
    'background.svg': encoder.encode(SVG),
    'riddle-config.json': encoder.encode(JSON.stringify(config)),
  }
  if (mode === 'Standard') files['icons/alpen.png'] = new Uint8Array([1])
  else for (const symbol of config.symbolPool) files['symbols/' + symbol] = new Uint8Array([1])
  return files
}

/**
 * Runs the check and returns the messages it throws.
 * @param {Object<string, Uint8Array>} files - unzipped entries.
 * @returns {string[]} German messages, empty if the zip is valid.
 */
function messagesFor(files) {
  try {
    assertValidRiddleZip(files)
    return []
  } catch (error) {
    if (!(error instanceof RiddleConfigError)) throw error
    return error.messages
  }
}

describe('assertValidRiddleZip', () => {
  beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => {}))

  it.each(['Standard', 'SymbolRiddle'])('accepts a valid %s zip and returns its contents', (mode) => {
    const { svgText, config } = assertValidRiddleZip(makeFiles(mode))
    expect(svgText).toBe(SVG)
    expect(config).toEqual(makeConfig(mode))
  })

  it('ignores extra files', () => {
    const files = makeFiles('Standard')
    files['icons/unused.png'] = new Uint8Array([1])
    files['notes.txt'] = new Uint8Array([1])
    expect(messagesFor(files)).toEqual([])
  })

  it('reports a missing background.svg', () => {
    const files = makeFiles('Standard')
    delete files['background.svg']
    expect(messagesFor(files)).toEqual(['„background.svg“ fehlt in der Zip-Datei.'])
  })

  it('reports a missing riddle-config.json', () => {
    const files = makeFiles('Standard')
    delete files['riddle-config.json']
    expect(messagesFor(files)).toEqual(['„riddle-config.json“ fehlt in der Zip-Datei.'])
  })

  it('reports invalid JSON', () => {
    const files = makeFiles('Standard')
    files['riddle-config.json'] = new TextEncoder().encode('{ "mode": ')
    expect(messagesFor(files)).toEqual(['„riddle-config.json“ ist kein gültiges JSON.'])
  })

  it.each([
    ['HTML', '<!doctype html><html><body></body></html>'],
    ['broken XML', '<svg xmlns="http://www.w3.org/2000/svg"><path></svg>'],
    ['a non-svg root', '<html xmlns="http://www.w3.org/1999/xhtml"></html>'],
  ])('reports %s as background.svg', (_, text) => {
    const files = makeFiles('Standard')
    files['background.svg'] = new TextEncoder().encode(text)
    expect(messagesFor(files)).toEqual(['„background.svg“ ist keine gültige SVG-Datei.'])
  })

  it('reports a missing icon', () => {
    const files = makeFiles('Standard')
    delete files['icons/alpen.png']
    expect(messagesFor(files)).toEqual(['Rätsel „Alpen“: Das Icon „alpen.png“ fehlt im Ordner icons/.'])
  })

  it('reports a missing symbol', () => {
    const files = makeFiles('SymbolRiddle')
    delete files['symbols/b.png']
    expect(messagesFor(files)).toEqual(['Das Symbol „b.png“ fehlt im Ordner symbols/.'])
  })

  it('lists structure problems before schema problems', () => {
    const files = makeFiles('Standard')
    const config = makeConfig('Standard')
    config.mode = 'X'
    files['riddle-config.json'] = new TextEncoder().encode(JSON.stringify(config))
    delete files['background.svg']
    const messages = messagesFor(files)
    expect(messages[0]).toBe('„background.svg“ fehlt in der Zip-Datei.')
    expect(messages[1]).toContain('(mode)')
  })

  it('skips the asset checks when the schema fails', () => {
    const files = makeFiles('Standard')
    const config = makeConfig('Standard')
    config.completionMessage = 5
    files['riddle-config.json'] = new TextEncoder().encode(JSON.stringify(config))
    delete files['icons/alpen.png']
    expect(messagesFor(files)).toEqual(['„Abschlussnachricht“ (completionMessage) muss ein Text sein.'])
  })
})
