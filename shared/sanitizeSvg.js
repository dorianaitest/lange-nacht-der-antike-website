import DOMPurify from 'dompurify'

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'

// CSS that can load something from outside: url() to anything but #id, the other image/font
// functions, @import, and backslashes, which can hide "url(" behind CSS escapes like "\75 rl(".
const UNSAFE_CSS = /\\|@import|(?:image-set|image|cross-fade|src)\s*\(|url\(\s*(?!['"]?\s*#)/i

// DOMPurify forbids <use> because it can load other files; removeExternalReferences
// limits every href to #id first, so <use> can only point inside the map.
const PURIFY_CONFIG = {
  IN_PLACE: true,
  USE_PROFILES: { svg: true, svgFilters: true },
  ADD_TAGS: ['use'],
  FORBID_TAGS: ['image'],
}

// [singular, plural] German nouns for each kind of removed part, in the order they are reported.
const KIND_NOUNS = {
  script: ['Skript', 'Skripte'],
  foreignObject: ['eingebetteter HTML-Bereich', 'eingebettete HTML-Bereiche'],
  image: ['Bild', 'Bilder'],
  event: ['Ereignis-Attribut', 'Ereignis-Attribute'],
  external: ['externer Verweis', 'externe Verweise'],
  element: ['unzulässiges Element', 'unzulässige Elemente'],
  attribute: ['unzulässiges Attribut', 'unzulässige Attribute'],
}

/**
 * Removes everything from an SVG that could run code or load something from another server,
 * keeping shapes, ids, classes, styles and internal #id references.
 * Editor metadata (Inkscape, Sodipodi, RDF) is removed too, but not reported.
 * @param {string} svgText - SVG source.
 * @returns {{svgText: string|undefined, removed: string[]}} the clean SVG source, undefined if the
 *   input is no SVG, and German descriptions of what was removed, empty for a clean file.
 */
export function sanitizeSvg(svgText) {
  const root = parseSvgRoot(svgText)
  if (!root) return { svgText: undefined, removed: [] }

  const counts = { external: removeExternalReferences(root) }
  const purify = DOMPurify(window)
  purify.sanitize(root, PURIFY_CONFIG)
  for (const entry of purify.removed) countRemoved(entry, counts)

  return { svgText: new XMLSerializer().serializeToString(root), removed: describeCounts(counts) }
}

/**
 * Parses SVG source and adds the SVG namespace when the <svg> root lacks it,
 * as in hand-written files or snippets copied from a web page.
 * @param {string} svgText - SVG source.
 * @returns {Element|undefined} the <svg> root, undefined if the source is no SVG.
 */
function parseSvgRoot(svgText) {
  let root = parseRoot(svgText)
  if (root?.localName === 'svg' && root.namespaceURI === null) {
    root = parseRoot(svgText.replace(/<svg\b/, `<svg xmlns="${SVG_NAMESPACE}"`))
  }
  const isSvg = root?.localName === 'svg' && root.namespaceURI === SVG_NAMESPACE
  return isSvg ? root : undefined
}

/**
 * @param {string} svgText - XML source.
 * @returns {Element|undefined} the root element, undefined if the source does not parse.
 */
function parseRoot(svgText) {
  const document = new DOMParser().parseFromString(svgText, 'image/svg+xml')
  return document.querySelector('parsererror') ? undefined : document.documentElement
}

/**
 * Removes hrefs that do not point to an #id, and <style> elements and attributes whose CSS
 * could load external content, since DOMPurify does not look inside CSS.
 * @param {Element} root - the <svg> element, changed in place.
 * @returns {number} how many elements and attributes were removed.
 */
function removeExternalReferences(root) {
  let removedCount = 0
  for (const element of [root, ...root.querySelectorAll('*')]) {
    // DOMPurify removes every <image> as a whole, so its href must not be counted twice
    if (element.localName === 'image') continue
    if (element.localName === 'style' && UNSAFE_CSS.test(element.textContent)) {
      element.remove()
      removedCount++
      continue
    }
    for (const attribute of [...element.attributes]) {
      if (!isExternalReference(attribute)) continue
      element.removeAttributeNode(attribute)
      removedCount++
    }
  }
  return removedCount
}

/**
 * @param {Attr} attribute - any attribute.
 * @returns {boolean} whether it is an href to anything but an #id, or holds CSS that loads something.
 */
function isExternalReference(attribute) {
  if (attribute.localName === 'href') return !attribute.value.trim().startsWith('#')
  return UNSAFE_CSS.test(attribute.value)
}

/**
 * Adds one DOMPurify.removed entry to the count of its kind; metadata is not counted.
 * @param {{element?: Node, attribute?: Attr}} entry - what DOMPurify removed.
 * @param {Object<string, number>} counts - counts per kind from KIND_NOUNS.
 */
function countRemoved(entry, counts) {
  const kind = entry.element ? getElementKind(entry.element) : getAttributeKind(entry.attribute)
  if (kind) counts[kind] = (counts[kind] ?? 0) + 1
}

/**
 * @param {Node} node - a node DOMPurify removed.
 * @returns {string|undefined} its kind, undefined for metadata, comments and text.
 */
function getElementKind(node) {
  if (node.namespaceURI !== SVG_NAMESPACE || node.localName === 'metadata') return undefined
  if (['script', 'foreignObject', 'image'].includes(node.localName)) return node.localName
  return 'element'
}

/**
 * @param {Attr|null} attribute - an attribute DOMPurify removed.
 * @returns {string|undefined} its kind, undefined for editor metadata like inkscape:label.
 */
function getAttributeKind(attribute) {
  if (!attribute) return 'attribute'
  const name = attribute.name.toLowerCase()
  if (name.startsWith('on')) return 'event'
  if (name === 'href' || name === 'xlink:href') return 'external'
  if (name.includes(':') && !name.startsWith('xlink:') && !name.startsWith('xml:')) return undefined
  return 'attribute'
}

/**
 * Turns the counts into German phrases like „2 Skripte entfernt“.
 * @param {Object<string, number>} counts - counts per kind.
 * @returns {string[]} one phrase per kind with a count above zero.
 */
function describeCounts(counts) {
  return Object.entries(KIND_NOUNS)
    .filter(([kind]) => counts[kind] > 0)
    .map(([kind, [singular, plural]]) => `${counts[kind]} ${counts[kind] === 1 ? singular : plural} entfernt`)
}
