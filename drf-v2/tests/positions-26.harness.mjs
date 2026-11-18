// Fila 26: where every easter egg / personal detail lands in each station framing (not a test, not in the glob).
// Node side: the real items (GLBs without images) and the real station cameras (framing.ts + the renderer's fov
// policy) give each item's screen rectangle. Browser side (preview on 5175): the same station is opened, the HUD and
// station card boxes are read, a print is saved and each item's rectangle is checked against them.
// Usage: node tests/positions-26.harness.mjs <antes|depois> [url]
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { Box3, PerspectiveCamera, Vector3 } from 'three'
import { parseTrackModel } from '../src/scene/trackside/TrackModel.ts'
import { createEasterEggs } from '../src/scene/garage/easterEggs.ts'
import { createPersonalDetails } from '../src/scene/garage/personalDetails.ts'
import { createResources } from '../src/scene/garage/resources.ts'
import { framings, mobileFramings } from '../src/scene/camera/framing.ts'
import { openBrowser } from './cdpBrowser.mjs'

const phase = process.argv[2] ?? 'antes', base = process.argv[3] ?? 'http://127.0.0.1:5175/'
const out = new URL(`../../.agent-grid/screenshots/mission-16/fila26-posicoes/${phase}/`, import.meta.url)
await mkdir(out, { recursive: true })
const viewports = [[1440, 900], [390, 844], [320, 844]]
const zones = ['garage', 'telemetry', 'pit-wall', 'driver-profile', 'strategy-room']

// --- node: item bounds -------------------------------------------------------------------------------------------
const bytesOf = async url => { const file = await readFile(new URL('../public/' + url, import.meta.url)); return file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength) }
const withoutImages = bytes => {
  const view = new DataView(bytes), jsonLength = view.getUint32(12, true), json = JSON.parse(new TextDecoder().decode(new Uint8Array(bytes, 20, jsonLength)))
  delete json.images; delete json.textures; delete json.samplers
  for (const material of json.materials ?? []) { delete material.pbrMetallicRoughness?.baseColorTexture; delete material.normalTexture }
  let text = JSON.stringify(json); while (text.length % 4) text += ' '
  const head = new TextEncoder().encode(text), rest = new Uint8Array(bytes, 20 + jsonLength), result = new Uint8Array(20 + head.length + rest.length), v = new DataView(result.buffer)
  v.setUint32(0, 0x46546c67, true); v.setUint32(4, 2, true); v.setUint32(8, result.length, true); v.setUint32(12, head.length, true); v.setUint32(16, 0x4e4f534a, true)
  result.set(head, 20); result.set(rest, 20 + head.length); return result.buffer
}
globalThis.document = { createElement: () => ({ getContext: () => null }), baseURI: 'http://local/' }
const r = createResources()
const eggs = createEasterEggs(r, { bytes: url => bytesOf(url.replace('http://local/', '')), parse: bytes => parseTrackModel(withoutImages(bytes)) }, 0, 0)
await eggs.setQuality('balanced', 'max'); await eggs.load('http://local/')
const details = createPersonalDetails(r); await details.loadModels('http://local/models/props/handgrip.glb').catch(() => {})
for (const root of [eggs.root, details.root]) root.updateMatrixWorld(true)
const items = []
for (const group of eggs.root.children) items.push({ id: group.name.replace('easter-egg-', ''), group })
for (const group of details.details) items.push({ id: group.userData.detailId, zone: group.userData.zone, group })
const zoneOf = { 'post-it': 'pit-wall', watchlist: 'telemetry', 'quadro-automato': 'strategy-room', setlists: 'strategy-room', cachecol: 'garage', 'suporte-capacete': 'garage' }
const { easterEggModels } = await import('../src/scene/garage/easterEggs.ts')
for (const item of items) item.zone ??= easterEggModels.find(spec => spec.id === item.id)?.zone ?? zoneOf[item.id]

function project(item, zone, width, height) {
  const aspect = width / height, view = (aspect < 1 ? mobileFramings : framings)[zone]
  const camera = new PerspectiveCamera(aspect < .42 ? 74 : aspect < 1 ? 63 : 43, aspect, .1, 85)
  camera.position.set(...view.position); camera.lookAt(new Vector3(...view.lookAt)); camera.updateMatrixWorld()
  const box = new Box3().setFromObject(item.group), xs = [], ys = []
  let behind = false
  for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
    const p = new Vector3(x, y, z).project(camera); if (p.z > 1) behind = true
    xs.push((p.x + 1) / 2 * width); ys.push((1 - p.y) / 2 * height)
  }
  const rect = { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) }
  const clip = { x0: Math.max(0, rect.x0), y0: Math.max(0, rect.y0), x1: Math.min(width, rect.x1), y1: Math.min(height, rect.y1) }
  const area = Math.max(0, rect.x1 - rect.x0) * Math.max(0, rect.y1 - rect.y0), inside = Math.max(0, clip.x1 - clip.x0) * Math.max(0, clip.y1 - clip.y0)
  return { rect, clip, inFrame: behind ? 0 : area ? inside / area : 0, size: Math.round(Math.max(rect.x1 - rect.x0, rect.y1 - rect.y0)) }
}

