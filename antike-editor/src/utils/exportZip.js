import { strToU8, zipSync } from 'fflate'
import { buildRiddleConfig } from './buildRiddleConfig.js'

/**
 * Builds the project zip and triggers a browser download of `riddle.zip`.
 * Contents: `background.svg`, `riddle-config.json`,
 * either `symbols/` (all pool symbols, SymbolRiddle mode) or
 * `icons/` (per-riddle icon files, Standard mode).
 * @param{string} plainSvgText - background SVG markup.
 * @param {Object<string, Object>} elementsData - Per-element editor config
 * @param {'Standard'|'SymbolRiddle'} mode - editor mode.
 * @param {Array<{file: File}>} symbolPool - Reward symbols
 * @param {string|null} finalRiddleId - The Abschluss-Rätsel id
 * @param {number} finalRiddlePenalty - Penalty seconds for  final riddle.
 * @param {{prompt: string, successText: string}} symbolPickerData - symbol-picker texts.
 * @param {string} completionMessage - End message.
 * @param {{title: string, description: string}} startScreenData - Start screen texts.
 * @param {{highlightColor: string, highlightStrokeWidth: number, shroudedOpacity: number}} stylingConfig - Global visual settings.
 * @returns {Promise<void>} Resolves once the download has been triggered.
 */
export async function exportZip(plainSvgText, elementsData, mode, symbolPool, finalRiddleId, finalRiddlePenalty, symbolPickerData, completionMessage, startScreenData, stylingConfig) {
  const config = buildRiddleConfig(elementsData, mode, symbolPool, finalRiddleId, finalRiddlePenalty, symbolPickerData, completionMessage, startScreenData, stylingConfig)

  // the zip file needs raw bytes so we need to convert the strings
  const files = {
    'background.svg': strToU8(plainSvgText),
    'riddle-config.json': strToU8(JSON.stringify(config, null, 2)),
  }

  if (mode === 'SymbolRiddle') {
    for (const symbol of symbolPool) {
      const file = symbol.file
      const buffer = await file.arrayBuffer()
      files['symbols/' + file.name] = new Uint8Array(buffer)
    }
  } else {
    for (const [, entry] of Object.entries(elementsData)) {
      if (entry.elementArt === 'Rätsel' && entry.riddle.iconFile) {
        const file = entry.riddle.iconFile
        const buffer = await file.arrayBuffer() // we need the icons raw binary
        files['icons/' + file.name] = new Uint8Array(buffer)
      }
    }
  }

  const zipped = zipSync(files)
  const blob = new Blob([zipped], { type: 'application/zip' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = 'riddle.zip'
  link.click()
  URL.revokeObjectURL(url)
}
