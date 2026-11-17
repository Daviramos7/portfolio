// Mission 12 identity, reading and provenance: installed Chrome + native CDP.
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
  const directory=process.env.DRF_IDENTITY_CAPTURE_DIR ?? 'C:/Users/davir/OneDrive/Documentos/GitHub/portfolio/.agent-grid/screenshots/mission-12-ui'
  await mkdir(directory,{recursive:true})
  const phase=process.env.DRF_IDENTITY_PHASE ?? 'after'
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
  if(phase==='dev'){
    const {createHash}=await import('node:crypto')
    const {readFile}=await import('node:fs/promises')
    const fixture=label=>{
      const stream=`BT /F1 18 Tf 40 740 Td (${label}) Tj ET`
      const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`]
      let pdf='%PDF-1.4\n';const offsets=[0]
      objects.forEach((object,index)=>{offsets.push(Buffer.byteLength(pdf));pdf+=`${index+1} 0 obj\n${object}\nendobj\n`})
      const xref=Buffer.byteLength(pdf)
      pdf+=`xref\n0 6\n0000000000 65535 f \n${offsets.slice(1).map(offset=>String(offset).padStart(10,'0')+' 00000 n ').join('\n')}\ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`
      return Buffer.from(pdf)
    }
    const bytes=fixture('LOCAL REVIEW FIXTURE - NOT A RESUME')
    const file=join(profile,'local-review-fixture.pdf'),second=join(profile,'second-review-fixture.pdf')
    await writeFile(file,bytes);await writeFile(second,fixture('SECOND LOCAL REVIEW FIXTURE'))
    await command('Page.addScriptToEvaluateOnNewDocument',{source:'window.__reviewRevoked=[];const original=URL.revokeObjectURL;URL.revokeObjectURL=function(url){window.__reviewRevoked.push(url);return original.call(this,url)}'})
    await viewport(390,844,true);await load('/?lang=pt&mode=recruiter#garage')
    check(await evaluate('!document.querySelector("#drf-cv-file")'),'DEV without query does not expose draft input')
    await load('/?lang=pt&mode=recruiter&cv-review=1#garage')
    await waitFor('!!document.querySelector("#drf-cv-file")')
    check(await evaluate('document.querySelector("#drf-cv-review-title").textContent.includes("RASCUNHO")'),'DEV review explicitly says unapproved draft')
    const doc=await command('DOM.getDocument');const input=await command('DOM.querySelector',{nodeId:doc.root.nodeId,selector:'#drf-cv-file'})
    await command('DOM.setFileInputFiles',{nodeId:input.nodeId,files:[file]})
    await waitFor('!!document.querySelector(".drf-cv-review a[download]")')
    const first=await evaluate('document.querySelector(".drf-cv-review a[download]").href')
    const downloadDir=join(profile,'downloads');await mkdir(downloadDir,{recursive:true})
    await command('Page.setDownloadBehavior',{behavior:'allow',downloadPath:downloadDir})
    await evaluate('document.querySelector(".drf-cv-review a[download]").click();true')
    let downloaded
    for(let attempt=0;attempt<40;attempt++){try{downloaded=await readFile(join(downloadDir,'draft-local-review-fixture.pdf'));break}catch{await new Promise(r=>setTimeout(r,100))}}
    check(downloaded && createHash('sha256').update(downloaded).digest('hex')===createHash('sha256').update(bytes).digest('hex'),'actual local draft download preserves fixture bytes')
    await shot('local-review-390-pt')
    await command('DOM.setFileInputFiles',{nodeId:input.nodeId,files:[second]})
    await waitFor('document.querySelector(".drf-cv-review a[download]").download==="draft-second-review-fixture.pdf"')
    check(await evaluate(`window.__reviewRevoked.includes(${JSON.stringify(first)})`),'replacement revokes previous objectURL')
    const current=await evaluate('document.querySelector(".drf-cv-review a[download]").href')
    await evaluate('document.querySelector("#drf-return-garage").click();true')
    await waitFor('document.querySelector(".drf-ui").dataset.viewMode==="immersive"')
    check(await evaluate(`window.__reviewRevoked.includes(${JSON.stringify(current)})`),'unmount revokes current objectURL')
    check(await evaluate('!document.querySelector("#drf-cv-file")'),'draft input absent outside Recruiter')
    check(fontResponses.some(response=>response.url.includes('barlow-condensed') && response.status===200),'DEV display font request returns 200')
    check(fontResponses.some(response=>response.url.includes('geist') && response.status===200),'DEV junction Geist font request returns 200')
  }else if(phase==='specimen'){
    const {pathToFileURL}=await import('node:url');const {resolve}=await import('node:path')
    await viewport(1440,1100,false)
    await command('Page.navigate',{url:pathToFileURL(resolve('docs/design/typography-specimen.html')).href})
    await waitFor('document.readyState==="complete"')
    await evaluate('document.fonts.ready.then(()=>true)')
    check(await evaluate('document.fonts.check(\'700 36px "Barlow Condensed"\',"ÁÀÂÃÇÉÊÍÓÔÕÚ")'),'specimen display loaded with PT accents')
    await shot('typography-specimen')
  }else{
    for(const width of [1440,390,320]){
      await viewport(width,width===1440?900:844,width!==1440)
      for(const locale of ['pt','en']){
        await load('/?lang='+locale+'&mode=immersive#garage/atleta-hibrido')
        await click(':is(.drf-motion-control,.drf-hud-menu) > summary');await click('input[value=cinematic]');await key('Escape');await finish()
        if(width!==1440){await click('.drf-showcase-toggle');await finish()} // M16 fila 15: ficha recolhida por padrão no celular
        fonts.push(await evaluate('({display:getComputedStyle(document.querySelector(".drf-program-title")).fontFamily,body:getComputedStyle(document.querySelector(".drf-program-summary")).fontFamily})'))
        check(await noOverflow(),'garage fits '+width+'/'+locale)
        await shot('garage-'+width+'-'+locale)
        await click('#drf-open-case');await waitFor('!!document.querySelector("#drf-reading-title")');await finish()
        await shot('case-'+width+'-'+locale)
        if(phase==='after'){
          const doc=await command('DOM.getDocument')
          const headline=await command('DOM.querySelector',{nodeId:doc.root.nodeId,selector:'#drf-reading-title'})
          const rendered=await command('CSS.getPlatformFontsForNode',{nodeId:headline.nodeId})
          check(rendered.fonts.some(f=>f.familyName==='Barlow Condensed'&&f.isCustomFont&&f.glyphCount>0),'actual Barlow glyphs rendered '+width+'/'+locale)
          check(await evaluate('document.querySelectorAll(".drf-case-tab-list [role=tab]").length===3'),'three case sections '+width+'/'+locale)
          await evaluate('window.__identityCanvas=document.querySelector("canvas");true')
          await shot('sequence-case-01-'+width+'-'+locale)
          await click('[data-case-tab=engineering]');await finish()
          const project=portfolioContent.projects.find(p=>p.id==='atleta-hibrido')
          check(await evaluate(`document.querySelector('[data-case-section=engineering]').textContent.includes(${JSON.stringify(project.decisions[0][locale])})`),'canonical decisions retained '+width+'/'+locale)
          await shot('sequence-case-02-'+width+'-'+locale)
          await evaluate('document.querySelector("[data-case-tab=engineering]").focus();true');await key('End');await finish()
          check(await evaluate('document.querySelector("[data-case-tab=evidence]").getAttribute("aria-selected")==="true" && document.activeElement.dataset.caseTab==="evidence"'),'keyboard End opens evidence '+width+'/'+locale)
          await shot('sequence-case-03-'+width+'-'+locale)
          for(const sourceId of project.evidenceIds){
            const source=portfolioContent.evidence.find(e=>e.id===sourceId)
            await click('[data-source-id="'+sourceId+'"]')
            check(await evaluate(`document.querySelector('.drf-source-detail').textContent.includes(${JSON.stringify(source.label[locale])}) && document.querySelector('.drf-source-detail').dataset.sourceSelected===${JSON.stringify(sourceId)}`),'individual source record '+width+'/'+locale+'/'+sourceId)
            check(await evaluate(`document.querySelector('.drf-source-detail a')?.getAttribute('href')===${JSON.stringify(source.publicUrl??undefined)}`),'source link is real or omitted '+width+'/'+locale+'/'+sourceId)
            await shot('sequence-source-'+sourceId+'-'+width+'-'+locale)
          }
          check(await evaluate('document.querySelector("canvas")===window.__identityCanvas'),'case and source inspection preserve canvas '+width+'/'+locale)
          check(await noOverflow(),'case tabs and sources fit '+width+'/'+locale)
          check(await evaluate('getComputedStyle(document.querySelector("#drf-reading-title")).fontFamily.includes("Barlow Condensed")'),'display font applied '+width+'/'+locale)
          check(await evaluate('getComputedStyle(document.querySelector(".drf-program-summary")).fontFamily.includes("Geist")'),'body remains readable Geist '+width+'/'+locale)
        }
        await key('Escape');await frames()
        check(await evaluate('document.activeElement?.id==="drf-open-case"'),'case Escape focus '+width+'/'+locale)
        await click('.drf-recruiter-switch');await waitFor('document.querySelector(".drf-ui").dataset.viewMode==="recruiter"');await evaluate('scrollTo(0,0);true')
        await shot('recruiter-'+width+'-'+locale)
        check(await evaluate(`!!document.querySelector('a[href="${portfolioContent.profile.cvUrl}"]')`),'public CV preserved '+width+'/'+locale)
        check(await noOverflow(),'recruiter fits '+width+'/'+locale)
      }
    }
    await viewport(1440,900,false);await load('/?lang=pt&mode=immersive#garage')
    await click(':is(.drf-motion-control,.drf-hud-menu) > summary');await click('input[value=cinematic]');await key('Escape')
    for(const [i,zone]of portfolioContent.zones.entries()){
      await click('.drf-hud-nav button:nth-child('+(i+1)+')');await frames();await click('#drf-inspect');await waitFor('!!document.querySelector("#drf-reading-title")');await finish()
      await shot('station-'+zone.id+'-1440-pt');check(await noOverflow(),'station fits '+zone.id);await key('Escape');await frames()
    }
  }
  if(phase==='after'){
    await viewport(390,844,true);await load('/?lang=en&mode=immersive#telemetry')
    await click('#drf-inspect');await waitFor('!!document.querySelector(".drf-telemetry-instrument")')
    await command('Browser.grantPermissions',{origin:new URL(base).origin,permissions:['clipboardReadWrite','clipboardSanitizedWrite']},false)
    await shot('sequence-copy-01-390-en')
    await click('[aria-label="Copy measurement and context"]')
    await waitFor('document.querySelector(".drf-copy-feedback")?.textContent.includes("copied")')
    const receipt=await evaluate('navigator.clipboard.readText()')
    const metric=portfolioContent.metrics[0]
    check(receipt.includes(metric.label.en)&&receipt.includes(metric.period.en)&&receipt.includes(metric.context.en),'clipboard contains final measurement and complete context')
    check(receipt.includes(new Intl.NumberFormat('en-US',{maximumFractionDigits:20}).format(metric.value)),'clipboard contains exact documented number')
    for(const source of portfolioContent.evidence.filter(e=>metric.evidenceIds.includes(e.id))) check(receipt.includes(source.label.en),'clipboard source identifiable '+source.id)
    await shot('sequence-copy-02-390-en')
    await evaluate('window.__originalClipboardWrite=navigator.clipboard.writeText;navigator.clipboard.writeText=()=>Promise.reject(new Error("fixture denied"));true')
    await click('[aria-label="Copy measurement and context"]')
    await waitFor('document.querySelector(".drf-copy-feedback")?.textContent.includes("Could not")')
    check(await evaluate('!document.querySelector(".drf-copy-feedback").textContent.includes("copied")'),'clipboard rejection never reports success')
    await evaluate('navigator.clipboard.writeText=window.__originalClipboardWrite;true')
    await evaluate('document.querySelector(".drf-instrument-toolbar button:nth-child(2)").click();true')
    check(await evaluate('!document.querySelector(".drf-copy-feedback")'),'copy feedback clears on metric selection')
    check(await noOverflow(),'expanded toolbar fits 390')
    await key('Escape');await frames()
    await click(':is(.drf-motion-control,.drf-hud-menu) > summary');await click('input[value=reduced]');await key('Escape')
    await click('.drf-hud-nav button:first-child');await frames()
    await evaluate('(()=>{const s=document.querySelector("#drf-program-select");s.value="atleta-hibrido";s.dispatchEvent(new Event("change",{bubbles:true}))})()')
    await evaluate('document.querySelector(".drf-showcase-toggle")?.getAttribute("aria-expanded")==="false"&&document.querySelector(".drf-showcase-toggle").click();true');await finish() // M16 fila 15
    await click('#drf-open-case');await waitFor('!!document.querySelector(".drf-case-pane")')
    check(await evaluate('getComputedStyle(document.querySelector(".drf-case-pane")).animationName==="none"'),'reduced case transition is static')
    await shot('reduced-case-390-en')
    await command('Page.addScriptToEvaluateOnNewDocument',{source:'const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/i.test(type)?null:original.call(this,type,...args)}'})
    await load('/?lang=en&mode=immersive#garage/atleta-hibrido');await click('.drf-showcase-toggle');await finish();await click('#drf-open-case');await waitFor('!!document.querySelector(".drf-case-pane")')
    await click('[data-case-tab=evidence]')
    check(await evaluate('document.querySelector("[data-scene-root]").dataset.sceneStatus==="unavailable" && !!document.querySelector(".drf-source-detail")'),'new reading interactions work without WebGL')
    await shot('fallback-evidence-390-en')
    await click('.drf-recruiter-switch');await waitFor('document.querySelector(".drf-ui").dataset.viewMode==="recruiter"')
    await load('/?lang=en&mode=recruiter&cv-review=1#garage')
    check(await evaluate('!document.querySelector("#drf-cv-file")'),'production hides local PDF input even with review query')
    const {readFile}=await import('node:fs/promises');const {createHash}=await import('node:crypto')
    const publicBytes=await readFile(join('public',portfolioContent.profile.cvUrl.replace(/^\//,'')))
    const publicHash=await evaluate(`fetch(${JSON.stringify(portfolioContent.profile.cvUrl)}).then(r=>r.arrayBuffer()).then(b=>crypto.subtle.digest('SHA-256',b)).then(h=>[...new Uint8Array(h)].map(x=>x.toString(16).padStart(2,'0')).join(''))`)
    check(publicHash===createHash('sha256').update(publicBytes).digest('hex'),'existing public PDF GET preserves canonical bytes')
    check(await evaluate('!document.querySelector(".drf-case-tab-list") && document.querySelectorAll(".drf-dossiers .drf-project-card").length===10'),'Recruiter preserves ten complete linear cases')
  }
  await writeFile(directory+'/'+phase+'-identity-results.json',JSON.stringify({checks,errors,fonts,fontResponses},null,2))
  check(errors.length===0,'no console/network errors: '+JSON.stringify(errors))
  console.log(JSON.stringify({checks:checks.length,errors,fonts,directory},null,2))
}finally{socket?.close();chrome.kill()}
