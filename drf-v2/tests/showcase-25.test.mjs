// Fila 25: inspection showcase (vitrine), Coleção, fan, DRF monogram and the pit wall marker.
// Browser part runs against the compiled preview on 5175 (override with DRF_SHOWCASE_URL). Set
// DRF_SHOWCASE_CAPTURE_DIR to keep the 1440/390/320 prints.
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { showcaseItems, showcaseIdForEgg } from '../src/scene/showcase/showcaseCatalog.ts'
import { openBrowser } from './cdpBrowser.mjs'

const source = path => readFile(new URL('../src/' + path, import.meta.url), 'utf8')

test('catalogue: every item is a real egg with PT/EN text and a thumbnail', async () => {
  const eggs = await source('scene/garage/easterEggs.ts')
  assert.equal(showcaseItems.length, 17)
  assert.equal(new Set(showcaseItems.map(item => item.id)).size, showcaseItems.length)
  for (const item of showcaseItems) {
    assert.match(eggs, new RegExp(`(place\\('${item.id}'|id:'${item.id}')`), item.id + ' exists in the room')
    for (const locale of ['pt', 'en']) { assert.ok(item.name[locale].length > 1); assert.ok(item.caption[locale].length > 8) }
    const thumb = await readFile(new URL(`../public/collection/${item.id}.webp`, import.meta.url))
    assert.ok(thumb.length > 900 && thumb.length < 20000, item.id + ' thumbnail is real and small')
  }
  assert.equal(showcaseIdForEgg('suporte-capacete'), 'capacete')
  assert.equal(showcaseIdForEgg('unknown'), null)
  assert.match(showcaseItems.find(item => item.id === 'setlists').caption.pt, /Pink Floyd fechando com Eclipse/)
  // Fila 26: Davi's own lines (_fila/TEXTOS-EASTER-EGGS.md) replace the PT captions; the EN keeps his tone.
  const caption = id => showcaseItems.find(item => item.id === id).caption
  assert.equal(caption('caneca').pt, 'Não sou muito fã de café, mas tem q tomar.')
  assert.equal(caption('figure').pt, 'Esse era pra ser meu boneco kkkkkk')
  assert.equal(caption('chuteira-caida').pt, 'Acho que ficou claro quem é kkkkkk')
  assert.equal(caption('cobra-coral').pt, 'Apenas um time aí de Pernambuco.')
  for (const id of ['caneca', 'figure', 'cobra-coral', 'guitarra', 'bola', 'chuteira-em-pe', 'chuteira-caida', 'cinto-ferramentas']) assert.notEqual(caption(id).en, caption(id).pt)
  assert.match(showcaseItems.find(item => item.id === 'capacete').caption.pt, /16/)
})

