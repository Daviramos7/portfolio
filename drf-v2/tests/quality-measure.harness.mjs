// Fila 17b: per-level measurement harness (not in the node:test glob).
// Usage: node tests/quality-measure.harness.mjs <base-url> <out-dir> [chrome-path]
// For each viewport × quality level: preload the saved level in localStorage, open the page, wait for the scene,
// read the renderer counters the scene publishes on the canvas dataset, then sample frame pacing for 4 s.
import { spawn } from 'node:child_process'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const base = process.argv[2] ?? 'http://127.0.0.1:5175/'
const out = process.argv[3] ?? join(tmpdir(), 'drf-quality-measure')
const chromePath = process.argv[4] ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const levels = ['auto', 'light', 'high', 'max']
// 390 is emulated at DPR 3 (a typical current phone) so the per-level DPR ceiling is visible.
const viewports = [
  { name: '1440', width: 1440, height: 900, mobile: false, dpr: 1 },
  { name: '1440-dpr2', width: 1440, height: 900, mobile: false, dpr: 2 },
  { name: '390', width: 390, height: 844, mobile: true, dpr: 3 },
]
const sleep = ms => new Promise(done => setTimeout(done, ms))

await mkdir(out, { recursive: true })
const profile = await mkdtemp(join(tmpdir(), 'drf-quality-browser-'))
const chrome = spawn(chromePath, ['--headless=new', '--no-first-run', '--no-default-browser-check',
  '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank'], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] })
