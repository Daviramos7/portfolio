// Mission 11 visible programme context: installed Chrome + native CDP.
import { spawn } from 'node:child_process'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { portfolioContent } from '../src/content/portfolio.ts'

// Run with compiled preview on 5175; override URL/Chrome/evidence directory via env.
const base = process.env.DRF_EDITORIAL_URL ?? 'http://127.0.0.1:5175/'
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

  const {mkdir}=await import('node:fs/promises')
  const directory=process.env.DRF_EDITORIAL_CAPTURE_DIR ?? 'C:/Users/davir/OneDrive/Documentos/GitHub/portfolio/.agent-grid/screenshots/mission-11-ui'
  await mkdir(directory,{recursive:true})
  const samples=[]
  const phase=process.env.DRF_EDITORIAL_PHASE ?? 'final'
  const check=(value,label)=>{if(!value)throw Error(label);checks.push(label)}
  const frames=()=>evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')
  const click=async selector=>{
    const p=await evaluate(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`)
    await command('Input.dispatchMouseEvent',{type:'mousePressed',...p,button:'left',clickCount:1})
    await command('Input.dispatchMouseEvent',{type:'mouseReleased',...p,button:'left',clickCount:1})
  }
  const shot=async name=>{await frames();const {data}=await command('Page.captureScreenshot',{format:'png'});await writeFile(directory+'/'+phase+'-'+name+'.png',Buffer.from(data,'base64'))}
  const key=async name=>{await command('Input.dispatchKeyEvent',{type:'keyDown',key:name,code:name,...(name==='Enter'?{text:'\r',windowsVirtualKeyCode:13}:{})});await command('Input.dispatchKeyEvent',{type:'keyUp',key:name,code:name})}
  await viewport(1440,900,false)
  await load('/?lang=pt&mode=immersive#garage/'+portfolioContent.projects[0].id)
  await click(':is(.drf-motion-control,.drf-hud-menu) > summary');await click('input[value=cinematic]');await key('Escape')
  await waitFor('document.querySelector(".drf-ui").dataset.reducedMotion==="false"')
  const diagnostic=await evaluate(`({scene:{...document.querySelector('[data-scene-root]').dataset},context:document.querySelector('.drf-showcase').textContent,rect:document.querySelector('.drf-showcase').getBoundingClientRect().toJSON(),summaryPresent:!!document.querySelector('.drf-program-summary'),stackPresent:!!document.querySelector('.drf-program-stack')})`)
  if(phase==='baseline') {
    await shot('selected-1440')
    await writeFile(directory+'/baseline-diagnostic.json',JSON.stringify(diagnostic,null,2))
    console.log(JSON.stringify(diagnostic,null,2))
  } else {
    await evaluate('window.__editorialCanvas=document.querySelector("canvas");true')
    for(const width of [1440,390,320]) {
      await viewport(width,width===1440?900:844,width!==1440)
      // M16 fila 15: no celular a ficha começa recolhida; o contexto completo é conferido com ela aberta.
      if(width!==1440){await waitFor('!!document.querySelector(".drf-showcase-toggle")');await evaluate('document.querySelector(".drf-showcase-toggle").getAttribute("aria-expanded")==="false"&&document.querySelector(".drf-showcase-toggle").click();true');await waitFor('document.querySelector(".drf-showcase-toggle").getAttribute("aria-expanded")==="true"')}
      for(const locale of ['pt','en']) {
        await evaluate(`document.querySelectorAll('.drf-hud-locale button')[${locale==='pt'?0:1}].click();true`)
        await waitFor(`document.querySelector('.drf-ui').lang===${JSON.stringify(locale)}`)
        for(const project of portfolioContent.projects) {
          await evaluate(`(()=>{const s=document.querySelector('#drf-program-select');s.value=${JSON.stringify(project.id)};s.dispatchEvent(new Event('change',{bubbles:true}))})()`)
          await waitFor(`document.querySelector('.drf-program-title').textContent===${JSON.stringify(project.title[locale])}`)
          await frames()
          const actual=await evaluate(`(()=>{const e=document.querySelector('.drf-program-context'),r=e.getBoundingClientRect();const nodes=[document.querySelector('.drf-program-title'),e.querySelector('.drf-program-summary'),...e.querySelectorAll('.drf-program-stack li'),...e.querySelectorAll('button,a')];const bounds=nodes.map(n=>{const b=n.getBoundingClientRect();return {text:n.textContent,top:b.top,bottom:b.bottom,left:b.left,right:b.right,unoccluded:n.contains(document.elementFromPoint(b.x+b.width/2,b.y+b.height/2))}});return {summary:e.querySelector('.drf-program-summary').textContent,stack:[...e.querySelectorAll('.drf-program-stack li')].map(x=>x.textContent),links:[...e.querySelectorAll('a')].map(x=>x.getAttribute('href')),bounds,inside:r.top>=0&&r.bottom<=innerHeight&&bounds.every(b=>b.unoccluded&&b.top>=0&&b.bottom<=innerHeight&&b.left>=0&&b.right<=innerWidth),stackOverflow:e.querySelector('.drf-program-stack').scrollWidth>e.querySelector('.drf-program-stack').clientWidth,caseVisible:e.querySelector('button').getBoundingClientRect().bottom<=innerHeight}})()`)
          samples.push({width,locale,projectId:project.id,...actual});check(actual.summary===project.summary[locale] && JSON.stringify(actual.stack)===JSON.stringify(project.technologies.slice(0,6)),`catalogue summary and card stack (first 6) ${width}/${locale}/${project.id}`)
          check(actual.inside&&actual.caseVisible&&!actual.stackOverflow&&await noOverflow(),`context and case fit ${width}/${locale}/${project.id}`)
          check(JSON.stringify(actual.links)===JSON.stringify([project.repositoryUrl,project.demoUrl].filter(Boolean)),`only real links ${width}/${locale}/${project.id}`)
          await evaluate('Promise.all(document.querySelector(".drf-program-identity").getAnimations({subtree:true}).map(a=>a.finished)).then(()=>true)');await shot(`${width}-${locale}-${project.id}`)
        }
      }
    }
    check(await evaluate('document.querySelector("canvas")===window.__editorialCanvas'),'selection/locale preserve canvas')
    await command('Page.navigateToHistoryEntry',{entryId:(await command('Page.getNavigationHistory')).entries.at(-2).id})
    await waitFor(`document.querySelector('.drf-program-title').textContent===${JSON.stringify(portfolioContent.projects.at(-2).title.en)}`)
    check(true,'history restores programme and visible context')
    await click('.drf-program-context button')
    await waitFor('!!document.querySelector("#drf-reading-title")')
    check(await evaluate('document.querySelector("#drf-reading-title").textContent===document.querySelector(".drf-program-title").textContent'),'case opens selected record')
    await key('Escape');await frames()
    check(await evaluate('document.activeElement===document.querySelector(".drf-program-context button")'),'Escape restores case trigger focus')
    await click(':is(.drf-motion-control,.drf-hud-menu) > summary');await click('input[value=reduced]');await key('Escape')
    await waitFor('document.querySelector(".drf-ui").dataset.reducedMotion==="true"')
    check(await evaluate('getComputedStyle(document.querySelector(".drf-program-title > span")).animationName==="none"'),'reduced title remains static')
    await shot('reduced-320')
    await command('Page.addScriptToEvaluateOnNewDocument',{source:'const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/i.test(type)?null:original.call(this,type,...args)}'})
    await load('/?lang=en&mode=immersive#garage/'+portfolioContent.projects[0].id)
    check(await evaluate('document.querySelector("[data-scene-root]").dataset.sceneStatus==="unavailable" && !!document.querySelector(".drf-program-context button")'),'context available without WebGL')
    await shot('fallback-320')
    await click('.drf-recruiter-switch')
    await waitFor('document.querySelector(".drf-ui").dataset.viewMode==="recruiter"')
    check(await evaluate(`!!document.querySelector('a[href="${portfolioContent.profile.cvUrl}"]')`),'existing public CV remains available')
    for (const locale of ['pt', 'en']) {
      await click(`.drf-segment button[aria-label="${locale === 'pt' ? 'Português' : 'English'}"]`)
      await waitFor(`document.querySelector('.drf-ui').lang===${JSON.stringify(locale)}`)
      const contacts = await evaluate(`(()=>{const links=[...document.querySelectorAll('a')].filter(a=>a.href.includes('linkedin.com'));return {links:links.map(a=>({href:a.href,target:a.target,rel:a.rel})),education:document.body.textContent.includes(${JSON.stringify(portfolioContent.profile.education[0][locale])})}})()`)
      check(contacts.links.length > 0 && contacts.links.every(link => link.href === 'https://www.linkedin.com/in/daviramosferreira' && link.target === '_blank' && link.rel.includes('noopener')), `profile and footer use owner-confirmed LinkedIn ${locale}`)
      check(contacts.education, `owner-confirmed semester and graduation rendered ${locale}`)
    }
    check(errors.length===0,'no console/network errors')
    await writeFile(directory+'/results.json',JSON.stringify({checks,errors,diagnostic,samples},null,2))
    console.log(JSON.stringify({checks:checks.length,errors,directory},null,2))
  }
} finally {socket?.close();chrome.kill()}
