import Ajv2020 from 'ajv/dist/2020.js'
import schema from './riddle-config.schema.json' with { type: 'json' }

const validate = new Ajv2020({ allErrors: true }).compile(schema)

const MAX_SHOWN_MESSAGES = 5

/** German labels of config keys, matching the editor UI where it has one. */
const FIELD_LABELS = {
  svgFile: 'SVG-Datei',
  mode: 'Modus',
  startScreen: 'Startbildschirm',
  title: 'Titel',
  description: 'Beschreibung',
  completionMessage: 'Abschlussnachricht',
  styles: 'Darstellung',
  highlightColor: 'Farbe für hervorgehobene Elemente',
  highlightStrokeWidth: 'Strichstärke',
  shroudedOpacity: 'Sichtbarkeit gesperrter Elemente',
  nodes: 'Elemente',
  symbolPool: 'Symbole',
  finalRiddleId: 'Abschluss-Rätsel',
  finalRiddlePenalty: 'Zeitstrafe bei falscher Antwort',
  type: 'Elementart',
  unlockAfterIds: 'Freigeschaltet durch',
  linkedElements: 'Verknüpfte Rätsel',
  style: 'Erscheinung',
  locked: 'Gesperrt',
  accessible: 'Zugänglich',
  completed: 'Gelöst',
  riddle: 'Rätselinhalt',
  question: 'Frage',
  answers: 'Antworten',
  successText: 'Erfolgstext',
  icon: 'Icon',
  symbolPicker: 'Symbolauswahl',
  prompt: 'Hinweistext',
}

/** Editor dropdown labels of the style values. */
const STYLE_LABELS = { hidden: 'versteckt', none: 'normal', shrouded: 'verschleiert', highlighted: 'hervorgehoben' }

/** Keys that only exist in one mode. */
const MODE_ONLY_KEYS = { icon: 'Standard', symbolPicker: 'SymbolRiddle', symbolPool: 'SymbolRiddle', finalRiddleId: 'SymbolRiddle', finalRiddlePenalty: 'SymbolRiddle' }

const TYPE_LABELS = { string: 'ein Text', number: 'eine Zahl', array: 'eine Liste', object: 'ein Objekt' }

const COMPARISON_LABELS = { '>=': 'mindestens', '<=': 'höchstens', '>': 'größer als', '<': 'kleiner als' }

/**
 * Thrown when a riddle-config.json fails the schema. Carries the German messages for the UI.
 */
export class RiddleConfigError extends Error {
  /**
   * @param {string[]} messages - German messages describing what is wrong.
   */
  constructor(messages) {
    super('Invalid riddle-config.json')
    this.name = 'RiddleConfigError'
    this.messages = messages
  }
}

/**
 * Checks a parsed riddle-config.json against the shared schema.
 * @param {Object} config - parsed riddle-config.json.
 * @returns {{valid: boolean, errors: Array<{path: string, message: string}>, messages: string[]}}
 *   result with each Ajv error's JSON path and message, plus German messages for the user.
 */
export function validateRiddleConfig(config) {
  const valid = validate(config)
  const ajvErrors = validate.errors || []
  const errors = []
  for (const error of ajvErrors) {
    errors.push({ path: error.instancePath || '/', message: error.message })
  }
  return { valid, errors, messages: describeErrors(ajvErrors, config) }
}

/**
 * Validates the config and throws if it fails, logging the Ajv details to the console.
 * @param {Object} config - parsed riddle-config.json.
 * @throws {RiddleConfigError} when the config does not match the schema.
 */
export function assertValidRiddleConfig(config) {
  const { valid, errors, messages } = validateRiddleConfig(config)
  if (valid) return
  console.error('riddle-config.json does not match the schema:', errors)
  throw new RiddleConfigError(messages)
}

/**
 * Shortens a message list for display: the first few, then a count of the rest.
 * @param {string[]} messages - German messages.
 * @returns {string[]} at most MAX_SHOWN_MESSAGES messages plus a "und N weitere" line.
 */
export function summarizeMessages(messages) {
  const shown = messages.slice(0, MAX_SHOWN_MESSAGES)
  const hidden = messages.length - shown.length
  if (hidden > 0) shown.push('und ' + hidden + ' weitere')
  return shown
}

/**
 * Turns Ajv errors into German sentences, without Ajv's repeating if/then/else errors and duplicates.
 * @param {Array<Object>} ajvErrors - errors from the compiled Ajv validator.
 * @param {Object} config - the validated config, used for node types and current values.
 * @returns {string[]} unique German messages.
 */
function describeErrors(ajvErrors, config) {
  const messages = new Set()
  for (const error of ajvErrors) {
    if (error.keyword === 'if') continue
    messages.add(describeError(error, config))
  }
  return [...messages]
}

/**
 * Builds the German sentence for one Ajv error.
 * @param {Object} error - Ajv error object.
 * @param {Object} config - the validated config.
 * @returns {string} German message, prefixed with the node it belongs to.
 */
