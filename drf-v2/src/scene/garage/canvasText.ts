export const displayFont = '"Barlow Condensed", sans-serif'
export const bodyFont = '"Geist Variable", sans-serif'

// Preserve every character; wrap even an unbroken token without squeezing glyphs.
export function wrapCanvasText(text: string, width: number, measure: (text: string) => number) {
  const lines: string[] = []
  for (const paragraph of text.split('\n')) {
    let line = ''
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const candidate = line ? line + ' ' + word : word
      if (measure(candidate) <= width) { line = candidate; continue }
      if (line) { lines.push(line); line = '' }
      for (const character of Array.from(word)) {
        if (line && measure(line + character) > width) { lines.push(line); line = '' }
        line += character
      }
    }
    lines.push(line)
  }
  return lines
}

export function fitCanvasBlocks(ctx: Pick<CanvasRenderingContext2D, 'font' | 'measureText'>, texts: readonly string[], width: number, height: number, titleSize = 38) {
  for (let factor = 1; factor >= .669; factor -= .03) {
    let y = 0
    const blocks = texts.map((text, index) => {
      const font = (index === 0 ? titleSize : 27) * factor
      const family = index === 0 ? displayFont : bodyFont
      ctx.font = `${index === 0 ? 700 : 500} ${font}px ${family}`
      const lines = wrapCanvasText(text, width, label => ctx.measureText(label).width)
      const block = { lines, font, family, y }
      y += lines.length * font * 1.3 + 20 * factor
      return block
    })
    if (y <= height) return { blocks, fits: true, height: y, factor }
  }
  return { blocks: [], fits: false, height: 0, factor: null }
}
