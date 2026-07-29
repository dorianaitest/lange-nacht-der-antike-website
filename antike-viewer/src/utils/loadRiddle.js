import { unzipSync } from 'fflate'

export async function loadRiddle(url) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(response.statusText)

  const buffer = await response.arrayBuffer()
  const files = unzipSync(new Uint8Array(buffer))
  const decoder = new TextDecoder()

  const svgText = decoder.decode(files['background.svg'])
  const config = JSON.parse(decoder.decode(files['riddle-config.json']))

  const iconMap = {}
  for (const path in files) {
    if (path.startsWith('icons/')) {
      const name = path.slice(6)
      iconMap[name] = URL.createObjectURL(new Blob([files[path]]))
    }
  }

  const symbolPool = []
  const poolFileNames = config.symbolPool || []
  for (const fileName of poolFileNames) {
    symbolPool.push({ preview: URL.createObjectURL(new Blob([files['symbols/' + fileName]])) })
  }

  return { svgText, config, iconMap, symbolPool }
}