function describeError(error, config) {
  const segments = parsePointer(error.instancePath)
  const childKey = error.params.missingProperty || error.params.additionalProperty || error.params.unevaluatedProperty
  if (childKey) segments.push(childKey)

  const { owner, fieldSegments } = splitOwner(segments, config)
  const field = describeField(fieldSegments)
  const sentence = describeProblem(error, field, segments, config)
  return owner ? owner + ': ' + sentence : sentence
}

/**
 * Builds what is wrong with the field, by Ajv keyword.
 * @param {Object} error - Ajv error object.
 * @param {string} field - German description of the field.
 * @param {string[]} segments - full path of the field.
 * @param {Object} config - the validated config.
 * @returns {string} German sentence without the node prefix.
 */
function describeProblem(error, field, segments, config) {
  const key = segments.at(-1)
  switch (error.keyword) {
    case 'required':
      return field + ' fehlt.'
    case 'additionalProperties':
    case 'unevaluatedProperties':
    case 'false schema':
      return describeForbiddenKey(key, field, config)
    case 'enum':
      return field + ': ' + formatValue(valueAt(config, segments), key) + ' ist nicht erlaubt. Erlaubt: ' + error.params.allowedValues.map((value) => formatValue(value, key)).join(', ') + '.'
    case 'const':
      return field + ' muss ' + formatValue(error.params.allowedValue, key) + ' sein.'
    case 'type':
      return field + ' muss ' + (TYPE_LABELS[error.params.type] || error.params.type) + ' sein.'
    case 'minItems':
    case 'minLength':
      return field + ' darf nicht leer sein.'
    case 'minimum':
    case 'maximum':
    case 'exclusiveMinimum':
      return field + ' muss ' + COMPARISON_LABELS[error.params.comparison] + ' ' + error.params.limit.toLocaleString('de-DE') + ' sein.'
    case 'pattern':
      // shortcut: highlightColor is the only pattern in the schema, give the next pattern its own message
      return field + ' ist keine gültige Farbe, erwartet wird das Format #rrggbb.'
    default:
      return field + ': ' + error.message
  }
}

/**
 * Explains why a key is not allowed where it is: other mode, misplaced known key, or unknown key.
 * @param {string} key - the forbidden key.
 * @param {string} field - German description of the field.
 * @param {Object} config - the validated config.
 * @returns {string} German sentence.
 */
function describeForbiddenKey(key, field, config) {
  const mode = MODE_ONLY_KEYS[key]
  if (mode && config.mode !== mode) return field + ' gibt es nur im Modus ' + mode + '.'
  if (FIELD_LABELS[key]) return field + ' ist hier nicht erlaubt.'
  return 'Unbekanntes Feld „' + key + '“.'
}

/**
 * Splits a node path into the node it belongs to and the path inside that node.
 * @param {string[]} segments - path segments.
 * @param {Object} config - the validated config, for the node's type.
 * @returns {{owner: string|null, fieldSegments: string[]}} e.g. `Rätsel „Alpen“` and `['style', 'accessible']`.
 */
function splitOwner(segments, config) {
  if (segments[0] !== 'nodes' || segments.length < 2) return { owner: null, fieldSegments: segments }
  const id = segments[1]
  const type = config.nodes?.[id]?.type
  let kind = 'Element'
  if (type === 'riddle') kind = 'Rätsel'
  else if (type === 'decoration') kind = 'Dekoration'
  return { owner: kind + ' „' + id + '“', fieldSegments: segments.slice(2) }
}

/**
 * Describes a field by its editor labels plus the technical path.
 * @param {string[]} segments - path inside the node or config.
 * @returns {string} e.g. `„Erscheinung > Zugänglich“ (style.accessible)`, or `Die Konfiguration` for the root.
 */
function describeField(segments) {
  if (segments.length === 0) return 'Die Konfiguration'
  const labels = segments.map((segment) => (/^\d+$/.test(segment) ? 'Nr. ' + (Number(segment) + 1) : FIELD_LABELS[segment] || segment))
  return '„' + labels.join(' > ') + '“ (' + segments.join('.') + ')'
}

/**
 * Formats a config value for a message, with the editor label for style values.
 * @param {*} value - the value.
 * @param {string} key - key the value belongs to.
 * @returns {string} e.g. `„versteckt“ (hidden)` or `„X“`.
 */
function formatValue(value, key) {
  const isStyleKey = key === 'locked' || key === 'accessible' || key === 'completed'
  if (isStyleKey && STYLE_LABELS[value]) return '„' + STYLE_LABELS[value] + '“ (' + value + ')'
  return '„' + String(value) + '“'
}

/**
 * Reads the value at a path in the config.
 * @param {Object} config - the config.
 * @param {string[]} segments - path segments.
 * @returns {*} the value, or undefined if the path does not exist.
 */
function valueAt(config, segments) {
  let value = config
  for (const segment of segments) value = value?.[segment]
  return value
}

/**
 * Splits an Ajv instancePath (JSON Pointer) into unescaped segments.
 * @param {string} pointer - e.g. `/nodes/Alpen/style`.
 * @returns {string[]} e.g. `['nodes', 'Alpen', 'style']`.
 */
function parsePointer(pointer) {
  if (!pointer) return []
  return pointer.slice(1).split('/').map((segment) => segment.replaceAll('~1', '/').replaceAll('~0', '~'))
}
