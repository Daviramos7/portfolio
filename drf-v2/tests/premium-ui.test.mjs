// Mission 10 programme showcase regression: installed Chrome + native CDP.
import { spawn } from 'node:child_process'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { portfolioContent } from '../src/content/portfolio.ts'
import { cdpCommandTimeoutMs } from './cdpBrowser.mjs' // fila 26: shared transport limit (see cdpBrowser.mjs)

// Run with compiled preview on 5175; override URL/Chrome/evidence directory via env.
const base = process.env.DRF_RESCUE_URL ?? 'http://127.0.0.1:5175/'
const chromePath = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const profile = await mkdtemp(join(tmpdir(), 'drf-foundation-'))
const chrome = spawn(chromePath, ['--headless=new', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] })
let socket
const pending = new Map()
let nextId = 0
let sessionId
const errors = []
const checks = []

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
  await new Promise((done, reject) => { socket.addEventListener('open', done, { once: true }); socket.addEventListener('error', reject, { once: true }) })
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
    if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') errors.push(message.params.entry.text); if (message.method === 'Network.loadingFailed') errors.push(message.params.errorText); if (message.method === 'Network.responseReceived' && message.params.response.status >= 400) errors.push(message.params.response.status + ': ' + message.params.response.url); if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text)
    if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') errors.push(message.params.args.map(argument => argument.value ?? argument.description).join(' '))
  })
  const command = (method, params = {}, attached = true) => new Promise((done, reject) => {
    const id = ++nextId
    const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)) }, cdpCommandTimeoutMs)
    pending.set(id, { done, reject, timeout })
    socket.send(JSON.stringify({ id, method, params, ...(attached && sessionId ? { sessionId } : {}) }))
  })
  const target = await command('Target.createTarget', { url: 'about:blank' }, false)
  sessionId = (await command('Target.attachToTarget', { targetId: target.targetId, flatten: true }, false)).sessionId
  await command('Runtime.enable')
  await command('Page.enable'); await command('Log.enable'); await command('Network.enable')
  const evaluate = async expression => {
    const result = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text)
    return result.result.value
  }
  const waitFor = async expression => {
    for (let attempt = 0; attempt < 50; attempt++) {
      if (await evaluate(expression)) return
      await new Promise(done => setTimeout(done, 100))
    }
    throw new Error(`Browser assertion timed out: ${expression}`)
  }
  const viewport = (width, height, mobile) => command('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile })
  const load = async path => {
    const url = new URL(path, base)
    await evaluate('window.__drfRescueOldDocument = true;true')
    const navigation = await command('Page.navigate', { url: url.href })
    if (!navigation.loaderId) await command('Page.reload') // hash-only navigation retains the document
    await waitFor(`!window.__drfRescueOldDocument && document.readyState === 'complete' && document.querySelector('.drf-ui')?.lang === ${JSON.stringify(url.searchParams.get('lang'))} && document.querySelector('.drf-ui')?.dataset.viewMode === ${JSON.stringify(url.searchParams.get('mode'))}`)
    if (url.searchParams.get('mode') === 'immersive') await waitFor(`['ready','unavailable'].includes(document.querySelector('[data-scene-root]')?.dataset.sceneStatus)`)
    await evaluate('document.fonts.ready.then(() => true)')
    await evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))')
  }
  const noOverflow = () => evaluate('document.documentElement.scrollWidth <= window.innerWidth')

  const { mkdir } = await import('node:fs/promises')
  const directory = (process.env.DRF_PREMIUM_CAPTURE_DIR ?? join(tmpdir(), 'drf-premium-ui')) + '/'
  await mkdir(directory, { recursive: true })
  const phase = process.env.DRF_PREMIUM_PHASE ?? 'final'
  const hotspotLimits = []
  const check = (value, label) => { if (!value) throw Error(label); checks.push(label) }
  const frames = () => evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')
  const shot = async name => {
    await frames()
    const { data } = await command('Page.captureScreenshot', { format: 'png' })
    await writeFile(directory + phase + '-' + name + '.png', Buffer.from(data, 'base64'))
  }
  const key = async name => {
    await command('Input.dispatchKeyEvent', { type: 'keyDown', key: name, code: name, ...(name === 'Enter' ? { text: '\r', windowsVirtualKeyCode: 13 } : {}) })
    await command('Input.dispatchKeyEvent', { type: 'keyUp', key: name, code: name })
  }
  const click = async selector => {
    const point = await evaluate(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`)
    await command('Input.dispatchMouseEvent', { type: 'mousePressed', ...point, button: 'left', clickCount: 1 })
    await command('Input.dispatchMouseEvent', { type: 'mouseReleased', ...point, button: 'left', clickCount: 1 })
  }
  await viewport(1440,900,false)
  await load('/?lang=pt&mode=immersive#garage')
  check(await evaluate('matchMedia("(prefers-reduced-motion:reduce)").matches'), 'native reduced preference active')
  check(await evaluate('getComputedStyle(document.querySelector(".drf-program-title > span")).animationName === "none"'), 'native reduced identity is static')
  await evaluate('window.__premiumCanvas = document.querySelector("canvas");true')
  await shot('garage-1440')
  for (const [index, zone] of portfolioContent.zones.entries()) {
    await click(`.drf-hud-nav button:nth-child(${index + 1})`)
    await waitFor(`document.querySelector('[data-scene-root]').dataset.sceneZone === ${JSON.stringify(zone.id)}`)
    await frames()
    const label = await evaluate(`(()=>{const b=document.querySelector('[data-scene-hotspot="${zone.id}"]'),e=b.querySelector('.drf-scene__hotspot-label'),r=b.getBoundingClientRect(),s=getComputedStyle(b),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);b.focus();return {width:e.getBoundingClientRect().width,display:s.display,visibility:s.visibility,rect:r.toJSON(),focused:document.activeElement===b,hit:hit?.outerHTML.slice(0,200)}})()`)
    if (label.focused) check(label.width > 100, 'hotspot intrinsic width ' + zone.id)
    else hotspotLimits.push({ zone: zone.id, ...label })
    await click('#drf-inspect')
    await waitFor('!!document.querySelector("#drf-reading-title")')
    check(await evaluate('document.querySelector("#drf-reading-title").getBoundingClientRect().width > 200'), 'station title legible ' + zone.id)
    await shot('station-' + zone.id + '-1440')
    await key('Escape')
    await waitFor('!document.querySelector("#drf-reading")')
  }
  await click('.drf-hud-nav button:first-child')
  await waitFor('document.querySelector("[data-scene-root]").dataset.sceneZone === "garage"')
  const choose = async id => {
    await evaluate(`(()=>{const e=document.querySelector('#drf-program-select');e.value=${JSON.stringify(id)};e.dispatchEvent(new Event('change',{bubbles:true}))})()`)
    await waitFor(`document.querySelector('.drf-program-title').textContent === ${JSON.stringify(portfolioContent.projects.find(p=>p.id===id).title.pt)}`)
  }
  for (const project of portfolioContent.projects) {
    await choose(project.id)
    check(await evaluate(`document.querySelector('.drf-program-identity').dataset.programId === ${JSON.stringify(project.id)} && document.querySelector('.drf-program-evidence').dataset.pending === ${JSON.stringify(String(project.contentStatus === 'pending-evidence'))}`), 'canonical identity and qualification ' + project.id)
  }
  check(await evaluate('document.querySelector("canvas") === window.__premiumCanvas'), 'selection preserves mounted canvas')
  await evaluate('document.querySelector(".drf-program-selector button:last-child").focus();true')
  await key('Enter')
  await waitFor(`document.querySelector('.drf-program-title').textContent === ${JSON.stringify(portfolioContent.projects[0].title.pt)}`)
  check(await evaluate('document.activeElement === document.querySelector(".drf-program-selector button:last-child")'), 'keyboard selection preserves button focus')
  await click('#drf-inspect')
  await waitFor('!!document.querySelector("#drf-reading-title")')
  check(await evaluate('document.querySelector("canvas") === window.__premiumCanvas'), 'reading preserves mounted canvas')
  check(await evaluate('document.querySelector(".drf-workstation-heading .drf-program-evidence")?.textContent === document.querySelector(".drf-program-identity .drf-program-evidence").lastElementChild.textContent'), 'dossier and identity share canonical evidence without duplicate qualification')
  await key('Escape')
  await waitFor('!document.querySelector("#drf-reading")')
  await frames()
  check(await evaluate('document.activeElement?.id === "drf-inspect"'), 'Escape restores inspect focus')
  await choose(portfolioContent.projects[1].id)
  await choose(portfolioContent.projects[2].id)
  await command('Page.navigateToHistoryEntry', { entryId: (await command('Page.getNavigationHistory')).entries.at(-2).id })
  await waitFor(`document.querySelector('.drf-program-title').textContent === ${JSON.stringify(portfolioContent.projects[1].title.pt)}`)
  check(true, 'back restores selected program')
  await click('.drf-motion-control summary')
  await click('input[value=cinematic]')
  await waitFor('document.querySelector(".drf-ui").dataset.reducedMotion === "false"')
  await shot('cinematic-explicit-1440')
  check(await evaluate('document.querySelector("#drf-audio-toggle").getAttribute("aria-pressed") === "false"'), 'cinematic leaves audio off')
  await key('Escape')
  await choose(portfolioContent.projects[0].id)
  check(await evaluate('getComputedStyle(document.querySelector(".drf-program-title > span")).animationName === "drf-program-identify"'), 'explicit cinematic enables finite identity reveal')
  await evaluate('Promise.all(document.querySelector(".drf-program-identity").getAnimations({subtree:true}).map(a=>a.finished)).then(()=>true)')
  await shot('garage-cinematic-1440')
  await click('#drf-inspect')
  await waitFor('!!document.querySelector("#drf-reading-title")')
  await evaluate('Promise.all(document.querySelector("#drf-reading").getAnimations({subtree:true}).map(a=>a.finished)).then(()=>true)')
  await shot('station-garage-cinematic-1440')
  await key('Escape')
  await click('.drf-motion-control summary')
  await click('input[value=reduced]')
  await waitFor('document.querySelector(".drf-ui").dataset.reducedMotion === "true"')
  await key('Escape')
  await choose(portfolioContent.projects[1].id)
  check(await evaluate('getComputedStyle(document.querySelector(".drf-program-title > span")).animationName === "none"'), 'explicit reduced removes identity movement')
  for (const width of [390,320]) {
    await viewport(width,844,true)
    await load('/?lang=en&mode=immersive#garage')
    await click('.drf-hud-nav button:first-child')
    await frames()
    check(await noOverflow(), 'garage fits ' + width)
    await shot('garage-' + width + '-en')
    await click('#drf-inspect')
    await waitFor('!!document.querySelector("#drf-reading-title")')
    await shot('detail-' + width + '-en')
    check(await noOverflow(), 'detail fits ' + width)
  }
  check(errors.length === 0, 'no console/network errors')
  await writeFile(directory + phase + '-results.json', JSON.stringify({ checks, errors, hotspotLimits }, null, 2))
  console.log(JSON.stringify({ checks, errors, hotspotLimits, directory }, null, 2))
} finally { socket?.close(); chrome.kill() }
