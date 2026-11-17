// Mission 13: default/selected programme context and real first-fold visibility.
import { spawn } from 'node:child_process'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { portfolioContent } from '../src/content/portfolio.ts'

// Run with compiled preview on 5175; override URL/Chrome/evidence directory via env.
const base = process.env.DRF_IDENTITY_URL ?? 'http://127.0.0.1:5175/'
const chromePath = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const profile = await mkdtemp(join(tmpdir(), 'drf-foundation-'))
const chrome = spawn(chromePath, [...(process.env.DRF_IDENTITY_PHASE==='specimen'?['--allow-file-access-from-files']:[]),'--headless=new', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] })
let socket
const pending = new Map()
let nextId = 0
let sessionId
const errors = []
const checks = []
const fontResponses = []

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
    if (message.method === 'Network.responseReceived' && /\.woff2(?:\?|$)/.test(message.params.response.url)) fontResponses.push({ url: message.params.response.url, status: message.params.response.status })
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
  const directory=process.env.DRF_M13_CAPTURE_DIR ?? 'C:/Users/davir/OneDrive/Documentos/GitHub/portfolio/.agent-grid/screenshots/mission-13/ui-after'
  await mkdir(directory,{recursive:true})
  const phase='after'
  const check=(value,label)=>{if(!value)throw Error(label);checks.push(label)}
  const frames=()=>evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')
  const finish=()=>evaluate('Promise.all(document.querySelector(".drf-ui").getAnimations({subtree:true}).filter(a=>a.effect.getTiming().iterations!==Infinity).map(a=>a.finished)).then(()=>true)')
  const click=async selector=>{
    const p=await evaluate(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`)
    await command('Input.dispatchMouseEvent',{type:'mousePressed',...p,button:'left',clickCount:1});await command('Input.dispatchMouseEvent',{type:'mouseReleased',...p,button:'left',clickCount:1})
  }
  const key=async name=>{await command('Input.dispatchKeyEvent',{type:'keyDown',key:name,code:name,...(name==='Enter'?{text:'\r',windowsVirtualKeyCode:13}:{})});await command('Input.dispatchKeyEvent',{type:'keyUp',key:name,code:name})}
  const shot=async name=>{await frames();const {data}=await command('Page.captureScreenshot',{format:'png'});await writeFile(directory+'/'+phase+'-'+name+'.png',Buffer.from(data,'base64'))}
  const fonts=[]
  await command('DOM.enable');await command('CSS.enable')
  const samples=[]
  const context=async(project,locale,label)=>{
    const result=await evaluate(`(()=>{
      const root=document.querySelector('.drf-showcase');
      const elements=[...root.querySelectorAll('.drf-program-title,.drf-program-summary,.drf-program-stack li,.drf-program-context-actions button,.drf-program-context-actions a')];
      const rect=root.getBoundingClientRect();
      return {title:root.querySelector('.drf-program-title').textContent,summary:root.querySelector('.drf-program-summary').textContent,stack:[...root.querySelectorAll('.drf-program-stack li')].map(e=>e.textContent),links:[...root.querySelectorAll('.drf-program-context-actions a')].map(e=>e.getAttribute('href')),height:rect.height,tagSize:parseFloat(getComputedStyle(root.querySelector('.drf-program-stack li')).fontSize),visible:elements.every(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&r.top>=rect.top&&r.bottom<=rect.bottom&&r.left>=rect.left&&r.right<=rect.right&&e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2))})}
    })()`)
    check(result.title===project.title[locale]&&result.summary===project.summary[locale],label+' canonical title/summary')
    check(JSON.stringify(result.stack)===JSON.stringify(project.technologies.slice(0,6)),label+' card technologies (first 6)')
    check(JSON.stringify(result.links)===JSON.stringify([project.repositoryUrl,project.demoUrl].filter(Boolean)),label+' exact real links')
    check(result.visible&&result.tagSize>=13,label+' visible and readable context')
    check(await noOverflow(),label+' no overflow')
    return result
  }
  for(const width of [1440,390,320]){
    await viewport(width,width===1440?900:844,width!==1440)
    for(const locale of ['pt','en']){
      await load('/?lang='+locale+'&mode=immersive#garage')
      await click(':is(.drf-motion-control,.drf-hud-menu) > summary');await click('input[value=cinematic]');await key('Escape');await finish()
      // M16 fila 15: no celular a ficha começa recolhida; o contexto completo é conferido com ela aberta.
      if(width!==1440){check(await evaluate('document.querySelector(".drf-showcase-toggle").getAttribute("aria-expanded")==="false"'),'programs sheet collapsed by default '+width+'/'+locale);await click('.drf-showcase-toggle');await finish()}
      const defaults=await context(portfolioContent.projects[0],locale,'default '+width+'/'+locale)
      check(await evaluate('location.hash==="#garage"'),'default context does not force URL selection')
      await shot('default-'+width+'-'+locale)
      if(width!==1440){
        check(await evaluate('!document.querySelector(".drf-hud-menu").open'),'secondary controls collapsed by default')
        check(await evaluate(`document.querySelector('#drf-ambient-toggle small').textContent===${JSON.stringify(locale==='pt'?'Ativado':'Enabled')}`),'menu reports actual Cinematic ambience')
        await click('.drf-hud-menu summary')
        check(await evaluate('document.querySelector("#drf-audio-toggle").getBoundingClientRect().height>=44 && document.querySelector("#drf-ambient-toggle").getBoundingClientRect().height>=44'),'environment controls accessible at 44px')
        await key('Escape')
        check(await evaluate('document.activeElement===document.querySelector(".drf-hud-menu summary")'),'environment Escape restores focus')
      }
      for(const project of portfolioContent.projects){
        const cameraSequence=await evaluate('Number(document.querySelector("canvas").dataset.sceneCameraSeq)')
        await evaluate(`(()=>{const select=document.querySelector('#drf-program-select');select.value=${JSON.stringify(project.id)};select.dispatchEvent(new Event('change',{bubbles:true}))})()`)
        await waitFor('Number(document.querySelector("canvas")?.dataset.sceneCameraSeq)>'+cameraSequence)
        await finish()
        const closed=await context(project,locale,width+'/'+locale+'/'+project.id)
        await shot('program-'+width+'-'+locale+'-'+project.id)
        await evaluate('window.__m13canvas=document.querySelector("canvas");true')
        await click('#drf-open-case');await waitFor('!!document.querySelector(".drf-case-pane")');await finish()
        if(width!==1440) check(await evaluate(`document.querySelector('#drf-ambient-toggle small').textContent.includes(${JSON.stringify(locale==='pt'?'Pausado':'Paused')})`),'menu reports reading pause')
        const reading=await evaluate(`(()=>{
          const body=document.querySelector('.drf-workstation-body'),r=body.getBoundingClientRect(),tabs=document.querySelector('.drf-case-tab-list').getBoundingClientRect();
          const elements=[body.querySelector('.drf-lead'),...body.querySelectorAll('.drf-chips li')];
          return {scrollTop:body.scrollTop,height:r.height,contentHeight:body.scrollHeight,visible:elements.every(e=>{const q=e.getBoundingClientRect();return q.top>=tabs.bottom&&q.bottom<=r.bottom&&e.contains(document.elementFromPoint(q.x+q.width/2,q.y+q.height/2))}),stack:[...body.querySelectorAll('.drf-chips li')].map(e=>e.textContent)}
        })()`)
        check(reading.scrollTop===0 && reading.visible,width+'/'+locale+'/'+project.id+' summary and all tags in initial case fold')
        check(JSON.stringify(reading.stack)===JSON.stringify(project.technologies),'case preserves all technologies')
        check(await evaluate('document.querySelector("canvas")===window.__m13canvas'),'case preserves canvas')
        await shot('case-'+width+'-'+locale+'-'+project.id)
        await key('Escape');await frames()
        check(await evaluate('document.activeElement?.id==="drf-open-case"'),'case Escape restores focus')
        samples.push({width,locale,projectId:project.id,defaults,closed,reading})
      }
      await click('.drf-recruiter-switch');await waitFor('document.querySelector(".drf-ui").dataset.viewMode==="recruiter"')
      await evaluate('scrollTo(0,0);true');await shot('recruiter-'+width+'-'+locale)
      check(await evaluate('[...document.querySelectorAll(".drf-dossiers>.drf-project-card")].every(card=>card.querySelectorAll(":scope > .drf-card-top .drf-tag, :scope > .drf-project-detail > .drf-tag").length===1)'),'single qualification per Recruiter case, metric states preserved')
      check(await noOverflow(),'Recruiter no overflow')
    }
  }
  await viewport(320,844,true);await load('/?lang=en&mode=immersive#garage')
  check(await evaluate('document.querySelector(".drf-ui").dataset.reducedMotion==="true"'),'native reduced preserved')
  check(await evaluate('document.querySelector("#drf-ambient-toggle small").textContent.includes("Restricted")'),'menu reports effective system restriction')
  await click('.drf-showcase-toggle');await finish() // M16 fila 15: ficha recolhida por padrão no celular
  await context(portfolioContent.projects[0],'en','reduced default');await shot('reduced-default-320-en')
  await command('Page.addScriptToEvaluateOnNewDocument',{source:'const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/i.test(type)?null:original.call(this,type,...args)}'})
  await load('/?lang=pt&mode=immersive#garage')
  check(await evaluate('document.querySelector("[data-scene-root]").dataset.sceneStatus==="unavailable"'),'fallback fixture active')
  // Fallback notice deliberately covers the centre; reading remains an explicit action.
  await evaluate('document.querySelector("#drf-open-case").click();true');await waitFor('!!document.querySelector(".drf-case-pane")')
  check(await evaluate('document.querySelectorAll(".drf-case-stack .drf-chips li").length==='+portfolioContent.projects[0].technologies.length),'default case content accessible without WebGL')
  await shot('fallback-case-320-pt')
  await writeFile(directory+'/results.json',JSON.stringify({checks,errors,samples,fontResponses},null,2))
  check(errors.length===0,'no console/network errors: '+JSON.stringify(errors))
  console.log(JSON.stringify({checks:checks.length,errors,directory},null,2))
}finally{socket?.close();chrome.kill()}
