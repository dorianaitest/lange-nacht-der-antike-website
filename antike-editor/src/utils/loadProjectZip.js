import { strToU8, unzipSync, zipSync } from 'fflate'
import { RiddleConfigError } from '@shared/validateRiddleConfig.js'
import { assertValidRiddleZip } from '@shared/validateRiddleZip.js'

/**
 * Reads a previously exported project zip and extracts its contents.
 * @param {File} file - The riddle.zip file selected by the user.
 * @returns {Promise<{svgText: string, removed: string[], config: Object, iconFiles: Object, symbolFiles: Object}>}
 *   The cleaned map SVG source, German descriptions of what the cleaning removed,
 *   the parsed riddle-config.json, and File maps (keyed by filename) for the
 *   icons/ and symbols/ folders.
 */
export async function loadProjectZip(file) {
  const buffer = await file.arrayBuffer()
  let files
  try {
    files = unzipSync(new Uint8Array(buffer))
  } catch {
    throw new RiddleConfigError(['Die Datei ist keine gültige Zip-Datei.'])
  }
  const { svgText, removed, config } = assertValidRiddleZip(files)

  const iconFiles = extractFilesByPrefix(files, 'icons/')
  const symbolFiles = extractFilesByPrefix(files, 'symbols/')

  return { svgText, removed, config, iconFiles, symbolFiles }
}

/**
 * Collects every zip entry under the given prefix into File objects keyed by
 * their filename. Prefix is stripped.
 * @param {Object<string, Uint8Array>} files - All unzipped entries
 * @param {string} prefix - Path prefix to filter by.
 * @returns {Object<string, File>} File - objects keyed by filename.
 */
function extractFilesByPrefix(files, prefix) {
  const result = {}
  for (const path in files) {
    if (!path.startsWith(prefix)) continue
    const name = path.slice(prefix.length)
    result[name] = new File([files[path]], name)
  }
  return result
}