const results = [], errors = []
try {
  const endpoint = await new Promise((done, reject) => {
    const timeout = setTimeout(() => reject(new Error('Chrome startup timed out')), 10000)
    let output = ''
    chrome.stderr.on('data', data => { output += data; const m = output.match(/DevTools listening on (ws:\/\/[^\s]+)/); if (m) { clearTimeout(timeout); done(m[1]) } })
  })
  const socket = new WebSocket(endpoint)
  await new Promise((done, reject) => { socket.addEventListener('open', done, { once: true }); socket.addEventListener('error', reject, { once: true }) })
  let nextId = 0, sessionId
  const pending = new Map()
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data)
    if (message.id && pending.has(message.id)) { const p = pending.get(message.id); pending.delete(message.id); message.error ? p.reject(new Error(JSON.stringify(message.error))) : p.done(message.result) }
    if (message.sessionId === sessionId && message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text)
    if (message.sessionId === sessionId && message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') errors.push(message.params.args.map(a => a.value ?? a.description).join(' '))
  })
  const command = (method, params = {}, attached = true) => new Promise((done, reject) => {
    const id = ++nextId; pending.set(id, { done, reject })
    socket.send(JSON.stringify({ id, method, params, ...(attached && sessionId ? { sessionId } : {}) }))
  })
  const target = await command('Target.createTarget', { url: 'about:blank' }, false)
  sessionId = (await command('Target.attachToTarget', { targetId: target.targetId, flatten: true }, false)).sessionId
  await command('Runtime.enable'); await command('Page.enable')
  await command('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] })
  const evaluate = async expression => {
    const r = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ': ' + expression)
    return r.result.value
  }
  const waitFor = async (expression, tries = 200) => { for (let i = 0; i < tries; i++) { if (await evaluate(expression)) return; await sleep(100) } throw new Error('timeout: ' + expression) }
  const shot = async (name, clip) => {
    const s = await command('Page.captureScreenshot', { format: 'png', ...(clip ? { clip: { ...clip, scale: 1 } } : {}) })
    await writeFile(join(out, name + '.png'), Buffer.from(s.data, 'base64'))
  }
  const open = async (hash, level) => {
    await command('Page.navigate', { url: new URL('/?lang=pt&mode=immersive', base).href })
    await waitFor('document.readyState === "complete"')
    await evaluate(`localStorage.setItem('drf-engineering.quality.v1', ${JSON.stringify(level)}); true`)
    await command('Page.navigate', { url: 'about:blank' }); await waitFor('location.href === "about:blank"')
    await command('Page.navigate', { url: new URL('/?lang=pt&mode=immersive' + hash, base).href })
    await waitFor('document.querySelector("[data-scene-root]")?.dataset.sceneStatus === "ready" && !!document.querySelector("canvas")?.dataset.sceneCameraSeq')
    await waitFor(`document.querySelector("canvas")?.dataset.sceneQualityLevel === ${JSON.stringify(level)}`)
    await evaluate('document.fonts.ready.then(() => true)')
    await sleep(2500) // camera settles, textures upload
  }
  for (const vp of viewports) {
    await command('Emulation.setDeviceMetricsOverride', { width: vp.width, height: vp.height, deviceScaleFactor: vp.dpr, mobile: vp.mobile })
    for (const level of levels) {
      await open('#pit-wall', level)
      const counters = await evaluate('(() => { const d = document.querySelector("canvas").dataset; return { dpr: +d.sceneDpr, dprState: d.sceneDprState, quality: d.sceneQuality, drawCalls: +d.sceneDrawCalls, triangles: +d.sceneTriangles, textureBytes: +d.sceneTextureBytes, textureCount: +d.sceneTextureCount, screenResolution: d.sceneScreenResolution, textAnisotropy: +d.sceneTextAnisotropy, backing: [document.querySelector("canvas").width, document.querySelector("canvas").height].join("x"), ambient: d.sceneAmbient, reducedMotion: d.sceneReducedMotion, panel: document.querySelector("[data-scene-root]")?.dataset.panelOpen } })()')
      await shot(`${vp.name}-${level}-pit-wall`)
      const clip = await evaluate('(() => { const w = innerWidth, h = innerHeight; return { x: Math.round(w * .2), y: Math.round(h * .15), width: Math.round(w * .6), height: Math.round(h * .5) } })()')
      await shot(`${vp.name}-${level}-pit-wall-close`, clip)
      // Frame pacing: the scene renders on demand, so idle stations render nothing. A camera move (pit-wall →
      // telemetry) renders every frame: record the interval between consecutive *rendered* frames for 3 s.
      const pacing = await evaluate(`new Promise(done => { const c = document.querySelector('canvas'), t = []; let frames = +c.dataset.sceneRenderedFrames, stamp = +c.dataset.sceneFrameTimestamp; const start = performance.now();
        location.hash = '#telemetry';
        const tick = now => { const f = +c.dataset.sceneRenderedFrames; if (f !== frames) { const s = +c.dataset.sceneFrameTimestamp; if (f === frames + 1) t.push(s - stamp); frames = f; stamp = s }
          if (now - start < 3000) requestAnimationFrame(tick); else { t.sort((a, b) => a - b); done({ movingFrames: t.length, frameMedianMs: t.length ? +t[Math.floor(t.length / 2)].toFixed(2) : null, frameP95Ms: t.length ? +t[Math.floor(t.length * .95)].toFixed(2) : null, dprStateAfter: c.dataset.sceneDprState }) } };
        requestAnimationFrame(tick) })`)
      results.push({ viewport: vp.name, level, ...counters, ...pacing })
      console.log(JSON.stringify(results.at(-1)))
    }
  }
  results.unshift({ gpu: await evaluate('(() => { const g = document.createElement("canvas").getContext("webgl2"), e = g?.getExtension("WEBGL_debug_renderer_info"); return e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : "unknown" })()') })
  socket.close()
} finally {
  if (chrome.exitCode === null) chrome.kill()
  await sleep(500)
  await rm(profile, { recursive: true, force: true }).catch(() => {})
}
await writeFile(join(out, 'measurements.json'), JSON.stringify({ base, date: new Date().toISOString(), results, errors }, null, 2))
console.log(JSON.stringify({ out, errors }))
