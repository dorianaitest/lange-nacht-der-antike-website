import { strToU8, unzipSync, zipSync } from 'fflate'

/**
 * Reads a previously exported project zip and extracts its contents.
 * @param {File} file - The riddle.zip file selected by the user.
 * @returns {Promise<{svgText: string, config: Object, iconFiles: Object, symbolFiles: Object}>}
 *   The map SVG source, the parsed riddle-config.json, and File maps (keyed by
 *   filename) for the icons/ and symbols/ folders.
 */
export async function loadProjectZip(file) {
  const buffer = await file.arrayBuffer()
  const files = unzipSync(new Uint8Array(buffer))

  if (!files['background.svg'] || !files['riddle-config.json']) {
    throw new Error('Zip is missing background.svg or riddle-config.json')
  }

  const decoder = new TextDecoder()
  const svgText = decoder.decode(files['background.svg'])
  const config = JSON.parse(decoder.decode(files['riddle-config.json']))

  const iconFiles = extractFilesByPrefix(files, 'icons/')
  const symbolFiles = extractFilesByPrefix(files, 'symbols/')

  return { svgText, config, iconFiles, symbolFiles }
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