test('room: graphite fan with contact shadow, DRF monogram instead of 360, marker off the pit wall text', async () => {
  const garage = await source('scene/garage/Garage.ts'), details = await source('scene/garage/personalDetails.ts'), framing = await source('scene/camera/framing.ts')
  assert.match(garage, /color: '#23282e'/); assert.match(garage, /fan-contact-shadow/); assert.match(garage, /CylinderGeometry\(\.075/)
  assert.doesNotMatch(details, /fillText\('360'/); assert.match(details, /fillText\('DRF'/); assert.doesNotMatch(details, /pt:'360/)
  assert.match(framing, /'pit-wall': \{[^}]*anchor: \[6\.95, 1\.3, -4\.6\]/)
})

test('showcase overlay in the browser (1440 / 390 / 320, four quality levels, reduced motion)', { timeout: 240000 }, async () => {
  const base = process.env.DRF_SHOWCASE_URL ?? 'http://127.0.0.1:5175/'
  const dir = process.env.DRF_SHOWCASE_CAPTURE_DIR
  if (dir) await mkdir(dir, { recursive: true })
  const b = await openBrowser(base)
  const shot = async name => { if (!dir) return; await b.frames(); await writeFile(`${dir}/${name}.png`, Buffer.from(await b.screenshot(), 'base64')) }
  const status = () => b.evaluate(`document.querySelector('.drf-showcase-canvas')?.dataset.showcaseStatus ?? null`)
  const yaw = async () => Number(await b.evaluate(`document.querySelector('.drf-showcase-canvas')?.dataset.showcaseYaw ?? 'NaN'`))
  const open = async id => { await b.evaluate(`window.dispatchEvent(new CustomEvent('drf:showcase', { detail: { id: ${JSON.stringify(id)} } })); true`); await b.waitFor(`document.querySelector('.drf-showcase-canvas')?.dataset.showcaseStatus === 'ready'`, 200) }
  const centre = () => b.evaluate(`(() => { const r = document.querySelector('.drf-showcase-canvas').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 } })()`)
  const mouse = (type, x, y, extra = {}) => b.command('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1, ...extra })
  try {
    // Desktop 1440, Alta: Coleção from the toolbar, list, inspect, drag, wheel, Esc, focus back.
    await b.viewport(1440, 900, false)
    await b.load('/?lang=pt&mode=immersive#garage', { quality: 'high' })
    assert.ok(await b.click('.drf-hud-tools .drf-collection-switch'), 'Coleção button in the toolbar')
    await b.waitFor(`!!document.querySelector('.drf-showcase-dialog[role="dialog"][aria-modal="true"]')`)
    assert.equal(await b.evaluate(`document.querySelectorAll('.drf-collection-grid button').length`), 17)
    assert.equal(await b.evaluate(`document.activeElement?.getAttribute('aria-label')`), 'Fechar')
    await b.evaluate(`Promise.all([...document.querySelectorAll('.drf-collection-grid img')].map(img => (img.loading = 'eager', img.decode().then(() => img.naturalWidth > 0, () => false)))).then(all => all.every(Boolean))`)
    await shot('1440-colecao')
    await b.click('[data-showcase-item="caneca"]')
    await b.waitFor(`document.querySelector('.drf-showcase-canvas')?.dataset.showcaseStatus === 'ready'`, 200)
    assert.equal(await b.evaluate(`document.querySelector('.drf-showcase-caption').textContent`), 'Não sou muito fã de café, mas tem q tomar.')
    const before = await yaw(); await new Promise(done => setTimeout(done, 700)); assert.ok(await yaw() > before + .05, 'slow automatic turn')
    const { x, y } = await centre(), dragged = await yaw()
    await mouse('mousePressed', x, y); await mouse('mouseMoved', x + 120, y + 40); await mouse('mouseReleased', x + 120, y + 40)
    assert.ok(Math.abs(await yaw() - dragged) > .8, 'drag turns the object')
    await b.command('Input.dispatchMouseEvent', { type: 'mouseWheel', x, y, deltaX: 0, deltaY: 5000 }); await b.frames()
    assert.equal(await b.evaluate(`document.querySelector('.drf-showcase-canvas').dataset.showcaseZoom`), '1.800', 'zoom out stops at the limit')
    await b.command('Input.dispatchMouseEvent', { type: 'mouseWheel', x, y, deltaX: 0, deltaY: -5000 }); await b.frames()
    assert.equal(await b.evaluate(`document.querySelector('.drf-showcase-canvas').dataset.showcaseZoom`), '0.550', 'zoom in stops at the limit')
    await b.command('Input.dispatchMouseEvent', { type: 'mouseWheel', x, y, deltaX: 0, deltaY: 500 }); await shot('1440-vitrine-caneca')
    await b.evaluate(`document.querySelector('.drf-showcase-canvas').focus(); true`); await b.key('Escape')
    await b.waitFor(`!document.querySelector('.drf-showcase-dialog')`)
    await b.waitFor(`document.activeElement?.classList.contains('drf-collection-switch')`)
    // Opened from the room (same event the egg click sends): switch objects in place, close by clicking outside.
    await b.evaluate('document.activeElement?.blur(); true') // a click in the room leaves no focused control
    await open('setlists'); await shot('1440-vitrine-setlists')
    await open('capacete'); await shot('1440-vitrine-capacete')
    await b.evaluate(`(() => { const el = document.querySelector('.drf-showcase-backdrop'); el.dispatchEvent(new MouseEvent('click', { bubbles: true })); return true })()`)
    await b.waitFor(`!document.querySelector('.drf-showcase-dialog') && document.activeElement?.classList.contains('drf-scene__canvas')`)
    for (const zone of ['driver-profile', 'pit-wall', 'strategy-room']) { await b.load(`/?lang=pt&mode=immersive#${zone}`, { quality: 'high' }); await new Promise(done => setTimeout(done, 2500)); await shot('1440-' + zone) }

    // Phone 390 (Leve, reduced motion): Coleção inside the menu, no automatic turn, X closes.
    for (const [width, quality] of [[390, 'light'], [320, 'auto']]) {
      await b.viewport(width, 844, true)
      await b.load('/?lang=en&mode=immersive#garage', { quality, reduced: true })
      await b.evaluate(`document.querySelector('.drf-hud-menu-panel').closest('details').open = true; true`)
      assert.ok(await b.click('.drf-hud-menu-panel .drf-collection-switch'), 'Collection inside the phone menu')
      await b.waitFor(`!!document.querySelector('.drf-collection-grid')`)
      assert.ok(await b.evaluate('document.documentElement.scrollWidth <= window.innerWidth'), 'list fits ' + width)
      await shot(width + '-collection')
      await b.click('[data-showcase-item="quadro-automato"]'); await b.waitFor(`document.querySelector('.drf-showcase-canvas')?.dataset.showcaseStatus === 'ready'`, 200)
      const still = await yaw(); await new Promise(done => setTimeout(done, 600)); assert.equal(await yaw(), still, 'reduced motion: no automatic turn')
      await shot(width + '-vitrine-quadro')
      await open('capacete'); await shot(width + '-vitrine-capacete')
      await open('setlists'); await shot(width + '-vitrine-setlists')
      await b.click('.drf-showcase-head button[aria-label="Close"]'); await b.waitFor(`!document.querySelector('.drf-showcase-dialog')`)
      for (const zone of ['pit-wall', 'strategy-room', 'driver-profile']) { await b.load(`/?lang=en&mode=immersive#${zone}`, { quality, reduced: true }); await new Promise(done => setTimeout(done, 1500)); await shot(width + '-' + zone) }
    }

    // Máxima also opens a model (heaviest path).
    await b.viewport(1440, 900, false); await b.load('/?lang=pt&mode=immersive#garage', { quality: 'max' })
    await open('figure'); assert.equal(await status(), 'ready')
    assert.deepEqual(b.errors, [], 'no console/network errors')
  } finally { b.close() }
})
