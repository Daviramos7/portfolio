// Fila 25: renders the Coleção thumbnails from the showcase itself (same renderer, no external art).
// Run against the preview: node tests/showcase-thumbs.harness.mjs [http://127.0.0.1:5175/]
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { openBrowser } from './cdpBrowser.mjs'
import { showcaseItems } from '../src/scene/showcase/showcaseCatalog.ts'

const base = process.argv[2] ?? 'http://127.0.0.1:5175/'
const out = fileURLToPath(new URL('../public/collection/', import.meta.url))
await mkdir(out, { recursive: true })
const b = await openBrowser(base)
try {
  await b.viewport(900, 900, false)
  await b.load('/?lang=pt&mode=immersive#garage', { reduced: true, quality: 'high' })
  for (const item of showcaseItems) {
    await b.evaluate(`window.dispatchEvent(new CustomEvent('drf:showcase', { detail: { id: ${JSON.stringify(item.id)} } })); true`)
    await b.waitFor(`document.querySelector('.drf-showcase-canvas')?.dataset.showcaseStatus === 'ready'`, 200)
    await b.frames(); await b.frames()
    const rect = await b.evaluate(`(() => { const r = document.querySelector('.drf-showcase-canvas').getBoundingClientRect(); const s = Math.min(r.width, r.height); return { x: r.left + (r.width - s) / 2, y: r.top + (r.height - s) / 2, width: s, height: s } })()`)
    const png = await b.screenshot(rect)
    const webp = await b.evaluate(`new Promise(done => { const img = new Image(); img.onload = () => { const c = document.createElement('canvas'); c.width = c.height = 192; const x = c.getContext('2d'); x.fillStyle = '#0b121c'; x.fillRect(0, 0, 192, 192); x.drawImage(img, 0, 0, 192, 192); done(c.toDataURL('image/webp', .8).split(',')[1]) }; img.src = 'data:image/png;base64,${png}' })`)
    await writeFile(out + item.id + '.webp', Buffer.from(webp, 'base64'))
    console.log(item.id, Buffer.from(webp, 'base64').length, 'bytes')
  }
  if (b.errors.length) console.log('errors', b.errors)
} finally { b.close() }
