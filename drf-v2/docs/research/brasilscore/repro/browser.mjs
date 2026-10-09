import { pathToFileURL } from 'node:url';
import { mkdirSync, writeFileSync } from 'node:fs';
import { spawn, execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { startLab } from './local-api.mjs';
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE_PATH).href);
const output = process.env.LAB_OUTPUT;
mkdirSync(output, { recursive: true });
const result = { conditions: 'synthetic demo only; actual local Express upstream; Vite copied proxy 5281; Chrome headless; Sao Paulo; reduced motion', screens: [], checks: [], pageErrors: [], consoleErrors: [], blockedExternalUrls: [], failedResources: [], httpErrors: [] };
const lab = await startLab();
const startup = performance.now();
const vite = spawn(process.execPath, ['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5280','--strictPort'], { windowsHide: true, stdio: 'ignore' });
let browser;
const save = () => writeFileSync(output + '/browser-results.json', JSON.stringify(result,null,2));
async function capture(page,name) {
  await page.waitForLoadState('networkidle');
  await page.screenshot({path:output+'/'+name+'.png',fullPage:true});
  const size=await page.evaluate(()=>({viewport:innerWidth,document:document.documentElement.scrollWidth}));
  const brokenImages=await page.locator('img').evaluateAll(images=>images.filter(i=>i.complete&&i.naturalWidth===0).map(i=>({src:i.currentSrc||i.src,alt:i.alt})));
  result.screens.push({name,...size,brokenImages,pass:size.document<=size.viewport}); save();
}
async function focusCheck(page,name) {
  const values=[];for(let i=0;i<5;i++){await page.keyboard.press('Tab');values.push(await page.evaluate(()=>({id:document.activeElement.id,tag:document.activeElement.tagName,documentHasFocus:document.hasFocus(),inDialog:Boolean(document.activeElement.closest('dialog')),outsideInteractive:document.activeElement.matches('a,button,input,select,textarea,[tabindex]')&&!document.activeElement.closest('dialog')})));}
  result.checks.push({name,tabSamples:values,pass:values.every(v=>!v.outsideInteractive),limit:'BODY/browser focus is not proof of background interaction; only tests no focusable background control received Tab; no full trap claim'});save();
}
try {
  for(let i=0;i<100;i++){try{const r=await fetch('http://127.0.0.1:5280');if(r.ok){result.startup={httpStatus:r.status,readinessMs:performance.now()-startup};break;}}catch{} await new Promise(r=>setTimeout(r,100));}
  assert(result.startup,'Vite readiness timeout');
  browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH});
  for(const [width,height] of [[1440,1000],[390,844]]){
    const context=await browser.newContext({viewport:{width,height},locale:'pt-BR',timezoneId:'America/Sao_Paulo',reducedMotion:'reduce'});
    await context.route('**/*',route=>{const url=new URL(route.request().url());if(url.origin==='http://127.0.0.1:5280')return route.continue();result.blockedExternalUrls.push(url.href);return route.abort();});
    const page=await context.newPage();
    page.on('pageerror',e=>result.pageErrors.push({width,url:page.url(),message:e.message}));
    page.on('console',m=>{if(m.type()==='error')result.consoleErrors.push({width,url:page.url(),text:m.text(),location:m.location()});});
    page.on('requestfailed',r=>result.failedResources.push({url:r.url(),reason:r.failure()?.errorText}));
    page.on('response',r=>{if(r.status()>=400)result.httpErrors.push({url:r.url(),status:r.status()});});
    page.on('dialog',d=>d.accept());
    await page.goto('http://127.0.0.1:5280/registre.html');
    await page.locator('#name').fill('Pessoa Sintética');await page.locator('#email').fill('fixture@example.test');await page.locator('#password').fill('synthetic-demo-only');await page.getByRole('button',{name:'Cadastrar',exact:true}).click();
    await page.locator('#popupModal[open]').waitFor();await focusCheck(page,`${width}-registration-dialog`);await page.getByRole('button',{name:'Fechar',exact:true}).click();await page.waitForURL('**/profile.html');
    assert.equal(await page.locator('#profileUsername').inputValue(),'Pessoa Sintética');
    await page.locator('#profileUsername').fill('Perfil Sintético');await page.getByRole('button',{name:'Salvar Alterações'}).click();await page.locator('#popupModal[open]').waitFor();await page.getByRole('button',{name:'Fechar',exact:true}).click();
    result.checks.push({name:`${width}-register-profile`,pass:await page.evaluate(()=>JSON.parse(localStorage.getItem('session')).name==='Perfil Sintético')});
    await page.goto('http://127.0.0.1:5280/main.html');await page.locator('#leagueSelect').selectOption('serie-a');await page.locator('.standings-table tbody tr').first().waitFor();assert.equal(await page.locator('.standings-table tbody tr').count(),20);await capture(page,`${width}-standings`);
    await page.goto('http://127.0.0.1:5280/search.html');await page.locator('#searchInput').fill('sao');await page.locator('#searchForm button').click();await page.locator('.team-card').waitFor();assert.equal(await page.locator('.team-card').count(),1);
    const cacheBefore=lab.state.calls;await page.locator('#searchForm button').click();await page.waitForTimeout(80);result.checks.push({name:`${width}-search-cache`,pass:lab.state.calls===cacheBefore});
    await page.locator('.favorite-btn').click();assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('users'))[0].favorites.teams.length),1);await capture(page,`${width}-search-favorite`);
    await page.goto('http://127.0.0.1:5280/favorites.html');await page.locator('.card.team-card').waitFor();await page.getByRole('button',{name:'Remover',exact:true}).click();assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('users'))[0].favorites.teams.length),0);result.checks.push({name:`${width}-favorites-add-remove`,pass:true});
    await page.goto('http://127.0.0.1:5280/profile.html');await page.locator('#logout-btn').click();await page.getByRole('button',{name:'Fechar',exact:true}).click();await page.waitForURL('**/index.html');assert.equal(await page.evaluate(()=>localStorage.getItem('session')),null);
    await page.locator('#email').fill('fixture@example.test');await page.locator('#password').fill('synthetic-demo-only');await page.getByRole('button',{name:'Entrar',exact:true}).click();await page.getByRole('button',{name:'Fechar',exact:true}).click();await page.waitForURL('**/main.html');result.checks.push({name:`${width}-demo-logout-login`,pass:true});
    // Empty successful API and known sanitized error are independent contexts.
    await page.goto('http://127.0.0.1:5280/search.html?query=inexistente');await page.locator('.no-results-message').waitFor();result.checks.push({name:`${width}-empty-search`,pass:true});
    lab.cache.clear();lab.state.mode='rate';await page.goto('http://127.0.0.1:5280/search.html?query=naocacheado');await page.locator('.no-results-message').waitFor();result.checks.push({name:`${width}-upstream-error-shown-as-empty`,pass:false,observed:await page.locator('.no-results-message').innerText(),condition:'upstream429 -> internal502; search catches and continues'});await capture(page,`${width}-upstream-error`);lab.state.mode='ok';lab.cache.clear();
    await context.close();save();
  }
} catch(error){result.harnessError={name:error.name,message:error.message};process.exitCode=1;}
finally{
  if(browser)await browser.close();
  if(vite.exitCode===null){try{execFileSync('taskkill',['/PID',String(vite.pid),'/T','/F'],{windowsHide:true,stdio:'ignore'});}catch{}}
  await lab.stop();result.ownedServersStopped=true;save();
}
const failures=result.checks.filter(c=>!c.pass);if(failures.length||result.screens.some(c=>!c.pass)||result.pageErrors.length)process.exitCode=1;
console.log(JSON.stringify({screens:result.screens.length,failedChecks:failures,pageErrors:result.pageErrors,ownedServersStopped:result.ownedServersStopped}));
