// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { sanitizeSvg } from './sanitizeSvg.js'

const OPEN = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 10 10">'
const CLOSE = '</svg>'

// Shaped like an Inkscape export: editor namespaces, namedview and RDF metadata.
const INKSCAPE_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
  xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
  xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#"
  width="100" height="100" viewBox="0 0 100 100" sodipodi:docname="map.svg" inkscape:version="1.3">
  <sodipodi:namedview id="namedview1" pagecolor="#ffffff" inkscape:zoom="1"><inkscape:grid id="grid1"/></sodipodi:namedview>
  <metadata id="metadata1"><rdf:RDF><cc:Work rdf:about=""><dc:title>Karte</dc:title></cc:Work></rdf:RDF></metadata>
  <defs id="defs1"><linearGradient id="grad"><stop offset="0" style="stop-color:#f00"/></linearGradient></defs>
  <g id="layer1" inkscape:label="Ebene 1" inkscape:groupmode="layer">
    <path id="Alpen" d="M0 0h10v10z" style="fill:url(#grad);stroke:#000" inkscape:label="Alpen"/>
    <rect id="Rom" x="20" y="20" width="10" height="10" fill="url(#grad)"/>
  </g>
</svg>`

// Shaped like an Illustrator export: <style> with classes, <use> with xlink:href, a clip path.
const ILLUSTRATOR_SVG = `<?xml version="1.0" encoding="utf-8"?>
<svg version="1.1" id="Ebene_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
  x="0px" y="0px" viewBox="0 0 100 100" style="enable-background:new 0 0 100 100;" xml:space="preserve">