// --- browser: HUD boxes + prints ---------------------------------------------------------------------------------
const browser = await openBrowser(base)
const rows = [], hud = {}
try {
  for (const [width, height] of viewports) {
    await browser.viewport(width, height, width < 1000)
    for (const zone of zones) {
      // A query unique per load makes every station a full navigation: a hash-only change goes through Page.reload,
      // which can reload the previous station's URL (seen once at 320).
      await browser.load(`/?lang=pt&mode=immersive&shot=${zone}-${width}#${zone}`, { reduced: true })
      const framed = await browser.evaluate('location.hash')
      if (framed !== '#' + zone) throw new Error(`station ${zone} opened as ${framed}`)
      // Desktop fetches all twelve; the light profile fetches the `all` selection plus the framed station's models.
      const expected = width < 1000 ? easterEggModels.filter(spec => spec.tier === 'all' || spec.zone === zone).length : easterEggModels.length
      await browser.waitFor(`Number(document.querySelector("canvas")?.dataset.sceneEasterEggs ?? 0) >= ${expected} && document.querySelector("canvas")?.dataset.sceneHandgripModel === "loaded"`, 400)
        .catch(async () => console.error('modelos incompletos', zone, width, await browser.evaluate('JSON.stringify(document.querySelector("canvas").dataset)')))
      await new Promise(done => setTimeout(done, 600))
      await browser.frames()
      const boxes = await browser.evaluate(`(() => {
        const ui = document.querySelector('.drf-ui'), canvas = document.querySelector('canvas'), list = []
        for (const el of ui.querySelectorAll('*')) {
          if (el === canvas || el.contains(canvas) || el.closest('.drf-sr-only')) continue
          if (!el.checkVisibility({ opacityProperty: true, visibilityProperty: true, contentVisibilityAuto: true })) continue
          const s = getComputedStyle(el); if (Number(s.opacity) < .05) continue
          const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2 || r.bottom < 0 || r.top > innerHeight) continue
          const filled = s.backgroundColor !== 'rgba(0, 0, 0, 0)' || s.backdropFilter !== 'none' || s.backgroundImage !== 'none'
          const text = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())
          if (filled || text) list.push([r.left, r.top, r.right, r.bottom])
        }
        return list
      })()`)
      hud[`${zone}-${width}`] = boxes
      const name = `${zone}-${width}.png`
      await writeFile(new URL(name, out), Buffer.from(await browser.screenshot(), 'base64'))
      for (const item of items.filter(item => item.zone === zone)) {
        const p = project(item, zone, width, height)
        // Share of the visible rectangle under any HUD/card box (6 x 6 samples).
        let covered = 0, samples = 0
        for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) {
          const x = p.clip.x0 + (i + .5) / 6 * (p.clip.x1 - p.clip.x0), y = p.clip.y0 + (j + .5) / 6 * (p.clip.y1 - p.clip.y0); samples++
          if (boxes.some(([a, b, c, d]) => x >= a && x <= c && y >= b && y <= d)) covered++
        }
        rows.push({ id: item.id, zone, width, inFrame: +p.inFrame.toFixed(2), covered: p.inFrame ? +(covered / samples).toFixed(2) : null, px: p.size, rect: Object.fromEntries(Object.entries(p.rect).map(([k, v]) => [k, Math.round(v)])), print: name })
      }
    }
  }
  if (browser.errors.length) console.error('browser errors:', browser.errors)
} finally { browser.close(); eggs.dispose(); r.dispose() }
await writeFile(new URL('medidas.json', out), JSON.stringify(rows, null, 1))
await writeFile(new URL('hud.json', out), JSON.stringify(hud))
const flag = row => row.inFrame < .95 ? 'FORA' : row.covered > .25 ? 'COBERTO' : row.width === 390 && row.px < 40 ? 'PEQUENO' : 'ok'
console.log('item | estacao | vp | no quadro | coberto | px | status')
for (const row of rows) console.log([row.id, row.zone, row.width, row.inFrame, row.covered, row.px, flag(row)].join(' | '))
