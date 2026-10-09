// Integrated smoke: installed Chrome + native CDP, without extra dependencies.
// Usage: node tests/browser-smoke.mjs [URL] [Chrome path]
// Optional: DRF_SCREENSHOT_DIR chooses where visual evidence is saved.
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'
import { PerspectiveCamera, Vector3 } from 'three'
import { framings, hotspotVolumes } from '../src/scene/camera/framing.ts'

const base = process.argv[2] ?? 'http://127.0.0.1:5173/'
const chromePath = process.argv[3] ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const screenshots = process.env.DRF_SCREENSHOT_DIR
  ? resolve(process.env.DRF_SCREENSHOT_DIR)
  : await mkdtemp(join(tmpdir(), 'drf-integrated-evidence-'))
await mkdir(screenshots, { recursive: true })
const checks = []
const sceneMeasures = []
const fonts = new Map()

async function runBrowser(disableWebGL) {
  const profile = await mkdtemp(join(tmpdir(), 'drf-integrated-browser-'))
  const chrome = spawn(chromePath, [
    '--headless=new', '--no-first-run', '--no-default-browser-check',
    ...(disableWebGL ? ['--disable-webgl'] : []),
    '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank',
  ], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] })
  let socket, sessionId
  let nextId = 0
  const pending = new Map()
  const errors = []
  const networkErrors = []
  try {
    const endpoint = await new Promise((done, reject) => {
      const timeout = setTimeout(() => reject(new Error('Chrome startup timed out')), 10000)
      let output = ''
      chrome.on('error', error => { clearTimeout(timeout); reject(error) })
      chrome.stderr.on('data', data => {
        output += data
        const match = output.match(/DevTools listening on (ws:\/\/[^\s]+)/)
        if (match) { clearTimeout(timeout); done(match[1]) }
      })
    })
    socket = new WebSocket(endpoint)
    await new Promise((done, reject) => {
      socket.addEventListener('open', done, { once: true })
      socket.addEventListener('error', reject, { once: true })
    })
    socket.addEventListener('message', event => {
      const message = JSON.parse(event.data)
      if (message.id && pending.has(message.id)) {
        const request = pending.get(message.id)
        pending.delete(message.id)
        clearTimeout(request.timeout)
        if (message.error) request.reject(new Error(JSON.stringify(message.error)))
        else request.done(message.result)
      }
      if (message.sessionId !== sessionId) return
      if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text)
      if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
        errors.push(message.params.args.map(argument => argument.value ?? argument.description).join(' '))
      }
      if (message.method === 'Network.responseReceived') {
        const response = message.params.response
        if (response.status >= 400) networkErrors.push(response.status + ' ' + response.url)
        if (/\.woff2(?:\?|$)/.test(response.url)) fonts.set(response.url, response.status)
      }
      if (message.method === 'Network.loadingFailed' && !message.params.canceled) {
        networkErrors.push(message.params.errorText)
      }
    })
    const command = (method, params = {}, attached = true) => new Promise((done, reject) => {
      const id = ++nextId
      const timeout = setTimeout(() => { pending.delete(id); reject(new Error('CDP timeout: ' + method)) }, 10000)
      pending.set(id, { done, reject, timeout })
      socket.send(JSON.stringify({ id, method, params, ...(attached && sessionId ? { sessionId } : {}) }))
    })
    const target = await command('Target.createTarget', { url: 'about:blank' }, false)
    sessionId = (await command('Target.attachToTarget', { targetId: target.targetId, flatten: true }, false)).sessionId
    await command('Runtime.enable')
    await command('Page.enable')
    await command('Network.enable')
    const evaluate = async expression => {
      const result = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.text + ': ' + expression)
      return result.result.value
    }
    const waitFor = async expression => {
      for (let attempt = 0; attempt < 100; attempt++) {
        if (await evaluate(expression)) return
        await new Promise(done => setTimeout(done, 100))
      }
      const diagnostic = await evaluate('({hash:location.hash,status:{...document.querySelector("[data-scene-root]")?.dataset},canvas:{...document.querySelector("canvas")?.dataset},focus:document.activeElement?.outerHTML,visibility:document.visibilityState})')
      throw new Error('Browser assertion timed out: ' + expression + '\n' + JSON.stringify(diagnostic))
    }
    const viewport = (width, height, mobile, dpr = 1) =>
      command('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: dpr, mobile })
    const load = async path => {
      const marker = 'drf-load-' + nextId
      const url = new URL(path, base).href
      await evaluate('window.__drfSmokeDocument = ' + JSON.stringify(marker))
      // Hash-only/same-URL navigation may keep the old viewport policy alive.
      if (await evaluate('location.href !== "about:blank"')) {
        await command('Page.navigate', { url: 'about:blank' })
        await waitFor('location.href === "about:blank" && window.__drfSmokeDocument !== ' + JSON.stringify(marker))
      }
      await command('Page.navigate', { url })
      // Wait for the new document, not a matching selector left by the previous page.
      await waitFor('window.__drfSmokeDocument !== ' + JSON.stringify(marker) + ' && location.href === ' + JSON.stringify(url))
      await waitFor('document.querySelector("h1")?.textContent === "Davi Ramos Ferreira"')
      await evaluate('document.fonts.ready.then(() => true)')
    }
    const ready = () => waitFor('document.querySelector("[data-scene-root]")?.dataset.sceneStatus === "ready" && !!document.querySelector("canvas")?.dataset.sceneCameraSeq')
    const zone = id => waitFor('document.querySelector("[data-scene-root]")?.dataset.sceneZone === ' + JSON.stringify(id) + ' && !!document.querySelector(".drf-zone-nav [aria-current]")?.textContent')
    const noOverflow = () => evaluate('document.documentElement.scrollWidth <= innerWidth')
    const click = selector => evaluate('document.querySelector(' + JSON.stringify(selector) + ').click()')
    const snapshot = async (name, canvasOnly = false) => {
      let clip
      if (canvasOnly) {
        await evaluate('document.querySelector("canvas").scrollIntoView({block:"center"})')
        clip = await evaluate('(() => { const r = document.querySelector("canvas").getBoundingClientRect(); return {x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height,scale:1} })()')
      }
      const shot = await command('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, ...(clip ? { clip } : {}) })
      await writeFile(join(screenshots, name + '.png'), Buffer.from(shot.data, 'base64'))
    }
    const keyboard = key => command('Input.dispatchKeyEvent', { type: 'keyDown', key, code: key, windowsVirtualKeyCode: key === 'Enter' ? 13 : key === 'Escape' ? 27 : 9, ...(key === 'Enter' ? { text: '\r', unmodifiedText: '\r' } : {}) })
      .then(() => command('Input.dispatchKeyEvent', { type: 'keyUp', key, code: key, windowsVirtualKeyCode: key === 'Enter' ? 13 : key === 'Escape' ? 27 : 9 }))

    await viewport(1440, 900, false, 2)
    await command('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] })
    await load('/?lang=pt&mode=immersive#garage')
    assert.equal(await evaluate('document.documentElement.lang'), 'pt')
    assert.equal(await noOverflow(), true)
    if (disableWebGL) {
      await waitFor('document.querySelector("[data-scene-root]")?.dataset.sceneStatus === "unavailable"')
      assert.equal(await evaluate('document.createElement("canvas").getContext("webgl2")'), null)
      assert.equal(await evaluate('document.querySelectorAll(".drf-project-card").length'), 9)
      assert.equal(await evaluate('document.querySelectorAll(".drf-status-strip .drf-button").length'), 1)
      assert.equal(await evaluate('document.querySelector(".drf-scene__viewport").hidden'), true)
      await click('.drf-status-strip .drf-button')
      await waitFor('document.querySelector("[data-scene-root]")?.dataset.sceneStatus === "unavailable"')
      await click('.drf-preferences .drf-segment:last-child button:last-child')
      await waitFor('document.querySelector(".drf-ui")?.dataset.viewMode === "recruiter"')
      assert.equal(await evaluate('document.querySelector("canvas")'), null)
      assert.equal(await evaluate('document.querySelectorAll(".drf-recruiter-zone").length'), 5)
      checks.push('WebGL disabled: HTML content, single fallback/retry, Recruiter without canvas')
    } else {
      await ready()
      assert.equal(await evaluate('document.querySelectorAll("[data-scene-hotspot]").length'), 5)
      assert.equal(await evaluate('document.querySelector(".drf-visual").compareDocumentPosition(document.querySelector("#drf-content")) & Node.DOCUMENT_POSITION_FOLLOWING'), 4)
      const measure = await evaluate('(() => { const c = document.querySelector("canvas"); const gl = c.getContext("webgl2"); const ext = gl.getExtension("WEBGL_debug_renderer_info"); return {drawCalls:Number(c.dataset.sceneDrawCalls),triangles:Number(c.dataset.sceneTriangles),dpr:Number(c.dataset.sceneDpr),gpu:ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : "unavailable"} })()')
      assert.ok(measure.drawCalls > 0 && measure.triangles > 0)
      assert.ok(measure.dpr <= 1.5)
      sceneMeasures.push({ viewport: '1440x900', ...measure })
      await snapshot('integrated-desktop')
      await snapshot('garage-drf01', true)
      checks.push('Garage renders before content, five hotspots, balanced DPR <= 1.5')

      // Real canvas interaction: project the Telemetry volume into the Garage view.
      const bounds = await evaluate('(() => { const r = document.querySelector("canvas").getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height} })()')
      const camera = new PerspectiveCamera(bounds.width / bounds.height < 1 ? 66 : 46, bounds.width / bounds.height, .1, 85)
      camera.position.set(...framings.garage.position)
      camera.lookAt(new Vector3(...framings.garage.lookAt))
      camera.updateMatrixWorld()
      const projected = new Vector3(...hotspotVolumes.telemetry.position).project(camera)
      const x = bounds.x + (projected.x + 1) * bounds.width / 2
      const y = bounds.y + (1 - projected.y) * bounds.height / 2
      await command('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 })
      await command('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 })
      await zone('telemetry')
      await waitFor('location.hash === "#telemetry"')
      await waitFor('document.querySelector("canvas")?.dataset.sceneCameraSeq === "1"')
      checks.push('Canvas raycast navigates through the shared state')

      for (const id of ['pit-wall', 'driver-profile', 'strategy-room', 'garage']) {
        const nextSequence = 1 + await evaluate('Number(document.querySelector("canvas").dataset.sceneCameraSeq)')
        await click('[data-scene-hotspot="' + id + '"]')
        await zone(id)
        await waitFor('location.hash === ' + JSON.stringify('#' + id))
        // Read only the final navigation through the render contract, never change its state.
        await waitFor('Number(document.querySelector("canvas")?.dataset.sceneCameraSeq) === ' + nextSequence)
      }
      checks.push('All five zone framings and HTML hotspots')

      await evaluate('document.querySelectorAll(".drf-zone-nav button")[1].click(); document.querySelectorAll(".drf-zone-nav button")[2].click(); document.querySelectorAll(".drf-zone-nav button")[3].click()')
      await zone('driver-profile')
      await waitFor('location.hash === "#driver-profile"')
      await new Promise(done => setTimeout(done, 1200))
      assert.equal(await evaluate('document.querySelector("[data-scene-root]").dataset.sceneZone'), 'driver-profile')
      await command('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
      await click('[data-scene-hotspot="garage"]')
      await zone('garage')
      await waitFor('document.querySelector(".drf-ui").dataset.reducedMotion === "true"')
      checks.push('Latest navigation wins and reduced motion propagates')

      await click('#drf-select-atleta-hibrido')
      await waitFor('document.activeElement?.id === "drf-reading-title"')
      assert.equal(await evaluate('location.hash'), '#garage/atleta-hibrido')
      await keyboard('Tab')
      assert.notEqual(await evaluate('document.activeElement?.tagName'), 'CANVAS')
      assert.notEqual(await evaluate('document.activeElement?.id'), 'drf-reading-title')
      await keyboard('Escape')
      await waitFor('!document.querySelector("#drf-reading") && document.activeElement?.id === "drf-select-atleta-hibrido"')
      await click('#drf-select-atleta-hibrido')
      await click('button[aria-label="English"]')
      await waitFor('document.documentElement.lang === "en"')
      await click('.drf-preferences .drf-segment:last-child button:last-child')
      await waitFor('document.querySelector(".drf-ui")?.dataset.viewMode === "recruiter"')
      assert.equal(await evaluate('document.querySelector("canvas")'), null)
      assert.equal(await evaluate('document.querySelectorAll(".drf-recruiter-zone").length'), 5)
      assert.equal(await evaluate('document.querySelectorAll(".drf-project-card").length'), 9)
      assert.equal(await evaluate('location.hash'), '#garage/atleta-hibrido')
      await snapshot('recruiter-en')
      await click('.drf-preferences .drf-segment:last-child button:first-child')
      await ready()
      assert.equal(await evaluate('document.documentElement.lang'), 'en')
      assert.equal(await evaluate('location.hash'), '#garage/atleta-hibrido')
      checks.push('Project reading, focus/Escape, PT/EN, mode parity and preserved selection')

      await click('[data-scene-hotspot="telemetry"]')
      await zone('telemetry')
      await click('#drf-open-reading')
      await waitFor('document.querySelectorAll(".drf-metric").length === 2')
      assert.ok(await evaluate('document.querySelector("#drf-reading").textContent.includes("127,119")'))
      await keyboard('Escape')
      await waitFor('document.activeElement?.id === "drf-open-reading"')
      await click('[data-scene-hotspot="driver-profile"]')
      await zone('driver-profile')
      await evaluate('history.back()')
      await zone('telemetry')
      await evaluate('history.forward()')
      await zone('driver-profile')
      await evaluate('document.querySelectorAll(".drf-zone-nav button")[0].focus()')
      await keyboard('Enter')
      await zone('garage')
      checks.push('Documentary telemetry, history back/forward and native keyboard navigation')

      assert.equal(await evaluate('document.querySelector(".drf-environment button").getAttribute("aria-pressed")'), 'false')
      assert.equal(await evaluate('document.querySelector("canvas").getContext("webgl2").getExtension("WEBGL_lose_context") !== null'), true)
      await evaluate('document.querySelector("canvas").getContext("webgl2").getExtension("WEBGL_lose_context").loseContext()')
      await waitFor('document.querySelector("[data-scene-root]")?.dataset.sceneStatus === "unavailable"')
      assert.equal(await evaluate('document.querySelectorAll(".drf-status-strip .drf-button").length'), 1)
      await click('.drf-status-strip .drf-button')
      await ready()
      checks.push('Context loss is contained, single retry restores scene, audio defaults off')

      await command('Page.addScriptToEvaluateOnNewDocument', { source: 'Object.defineProperty(window,"localStorage",{get(){throw new DOMException("Blocked","SecurityError")}})' })
      for (const width of [390, 320]) {
        await viewport(width, 844, true, 3)
        await load('/?lang=en&mode=immersive#garage')
        await ready()
        assert.equal(await noOverflow(), true)
        assert.equal(await evaluate('document.querySelector(".drf-ui").dataset.reducedMotion'), 'true')
        assert.ok(await evaluate('Number(document.querySelector("canvas").dataset.sceneDpr) <= 1'), JSON.stringify(await evaluate('({width:innerWidth,dpr:document.querySelector("canvas").dataset.sceneDpr})')))
        await command('Emulation.setTouchEmulationEnabled', { enabled: true })
        const button = await evaluate('(() => { const b = document.querySelector("[data-scene-hotspot=telemetry]"); b.scrollIntoView({block:"center"}); const r = b.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2} })()')
        await command('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [button] })
        await command('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
        await zone('telemetry')
        await click('#drf-open-reading')
        await waitFor('document.querySelectorAll(".drf-metric").length === 2')
        assert.equal(await noOverflow(), true)
        await keyboard('Escape')
        await click('[data-scene-hotspot="garage"]')
        await zone('garage')
        await snapshot('mobile-' + width, true)
        sceneMeasures.push({ viewport: width + 'x844', dpr: await evaluate('Number(document.querySelector("canvas").dataset.sceneDpr)') })
        await click('.drf-preferences .drf-segment:last-child button:last-child')
        await waitFor('document.querySelector(".drf-ui")?.dataset.viewMode === "recruiter"')
        assert.equal(await noOverflow(), true)
      }
      checks.push('Mobile 390/320: touch, low DPR, reduced motion, blocked storage, both modes without overflow')
      // Also check a direct project link in its secondary zone after a full load.
      await load('/?lang=en&mode=immersive#driver-profile/atleta-hibrido')
      await ready()
      await waitFor('document.querySelector("#drf-reading-title")?.textContent.includes("Atleta")')
      assert.equal(await evaluate('location.hash'), '#driver-profile/atleta-hibrido')
      checks.push('Direct Driver Performance link uses the same Atleta project')
    }
    assert.deepEqual(errors, [], 'Critical browser console errors')
    assert.deepEqual(networkErrors, [], 'Failed network requests')
    await command('Browser.close', {}, false)
  } finally {
    socket?.close()
    for (const request of pending.values()) clearTimeout(request.timeout)
    if (chrome.exitCode === null) {
      await Promise.race([new Promise(done => chrome.once('exit', done)), new Promise(done => setTimeout(done, 1000))])
      if (chrome.exitCode === null) chrome.kill()
    }
    // Only the absolute, bounded temporary Chrome profile created by this run.
    if (dirname(resolve(profile)) === resolve(tmpdir()) && basename(profile).startsWith('drf-integrated-browser-')) {
      await rm(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 })
    }
  }
}

await runBrowser(false)
await runBrowser(true)
assert.ok(fonts.size > 0, 'Geist font must load')
assert.ok([...fonts.values()].every(status => status === 200), 'Geist font requests must succeed')
console.log(JSON.stringify({ checks, sceneMeasures, fonts: [...fonts.entries()], screenshots, consoleErrors: [], networkErrors: [], mobile: 'emulated; physical device performance pending' }, null, 2))