<style type="text/css">
  .st0{fill:#C8B48C;stroke:#000000;stroke-miterlimit:10;}
  .st1{clip-path:url(#clip1);}
</style>
<defs><clipPath id="clip1"><rect id="clipRect" width="50" height="50"/></clipPath>
  <symbol id="coin" viewBox="0 0 10 10"><circle cx="5" cy="5" r="5"/></symbol></defs>
<polygon id="Schwert" class="st0" points="0,0 10,0 10,10"/>
<g id="Gruppe" class="st1"><use xlink:href="#coin" id="Coin" width="10" height="10"/><use href="#coin" id="Coin2"/></g>
<text id="Label" transform="matrix(1 0 0 1 5 5)" class="st0">Rom</text>
</svg>`

/**
 * Wraps SVG body content in an <svg> root and sanitizes it.
 * @param {string} body - SVG content without the root element.
 * @returns {{svgText: string|undefined, removed: string[]}} the sanitizer result.
 */
function sanitizeBody(body) {
  return sanitizeSvg(OPEN + body + CLOSE)
}

/**
 * @param {string} svgText - SVG source.
 * @returns {string[]} the ids of all elements, in document order.
 */
function getIds(svgText) {
  const document = new DOMParser().parseFromString(svgText, 'image/svg+xml')
  return [...document.querySelectorAll('[id]')].map((element) => element.id)
}

describe('sanitizeSvg removes active content', () => {
  it.each([
    ['<script>', '<script>alert(1)</script><rect id="a"/>', '1 Skript entfernt', /<script|alert/],
    ['onload', '<rect id="a" onload="alert(1)"/>', '1 Ereignis-Attribut entfernt', /onload|alert/],
    ['onclick', '<rect id="a" onclick="alert(1)" onmouseover="alert(2)"/>', '2 Ereignis-Attribute entfernt', /onclick|onmouseover|alert/],
    ['<foreignObject>', '<foreignObject><div xmlns="http://www.w3.org/1999/xhtml"><img src="x" onerror="alert(1)"/></div></foreignObject>',
      '1 eingebetteter HTML-Bereich entfernt', /foreignObject|<div|<img|onerror/],
    ['javascript: in href', '<a href="javascript:alert(1)"><rect id="a"/></a>', '1 externer Verweis entfernt', /javascript/],
    ['javascript: in xlink:href', '<a xlink:href="javascript:alert(1)"><rect id="a"/></a>', '1 externer Verweis entfernt', /javascript/],
  ])('%s', (_name, body, phrase, leftover) => {
    const { svgText, removed } = sanitizeBody(body)
    expect(removed).toContain(phrase)
    expect(svgText).not.toMatch(leftover)
  })

  it('removes <set> and <animate> that could swap in a javascript: link', () => {
    const { svgText } = sanitizeBody(
      '<a href="#a"><set attributeName="href" to="javascript:alert(1)"/>'
      + '<animate attributeName="href" values="javascript:alert(1)"/><rect id="a"/></a>')
    expect(svgText).not.toMatch(/javascript/)
  })
})

describe('sanitizeSvg removes external loads', () => {
  it.each([
    ['href on <use>', '<use href="https://evil.example/x.svg#a"/>', /evil/],
    ['xlink:href on <use>', '<use xlink:href="https://evil.example/x.svg#a"/>', /evil/],
    ['href on <a>', '<a href="https://evil.example"><rect id="a"/></a>', /evil/],
    ['url() in style', '<rect id="a" style="fill:url(https://evil.example/p.svg#p)"/>', /evil/],
    ['url() in a presentation attribute', '<rect id="a" filter="url(\'https://evil.example/f.svg#f\')"/>', /evil/],
    ['url() in <style>', '<style>.a{fill:url("https://evil.example/p.svg#p")}</style><rect id="a"/>', /evil/],
    ['@import in <style>', '<style>@import "https://evil.example/s.css";</style><rect id="a"/>', /evil/],
    ['image-set() in <style>', '<style>.a{background:image-set("https://evil.example/i.png" 1x)}</style>', /evil/],
    ['CSS escape hiding url()', '<rect id="a" style="fill:\\75 rl(https://evil.example/p.svg#p)"/>', /evil/],
  ])('%s', (_name, body, leftover) => {
    const { svgText, removed } = sanitizeBody(body)
    expect(removed.some((phrase) => /externe[rn]? Verweis/.test(phrase))).toBe(true)
    expect(svgText).not.toMatch(leftover)
  })

  it.each([
    ['https:', 'https://evil.example/i.png'],
    ['data:', 'data:image/png;base64,iVBORw0KGgo='],
  ])('<image> with a %s source', (_name, source) => {
    const { svgText, removed } = sanitizeBody(`<image href="${source}" width="10" height="10"/><rect id="a"/>`)
    expect(removed).toEqual(['1 Bild entfernt'])
    expect(svgText).not.toMatch(/<image|evil|data:/)
  })
})

describe('sanitizeSvg keeps the map', () => {
  it.each([
    ['Inkscape', INKSCAPE_SVG, ['layer1', 'Alpen', 'Rom']],
    ['Illustrator', ILLUSTRATOR_SVG, ['Ebene_1', 'clip1', 'clipRect', 'coin', 'Schwert', 'Gruppe', 'Coin', 'Coin2', 'Label']],
  ])('keeps every map id of an %s export and reports nothing', (_name, source, mapIds) => {
    const { svgText, removed } = sanitizeSvg(source)
    expect(removed).toEqual([])
    expect(getIds(svgText)).toEqual(expect.arrayContaining(mapIds))
  })

  it('keeps every id of an Illustrator export unchanged', () => {
    expect(getIds(sanitizeSvg(ILLUSTRATOR_SVG).svgText)).toEqual(getIds(ILLUSTRATOR_SVG))
  })

  it('keeps internal references, classes, styles and the viewBox', () => {
    const { svgText } = sanitizeSvg(ILLUSTRATOR_SVG)
    expect(svgText).toContain('viewBox="0 0 100 100"')
    expect(svgText).toContain('.st1{clip-path:url(#clip1);}')
    expect(svgText).toContain('class="st0"')
    expect(svgText).toMatch(/xlink:href="#coin"/)
    expect(svgText).toContain('href="#coin"')
    expect(sanitizeSvg(INKSCAPE_SVG).svgText).toContain('style="fill:url(#grad);stroke:#000"')
  })

  it('returns a document that parses as SVG again', () => {
    const { svgText } = sanitizeSvg(INKSCAPE_SVG)
    const document = new DOMParser().parseFromString(svgText, 'image/svg+xml')
    expect(document.documentElement.localName).toBe('svg')
    expect(document.querySelector('parsererror')).toBeNull()
  })

  it('adds a missing SVG namespace and keeps the map', () => {
    const { svgText, removed } = sanitizeSvg('<svg viewBox="0 0 10 10"><path id="Alpen" d="M0 0h1v1z" onclick="alert(1)"/></svg>')
    expect(svgText).toBe('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path id="Alpen" d="M0 0h1v1z"/></svg>')
    expect(removed).toEqual(['1 Ereignis-Attribut entfernt'])
  })

  it('returns undefined for text that is no SVG', () => {
    expect(sanitizeSvg('<html><body/></html>').svgText).toBeUndefined()
    expect(sanitizeSvg('not xml').svgText).toBeUndefined()
  })
})
