// Smoke local sem dependências: Chrome headless + protocolo de depuração nativo.
// Uso: node tests/browser-smoke.mjs [URL] [caminho do Chrome]
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'

const base = process.argv[2] ?? 'http://127.0.0.1:5173/'
const chromePath = process.argv[3] ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const profile = await mkdtemp(join(tmpdir(), 'drf-foundation-'))
const chrome = spawn(chromePath, ['--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-webgl', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] })
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
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text)
    if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') errors.push(message.params.args.map(argument => argument.value ?? argument.description).join(' '))
  })
  const command = (method, params = {}, attached = true) => new Promise((done, reject) => {
    const id = ++nextId
    const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)) }, 5000)
    pending.set(id, { done, reject, timeout })
    socket.send(JSON.stringify({ id, method, params, ...(attached && sessionId ? { sessionId } : {}) }))
  })
  const target = await command('Target.createTarget', { url: 'about:blank' }, false)
  sessionId = (await command('Target.attachToTarget', { targetId: target.targetId, flatten: true }, false)).sessionId
  await command('Runtime.enable')
  await command('Page.enable')
  const evaluate = async expression => {
    const result = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text)
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
    await command('Page.navigate', { url: new URL(path, base).href })
    await waitFor('document.querySelector("h1")?.textContent === "Davi Ramos Ferreira"')
  }
  const noOverflow = () => evaluate('document.documentElement.scrollWidth <= window.innerWidth')

  await viewport(1440, 900, false)
  await load('/?lang=pt&mode=immersive#garage')
  await waitFor('!!document.querySelector("[data-scene-placeholder]")')
  assert.equal(await evaluate('document.documentElement.lang'), 'pt')
  assert.equal(await noOverflow(), true)
  assert.equal(await evaluate('document.createElement("canvas").getContext("webgl") === null'), true)
  checks.push('desktop PT, lazy placeholder, no overflow, WebGL disabled')

  await load('/?lang=en&mode=recruiter#driver-profile/atleta-hibrido')
  assert.equal(await evaluate('document.documentElement.lang'), 'en')
  assert.equal(await evaluate('document.querySelector("[data-scene-placeholder]") === null'), true)
  assert.equal(await evaluate('document.querySelector(".foundation-zone").textContent'), 'Driver Profile')
  await evaluate('location.hash = "telemetry"')
  await waitFor('document.querySelector(".foundation-zone")?.textContent === "Telemetry"')
  await evaluate('history.back()')
  await waitFor('document.querySelector(".foundation-zone")?.textContent === "Driver Profile"')
  await evaluate('history.forward()')
  await waitFor('document.querySelector(".foundation-zone")?.textContent === "Telemetry"')
  checks.push('EN direct link, recruiter mounting contract, hash/back/forward')

  await viewport(390, 844, true)
  await command('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
  await command('Page.addScriptToEvaluateOnNewDocument', { source: 'Object.defineProperty(window, "localStorage", { get() { throw new DOMException("Blocked", "SecurityError") } })' })
  await load('/?lang=en&mode=immersive#garage/atleta-hibrido')
  await waitFor('!!document.querySelector("[data-scene-placeholder]")')
  assert.equal(await noOverflow(), true)
  assert.equal(await evaluate('matchMedia("(prefers-reduced-motion: reduce)").matches'), true)
  assert.equal(await evaluate('document.documentElement.lang'), 'en')
  assert.equal(await evaluate('location.hash'), '#garage/atleta-hibrido')
  checks.push('mobile 390, reduced motion, blocked storage, valid navigation')
  await viewport(320, 844, true)
  assert.equal(await noOverflow(), true)
  checks.push('mobile 320 without horizontal overflow')
  assert.deepEqual(errors, [])
  console.log(JSON.stringify({ checks, consoleErrors: errors, mobile: 'emulated; no physical device tested' }, null, 2))
  await command('Browser.close', {}, false)
} finally {
  socket?.close()
  for (const request of pending.values()) clearTimeout(request.timeout)
  if (chrome.exitCode === null) {
    await Promise.race([new Promise(done => chrome.once('exit', done)), new Promise(done => setTimeout(done, 1000))])
    if (chrome.exitCode === null) chrome.kill()
  }
  // Exclusivamente o perfil temporário criado por este smoke.
  if (dirname(resolve(profile)) === resolve(tmpdir()) && basename(profile).startsWith('drf-foundation-')) {
    await rm(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 })
  }
}
