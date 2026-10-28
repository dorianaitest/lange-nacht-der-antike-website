import { validateRiddleConfig, RiddleConfigError } from './validateRiddleConfig.js'

/**
 * Checks the unzipped contents of a riddle zip: required files, readable JSON and SVG,
 * the config schema, and the icon and symbol files the config references.
 * @param {Object<string, Uint8Array>} files - unzipped entries keyed by path.
 * @returns {{svgText: string, config: Object}} the map SVG source and the parsed config.
 * @throws {RiddleConfigError} with all German messages when anything is wrong.
 */
export function assertValidRiddleZip(files) {
  const messages = []
  const svgText = readSvg(files, messages)
  const config = readConfig(files, messages)

  if (config !== undefined) {
    const { valid, errors, messages: schemaMessages } = validateRiddleConfig(config)
    if (valid) messages.push(...findMissingAssets(config, files))
    else {
      console.error('riddle-config.json does not match the schema:', errors)
      messages.push(...schemaMessages)
    }
  }

  if (messages.length > 0) throw new RiddleConfigError(messages)
  return { svgText, config }
}

/**
 * Reads background.svg and checks that it parses as an SVG document.
 * @param {Object<string, Uint8Array>} files - unzipped entries.
 * @param {string[]} messages - collects German messages.
 * @returns {string|undefined} the SVG source, undefined if it is missing.
 */
function readSvg(files, messages) {
  if (!files['background.svg']) {
    messages.push('„background.svg“ fehlt in der Zip-Datei.')
    return undefined
  }
  const svgText = new TextDecoder().decode(files['background.svg'])
  const document = new DOMParser().parseFromString(svgText, 'image/svg+xml')
  const isSvg = document.documentElement.nodeName === 'svg' && !document.querySelector('parsererror')
  if (!isSvg) messages.push('„background.svg“ ist keine gültige SVG-Datei.')
  return svgText
}

/**
 * Reads and parses riddle-config.json.
 * @param {Object<string, Uint8Array>} files - unzipped entries.
 * @param {string[]} messages - collects German messages.
 * @returns {*} the parsed config, undefined if it is missing or not JSON.
 */
function readConfig(files, messages) {
  if (!files['riddle-config.json']) {
    messages.push('„riddle-config.json“ fehlt in der Zip-Datei.')
    return undefined
  }
  try {
    return JSON.parse(new TextDecoder().decode(files['riddle-config.json']))
  } catch {
    messages.push('„riddle-config.json“ ist kein gültiges JSON.')
    return undefined
  }
}

/**
 * Lists the icons and symbols the config references but the zip lacks.
 * @param {Object} config - schema-valid config.
 * @param {Object<string, Uint8Array>} files - unzipped entries.
 * @returns {string[]} German messages, one per missing file.
 */
function findMissingAssets(config, files) {
  const messages = []
  for (const [id, node] of Object.entries(config.nodes)) {
    const icon = node.riddle?.icon
    if (icon && !files['icons/' + icon]) messages.push('Rätsel „' + id + '“: Das Icon „' + icon + '“ fehlt im Ordner icons/.')
  }
  for (const symbol of config.symbolPool || []) {
    if (!files['symbols/' + symbol]) messages.push('Das Symbol „' + symbol + '“ fehlt im Ordner symbols/.')
  }
  return messages
}
