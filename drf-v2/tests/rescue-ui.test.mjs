// Smoke local sem dependências: Chrome headless + protocolo de depuração nativo.
// Uso: node tests/browser-smoke.mjs [URL] [caminho do Chrome]
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

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
    const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)) }, 5000)
    pending.set(id, { done, reject, timeout })
    socket.send(JSON.stringify({ id, method, params, ...(attached && sessionId ? { sessionId } : {}) }))
  })
  const target = await command('Target.createTarget', { url: 'about:blank' }, false)
  sessionId = (await command('Target.attachToTarget', { targetId: target.targetId, flatten: true }, false)).sessionId
  await command('Runtime.enable')
  await command('Page.enable'); await command('Log.enable'); await command('Network.enable')
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
    await waitFor('!!document.querySelector(".drf-ui")')
  }
  const noOverflow = () => evaluate('document.documentElement.scrollWidth <= window.innerWidth')

  const {mkdir}=await import('node:fs/promises');const directory=(process.env.DRF_RESCUE_CAPTURE_DIR ?? join(tmpdir(), 'drf-rescue-ui'))+'/';await mkdir(directory,{recursive:true});const shot=async n=>{const{data}=await command('Page.captureScreenshot',{format:'png'});await writeFile(directory+n+'.png',Buffer.from(data,'base64'))};
  const assert=(v,m)=>{if(!v)throw Error(m);checks.push(m)};
  for(const width of [1440,390,320]){
    await viewport(width,width===1440?900:844,width!==1440);await load('/?lang=pt&mode=immersive#garage');
    await evaluate('document.querySelector(".drf-motion-control summary").click();true');
    await waitFor('document.querySelector(".drf-motion-control").open');
    assert(await evaluate('document.querySelector("input[value=system]").checked'), 'system default '+width);
    assert(await evaluate('document.querySelector(".drf-motion-options").getBoundingClientRect().right<=innerWidth && document.querySelector(".drf-motion-options").getBoundingClientRect().left>=0'), 'motion panel fits '+width);
    await shot('after-motion-system-'+width);
    await evaluate('document.querySelector("input[value=cinematic]").click();true');await waitFor('document.querySelector(".drf-ui").dataset.reducedMotion === "false"');
    assert(await evaluate('document.querySelector("#drf-audio-toggle").getAttribute("aria-pressed")==="false"'),'motion does not enable audio '+width);
    await evaluate('document.querySelector("input[value=reduced]").click();true');await waitFor('document.querySelector(".drf-ui").dataset.reducedMotion === "true"');
    await evaluate('document.querySelector("input[value=reduced]").focus();true');await command('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape'});await command('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape'});
    assert(await evaluate('!document.querySelector(".drf-motion-control").open && document.activeElement.matches(".drf-motion-control summary")'),'Escape returns focus '+width);
    assert(await noOverflow(),'no horizontal overflow '+width);
    await load('/?lang=en&mode=recruiter#driver-profile');
    assert(await evaluate('Array.from(document.querySelectorAll("a[download]")).some(e=>e.textContent.includes("Download résumé"))'),'English public CV '+width);
    await shot('after-recruiter-cv-'+width);
  }
  assert(await evaluate('(async()=>{const r=await fetch(document.querySelector("a[download]").href);return r.ok && (await r.text()).startsWith("%PDF-")})()'),'public PDF responds with PDF');
  await load('/?lang=en&mode=immersive#telemetry');await evaluate('document.querySelector(".drf-motion-control summary").click();true');await shot('after-motion-en-320');
  assert(await evaluate(`document.querySelector("input[value=cinematic]").parentElement.textContent.includes("Cinematic")`), 'English motion label');await command('Page.addScriptToEvaluateOnNewDocument', {source: 'const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/i.test(type)?null:original.call(this,type,...args)}'});await load('/?lang=en&mode=immersive#strategy-room');await waitFor(`document.querySelector(".drf-ui").dataset.reducedMotion === "true"`);await evaluate(`document.querySelector("#drf-inspect").click();true`);await waitFor(`!!document.querySelector("#drf-reading-title")`);assert(await evaluate(`document.querySelector("#drf-reading-title").textContent.length>0`),'HTML reading without WebGL');await shot('after-fallback-strategy-320');assert(errors.length===0,'no console/network errors');console.log(JSON.stringify({checks,errors,directory},null,2));
}finally{socket?.close();chrome.kill()}
