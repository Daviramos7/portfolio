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
      const result = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }).catch(error => { throw new Error(error.message + ': ' + expression) })
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
      await waitFor('!!document.querySelector(".drf-ui") && !!document.querySelector("h1")')
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

    const pause = ms => new Promise(done => setTimeout(done, ms))
    const pose = () => evaluate('document.querySelector("canvas").dataset.sceneCameraPosition.split(",").map(Number)')
    const distance = (a, b) => Math.hypot(...a.map((v, i) => v - b[i]))
    const settled = sequence => waitFor('Number(document.querySelector("canvas")?.dataset.sceneCameraSeq) === ' + sequence)
    const nav = id => click('.drf-hud-nav button:nth-child(' + (['garage', 'telemetry', 'pit-wall', 'driver-profile', 'strategy-room'].indexOf(id) + 1) + ')')
    const sequence = async () => Number(await evaluate('document.querySelector("canvas").dataset.sceneCameraSeq'))
    const inspect = () => click('#drf-inspect')
    const choose = id => evaluate('(() => { const s = document.querySelector("#drf-program-select"); s.value = ' + JSON.stringify(id) + '; s.dispatchEvent(new Event("change", {bubbles:true})); })()')
    const fullStage = () => evaluate('(() => { const r = document.querySelector("canvas").getBoundingClientRect(); return Math.abs(r.width-innerWidth)<2 && Math.abs(r.height-innerHeight)<2 && document.documentElement.scrollHeight <= innerHeight+1; })()')

    await viewport(1440, 900, false, 2)
    await command('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] })
    await load('/?lang=pt&mode=immersive#garage')
    assert.equal(await evaluate('document.documentElement.lang'), 'pt')
    assert.equal(await noOverflow(), true)
    if (disableWebGL) {
      await waitFor('document.querySelector("[data-scene-root]")?.dataset.sceneStatus === "unavailable"')
      assert.equal(await evaluate('document.createElement("canvas").getContext("webgl2")'), null)
      assert.equal(await evaluate('document.querySelectorAll(".drf-scene-notice .drf-button").length'), 2)
      assert.equal(await evaluate('document.querySelector(".drf-scene__viewport").hidden'), true)
      await choose('atleta-hibrido')
      await inspect()
      await waitFor('document.querySelector("#drf-reading-title")?.textContent.includes("Atleta")')
      assert.equal(await evaluate('location.hash'), '#garage/atleta-hibrido')
      await keyboard('Escape')
      await snapshot('webgl-fallback')
      await click('.drf-scene-notice .drf-button')
      await waitFor('document.querySelector("[data-scene-root]")?.dataset.sceneStatus === "unavailable"')
      await click('.drf-recruiter-switch')
      await waitFor('document.querySelector(".drf-ui")?.dataset.viewMode === "recruiter"')
      assert.equal(await evaluate('document.querySelector("canvas")'), null)
      assert.equal(await evaluate('document.querySelectorAll(".drf-recruiter-zone").length'), 5)
      assert.equal(await evaluate('document.querySelectorAll(".drf-project-card").length'), 9)
      checks.push('WebGL disabled: readable project, single retry, Recruiter without canvas')
    } else {
      await ready()
      assert.equal(await fullStage(), true, 'Garage occupies the entire viewport without document scrolling')
      assert.equal(await evaluate('document.querySelectorAll("[data-scene-hotspot]").length'), 5)
      assert.equal(await evaluate('document.querySelectorAll(".drf-intro,.drf-project-card,.drf-footer").length'), 0)
      assert.ok(await evaluate('document.querySelector(".drf-showcase").getBoundingClientRect().height < 120'))
      assert.equal(await evaluate('document.querySelector(".drf-hud-nav").getBoundingClientRect().width'), 44)
      const measure = await evaluate('(() => { const c = document.querySelector("canvas"); const gl = c.getContext("webgl2"); const ext = gl.getExtension("WEBGL_debug_renderer_info"); return {drawCalls:Number(c.dataset.sceneDrawCalls),triangles:Number(c.dataset.sceneTriangles),dpr:Number(c.dataset.sceneDpr),gpu:ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : "unavailable"} })()')
      assert.ok(measure.drawCalls > 0 && measure.triangles > 0)
      assert.ok(measure.dpr <= 1.5)
      sceneMeasures.push({ viewport: '1440x900', ...measure })
      await snapshot('integrated-desktop')
      checks.push('Full-screen Garage, compact HUD, five anchors, balanced DPR <= 1.5')

      // Actual canvas raycast, using the renderer's desktop framing and FOV.
      const start = await pose()
      await evaluate('(window.__drfCanvas = document.querySelector("canvas"), true)')
      const bounds = await evaluate('(() => { const r = document.querySelector("canvas").getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height} })()')
      const camera = new PerspectiveCamera(43, bounds.width / bounds.height, .1, 85)
      camera.position.set(...framings.garage.position)
      camera.lookAt(new Vector3(...framings.garage.lookAt))
      camera.updateMatrixWorld()
      // Aim above the car at the station's visible sign, inside its pick volume.
      const pickPoint = new Vector3(...hotspotVolumes.telemetry.position)
      pickPoint.y += hotspotVolumes.telemetry.size[1] * .4
      const projected = pickPoint.project(camera)
      const x = bounds.x + (projected.x + 1) * bounds.width / 2
      const y = bounds.y + (1 - projected.y) * bounds.height / 2
      assert.equal(await evaluate('document.elementFromPoint(' + x + ',' + y + ')?.tagName'), 'CANVAS')
      const before = await sequence()
      await command('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 })
      await command('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 })
      await zone('telemetry')
      await waitFor('location.hash === "#telemetry"')
      await pause(220)
      assert.ok(distance(await pose(), start) > .001)
      assert.ok(distance(await pose(), framings.telemetry.position) > 1, 'Camera has not teleported to its destination')
      await inspect()
      await waitFor('document.activeElement?.id === "drf-reading-title"')
      assert.equal(await evaluate('document.querySelector("canvas") === window.__drfCanvas'), true)
      await pause(80)
      assert.ok(distance(await pose(), framings.telemetry.position) > 1, 'Opening the workstation does not snap the camera')
      await settled(before + 1)
      assert.equal(await evaluate('document.querySelector("canvas").dataset.sceneAmbient'), 'paused')
      await waitFor('document.querySelectorAll(".drf-telemetry-readout").length === 2')
      assert.ok(await evaluate('document.querySelector("#drf-reading").textContent.includes("127.119")'))
      assert.ok(await evaluate('document.querySelector("#drf-reading").textContent.includes("7.803.361.234,91")'))
      await snapshot('integrated-telemetry')
      await keyboard('Escape')
      await waitFor('!document.querySelector("#drf-reading") && document.activeElement?.id === "drf-inspect"')
      await waitFor('document.querySelector("canvas").dataset.sceneAmbient === "running"')
      checks.push('Canvas raycast, cinematic intermediate poses, reading does not snap/remount, documentary telemetry')

      for (const id of ['pit-wall', 'driver-profile', 'strategy-room', 'garage']) {
        const next = (await sequence()) + 1
        await nav(id)
        await zone(id)
        await settled(next)
        await snapshot('zone-' + id)
      }
      const visible = await evaluate('Array.from(document.querySelectorAll("[data-scene-hotspot]")).filter(b => getComputedStyle(b).visibility === "visible" && b.getBoundingClientRect().width > 0).map(b => b.dataset.sceneHotspot)')
      assert.ok(visible.length > 0, 'World anchors must remain visible with the integrated HUD')
      const anchorId = visible.find(id => id !== 'garage') ?? visible[0]
      const anchor = await evaluate('(() => { const r = document.querySelector("[data-scene-hotspot=' + anchorId + ']").getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2} })()')
      await command('Input.dispatchMouseEvent', { type: 'mousePressed', ...anchor, button: 'left', clickCount: 1 })
      await command('Input.dispatchMouseEvent', { type: 'mouseReleased', ...anchor, button: 'left', clickCount: 1 })
      await zone(anchorId)
      await waitFor('document.querySelector("canvas").dataset.sceneCameraPosition !== undefined')
      await pause(2600)
      checks.push('Five useful framings and visible, clickable in-world HTML anchors')

      await nav('pit-wall')
      await pause(400)
      const cancelPose = await pose()
      const oldSeq = await sequence()
      await nav('driver-profile')
      await pause(50)
      assert.ok(distance(await pose(), cancelPose) < .5, 'Cancellation starts from the current pose')
      await zone('driver-profile')
      await waitFor('Number(document.querySelector("canvas").dataset.sceneCameraSeq) > ' + oldSeq)
      assert.ok(distance(await pose(), framings['driver-profile'].position) < .02)
      checks.push('Latest intent wins; cancellation preserves the current camera pose')

      // Simulate a visibility notification at the app boundary, then restore it.
      await nav('strategy-room')
      await pause(300)
      await evaluate('Object.defineProperty(document,"visibilityState",{configurable:true,value:"hidden"}); document.dispatchEvent(new Event("visibilitychange"))')
      await pause(120)
      const hiddenPose = await pose()
      await pause(350)
      assert.ok(distance(await pose(), hiddenPose) < .0001)
      await evaluate('delete document.visibilityState; document.dispatchEvent(new Event("visibilitychange"))')
      await pause(60)
      assert.ok(distance(await pose(), hiddenPose) < .5, 'Return does not skip the paused camera path')
      await pause(2600)
      checks.push('Visibility notification pauses camera time and resumes without jumping')

      await command('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
      await waitFor('document.querySelector(".drf-ui").dataset.reducedMotion === "true"')
      const reducedSeq = (await sequence()) + 1
      await nav('garage')
      await settled(reducedSeq)
      assert.ok(distance(await pose(), framings.garage.position) < .02)
      assert.equal(await evaluate('document.querySelector("canvas").dataset.sceneAmbient'), 'paused')
      checks.push('Reduced motion intentionally uses the direct framing and static ambience')

      await choose('atleta-hibrido')
      await waitFor('location.hash === "#garage/atleta-hibrido"')
      assert.equal(await evaluate('document.querySelector("#drf-reading")'), null)
      await inspect()
      await waitFor('document.activeElement?.id === "drf-reading-title"')
      await keyboard('Tab')
      assert.notEqual(await evaluate('document.activeElement?.tagName'), 'CANVAS')
      await keyboard('Escape')
      await waitFor('document.activeElement?.id === "drf-inspect"')
      await click('button[aria-label="English"]')
      await waitFor('document.documentElement.lang === "en"')
      await click('.drf-recruiter-switch')
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
      checks.push('Program selection then reading, focus/Escape, PT/EN, Recruiter parity and preserved selection')

      await nav('telemetry')
      await zone('telemetry')
      await nav('driver-profile')
      await zone('driver-profile')
      await evaluate('history.back()')
      await zone('telemetry')
      await evaluate('history.forward()')
      await zone('driver-profile')
      await evaluate('document.querySelector(".drf-hud-nav button").focus()')
      await keyboard('Enter')
      await zone('garage')
      checks.push('Browser back/forward and native keyboard navigation')

      await evaluate('document.querySelector("canvas").getContext("webgl2").getExtension("WEBGL_lose_context").loseContext()')
      await waitFor('document.querySelector("[data-scene-root]")?.dataset.sceneStatus === "unavailable"')
      assert.equal(await evaluate('document.querySelectorAll(".drf-scene-notice .drf-button").length'), 2)
      await click('.drf-scene-notice .drf-button')
      await ready()
      checks.push('Context loss is contained; a single retry restores the scene')

      await command('Page.addScriptToEvaluateOnNewDocument', { source: 'Object.defineProperty(window,"localStorage",{get(){throw new DOMException("Blocked","SecurityError")}})' })
      for (const width of [390, 320]) {
        await viewport(width, 844, true, 3)
        await load('/?lang=en&mode=immersive#garage')
        await ready()
        assert.equal(await fullStage(), true)
        assert.equal(await noOverflow(), true)
        assert.ok(await evaluate('Number(document.querySelector("canvas").dataset.sceneDpr) <= 1'))
        await snapshot('mobile-' + width)
        await command('Emulation.setTouchEmulationEnabled', { enabled: true })
        const button = await evaluate('(() => { const r = document.querySelector(".drf-hud-nav button:nth-child(2)").getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2} })()')
        await command('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [button] })
        await command('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
        await zone('telemetry')
        await inspect()
        await waitFor('document.querySelectorAll(".drf-telemetry-readout").length === 2')
        assert.equal(await noOverflow(), true)
        assert.equal(await fullStage(), true)
        await snapshot('mobile-telemetry-' + width)
        await keyboard('Escape')
        await click('.drf-recruiter-switch')
        await waitFor('document.querySelector(".drf-ui")?.dataset.viewMode === "recruiter"')
        assert.equal(await noOverflow(), true)
        sceneMeasures.push({ viewport: width + 'x844', quality: 'low', dpr: 1 })
      }
      checks.push('Mobile 390/320: full viewport, touch, low DPR, blocked storage, readable panels, both modes')
      await load('/?lang=en&mode=immersive#driver-profile/atleta-hibrido')
      await ready()
      await inspect()
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
