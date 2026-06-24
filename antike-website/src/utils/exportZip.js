import { strToU8, zipSync } from 'fflate'
import { buildRiddleConfig } from './buildRiddleConfig.js'

export async function exportZip(plainSvgText, elementsData, mode, symbolPool, abschlussRaetselId, abschlussRaetselPenalty, symbolPickerData, completionMessage) {
  const config = buildRiddleConfig(elementsData, mode, symbolPool, abschlussRaetselId, abschlussRaetselPenalty, symbolPickerData, completionMessage)

  // the zip file needs raw bytes so we need to convert the strings
  const files = {
    'background.svg': strToU8(plainSvgText),
    'riddle-config.json': strToU8(JSON.stringify(config, null, 2)),
  }

  if (mode === 'Spezial') {
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

  const a = document.createElement('a')
  a.href = url
  a.download = 'riddle.zip'
  a.click()
  URL.revokeObjectURL(url)
}
