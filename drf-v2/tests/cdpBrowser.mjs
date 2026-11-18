// Fila 25: installed Chrome + native CDP, shared by the showcase test and the thumbnail harness (not a test itself).
import { spawn } from 'node:child_process'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export async function openBrowser(base) {
  const chromePath = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
  const profile = await mkdtemp(join(tmpdir(), 'drf-showcase-'))
  const chrome = spawn(chromePath, ['--headless=new', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] })
  const pending = new Map(), errors = []
  let nextId = 0, sessionId, socket
  const close = () => { socket?.close(); chrome.kill() }
  try {
    const endpoint = await new Promise((done, reject) => {
      const timeout = setTimeout(() => reject(new Error('Chrome startup timed out')), 10000)
      let output = ''
      chrome.on('error', error => { clearTimeout(timeout); reject(error) })
      chrome.stderr.on('data', data => { output += data; const match = output.match(/DevTools listening on (ws:\/\/[^\s]+)/); if (match) { clearTimeout(timeout); done(match[1]) } })
    })
    socket = new WebSocket(endpoint)
    await new Promise((done, reject) => { socket.addEventListener('open', done, { once: true }); socket.addEventListener('error', reject, { once: true }) })
    socket.addEventListener('message', event => {
      const message = JSON.parse(event.data)
      if (message.id && pending.has(message.id)) {
        const request = pending.get(message.id); pending.delete(message.id); clearTimeout(request.timeout)
        if (message.error) request.reject(new Error(JSON.stringify(message.error))); else request.done(message.result)
      }
      if (message.sessionId !== sessionId) return
      if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') errors.push(message.params.entry.text)
      if (message.method === 'Network.loadingFailed') errors.push(message.params.errorText)
      if (message.method === 'Network.responseReceived' && message.params.response.status >= 400) errors.push(message.params.response.status + ': ' + message.params.response.url)
      if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text)
      if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') errors.push(message.params.args.map(a => a.value ?? a.description).join(' '))
    })
    const command = (method, params = {}, attached = true) => new Promise((done, reject) => {
      const id = ++nextId
      const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)) }, 15000)
      pending.set(id, { done, reject, timeout })
      socket.send(JSON.stringify({ id, method, params, ...(attached && sessionId ? { sessionId } : {}) }))
    })
    const target = await command('Target.createTarget', { url: 'about:blank' }, false)
    sessionId = (await command('Target.attachToTarget', { targetId: target.targetId, flatten: true }, false)).sessionId
    await command('Runtime.enable'); await command('Page.enable'); await command('Log.enable'); await command('Network.enable')
    const evaluate = async expression => {
      const result = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text)
      return result.result.value
    }
    const waitFor = async (expression, attempts = 100) => {
      for (let i = 0; i < attempts; i++) { if (await evaluate(expression)) return; await new Promise(done => setTimeout(done, 100)) }
      throw new Error(`Browser assertion timed out: ${expression}`)
    }
    const frames = () => evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')
    const viewport = (width, height, mobile) => command('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile })
    const load = async (path, { quality, reduced = false } = {}) => {
      await command('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: reduced ? 'reduce' : 'no-preference' }] })
      const url = new URL(path, base)
      if (quality) {
        await command('Page.navigate', { url: new URL('/', base).href }); await waitFor(`document.readyState === 'complete'`)
        await evaluate(`localStorage.setItem('drf-engineering.quality.v1', ${JSON.stringify(quality)}); true`)
      }
      await evaluate('window.__drfOld = true; true')
      const navigation = await command('Page.navigate', { url: url.href })
      if (!navigation.loaderId) await command('Page.reload') // hash-only navigation keeps the document
      await waitFor(`!window.__drfOld && document.readyState === 'complete' && !!document.querySelector('.drf-ui')`)
      if (url.searchParams.get('mode') === 'immersive') await waitFor(`['ready','unavailable'].includes(document.querySelector('[data-scene-root]')?.dataset.sceneStatus)`, 300)
      await evaluate('document.fonts.ready.then(() => true)'); await frames()
    }
    const click = selector => evaluate(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return false; el.focus?.(); el.click(); return true })()`)
    const key = async name => {
      await command('Input.dispatchKeyEvent', { type: 'keyDown', key: name, code: name, windowsVirtualKeyCode: name === 'Escape' ? 27 : 0 })
      await command('Input.dispatchKeyEvent', { type: 'keyUp', key: name, code: name, windowsVirtualKeyCode: name === 'Escape' ? 27 : 0 })
    }
    const screenshot = async clip => (await command('Page.captureScreenshot', { format: 'png', ...(clip ? { clip: { ...clip, scale: 1 } } : {}) })).data
    return { command, evaluate, waitFor, frames, viewport, load, click, key, screenshot, errors, close }
  } catch (error) { close(); throw error }
}
