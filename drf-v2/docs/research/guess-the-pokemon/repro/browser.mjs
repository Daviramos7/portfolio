import http from 'node:http';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {performance} from 'node:perf_hooks';
import {pathToFileURL} from 'node:url';
const lab=process.cwd().replaceAll('\\','/');if(!lab.includes('labs/night-shift-audit/guess-the-pokemon'))throw Error('Authorized lab only');
const out=process.argv[2];mkdirSync(out,{recursive:true});
const {chromium}=await import(pathToFileURL(lab+'/tooling/node_modules/playwright-core/index.mjs').href);
const origin='http://127.0.0.1:5286';const names=['alpha','beta','gamma','delta'];const fixtures=names.map((name,i)=>({id:i+1,name,types:[{type:{name:['grass','water','fire','grass'][i]}}],sprites:{front_default:origin+'/synthetic-sprite.svg',other:{'official-artwork':{front_default:origin+'/synthetic-sprite.svg'}},versions:{'generation-v':{'black-white':{animated:{front_default:origin+'/synthetic-sprite.svg'}}}}}}));
writeFileSync(out+'/fixtures.json',JSON.stringify(fixtures,null,2));
let failBudget=0;const serverRequests=[];
const server=http.createServer((req,res)=>{const u=new URL(req.url,origin);serverRequests.push({path:u.pathname,query:u.search});
 if(u.pathname.startsWith('/api/v2/pokemon')){res.setHeader('Content-Type','application/json');
  if(failBudget>0){failBudget--;res.writeHead(503);res.end(JSON.stringify({error:'synthetic unavailable'}));return;}
  const key=u.pathname.split('/').filter(Boolean).at(-1);const payload=key==='pokemon'?{results:names.map(name=>({name}))}:fixtures.find(x=>x.name===key||String(x.id)===key);res.writeHead(payload?200:404);res.end(JSON.stringify(payload||{error:'synthetic not found'}));return;
 }
 if(u.pathname.endsWith('.svg')||u.pathname==='/img/pokedex.png'){res.setHeader('Content-Type','image/svg+xml');res.end(u.pathname.includes('sprite')?'<svg xmlns="http://www.w3.org/2000/svg" width="90" height="90"><circle cx="45" cy="45" r="35" fill="green"/></svg>':'<svg xmlns="http://www.w3.org/2000/svg" width="500" height="800"><rect width="500" height="800" fill="#eee"/><text x="80" y="40">SYNTHETIC LAB FRAME</text></svg>');return;}
 const files={'/':'index.html','/index.html':'index.html','/script.js':'script.js','/style.css':'style.css'};if(files[u.pathname]){res.setHeader('Content-Type',u.pathname.endsWith('.js')?'text/javascript; charset=utf-8':u.pathname.endsWith('.css')?'text/css; charset=utf-8':'text/html; charset=utf-8');res.end(readFileSync(lab+'/'+files[u.pathname]));}else{res.writeHead(404);res.end('not found');}
});
await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(5286,'127.0.0.1',resolve)});
const result={conditions:'original HTML/CSS/JS unchanged; PokéAPI requests intercepted to deterministic HTTP loopback mock; no real upstream/official assets; Math.random fixed0; Chrome headless; serial; localStorage fresh context',checks:[],screens:[],pageErrors:[],consoleErrors:[],blockedExternal:[],mockedPokeUrls:[],failedResources:[]};
const ck=(name,expected,actual,kind='functional')=>result.checks.push({name,expected,actual,pass:JSON.stringify(expected)===JSON.stringify(actual),kind});
let browser;
const state=page=>page.evaluate(()=>({attemptsLeft,score,highScore:Number(highScore),hintsUsed,attempts:attempts.map(x=>({name:x.name,isCorrect:x.isCorrect})),currentPokemon:currentPokemon?.name,message:document.querySelector('.attempt-response')?.textContent}));
async function setup(width,height){const c=await browser.newContext({viewport:{width,height},locale:'pt-BR',reducedMotion:'reduce'});await c.addInitScript(()=>{Math.random=()=>0});await c.route('**/*',async route=>{const u=new URL(route.request().url());if(u.origin===origin)return route.continue();if(u.hostname==='pokeapi.co'){result.mockedPokeUrls.push(u.href);const response=await route.fetch({url:origin+u.pathname+u.search});return route.fulfill({response});}result.blockedExternal.push(u.href);return route.abort();});const p=await c.newPage();p.on('pageerror',x=>result.pageErrors.push(x.message));p.on('console',x=>{if(x.type()==='error')result.consoleErrors.push(x.text())});p.on('requestfailed',x=>result.failedResources.push({url:x.url(),reason:x.failure()?.errorText}));await p.goto(origin);await p.waitForFunction(()=>currentPokemon?.name==='alpha');return {c,p};}
async function submit(p,text){await p.locator('.input__search').fill(text);await p.locator('.input__search').press('Enter');await p.waitForTimeout(100);return state(p);}
async function screen(p,name){await p.screenshot({path:out+'/'+name+'.png',fullPage:true});result.screens.push({name,...await p.evaluate(()=>({viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,focusedTag:document.activeElement.tagName}))});}
try{
 browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--disable-background-networking']});result.browserVersion=browser.version();
 const {c,p}=await setup(1440,1000);ck('startup seeded target','alpha',(await state(p)).currentPokemon);await screen(p,'1440-startup-synthetic');
 let s=await submit(p,'beta');ck('wrong guess consumes one',2,s.attemptsLeft);ck('wrong guess feedback preserved',true,s.message.includes('chance'),'UI feedback expectation; submit handler rebuilds attempts');
 s=await submit(p,'BETA');ck('duplicate does not consume another',2,s.attemptsLeft);
 s=await submit(p,'not-a-fixture');ck('invalid name does not consume attempt',2,s.attemptsLeft);
 await p.locator('.tab-button').nth(1).click();for(let i=0;i<3;i++)await p.locator('.btn-hint').click();ck('three hints consumed',3,(await state(p)).hintsUsed);await p.locator('.btn-hint').click();ck('hints bounded at three',3,(await state(p)).hintsUsed);
 await p.locator('.tab-button').nth(0).click();s=await submit(p,' ALPHA ');ck('normalized correct guess awards remaining chances',20,s.score);ck('record saved',20,Number(await p.evaluate(()=>localStorage.getItem('pokedexHighScore'))));await screen(p,'1440-win-feedback-synthetic');
 const before=s.attemptsLeft;s=await submit(p,'gamma');ck('winning round rejects further guesses',before,s.attemptsLeft,'game-ended expectation; only attemptsLeft<=0 guarded');
 await p.reload();await p.waitForFunction(()=>currentPokemon?.name==='alpha');ck('record survives reload',20,(await state(p)).highScore);
 for(const guess of ['beta','gamma','delta'])s=await submit(p,guess);ck('three wrong guesses exhaust round',0,s.attemptsLeft);
 await p.locator('.tab-button').nth(2).click();await p.waitForTimeout(100);ck('restart tab resets attempts',3,(await state(p)).attemptsLeft);
 await p.locator('.tab-arrow.right').click();await p.locator('.tab-arrow.right').click();const requestsBefore=result.mockedPokeUrls.length;await p.locator('.btn-restart').click();await p.waitForTimeout(100);ck('restart button makes one acquisition',1,result.mockedPokeUrls.length-requestsBefore,'duplicate event registration expectation');
 await p.locator('.input__search').fill('al');await p.waitForSelector('.suggestions-list-fixed li');await p.locator('.input__search').press('ArrowDown');ck('keyboard selects first suggestion',true,await p.locator('.suggestions-list-fixed li').first().evaluate(x=>x.classList.contains('selected')));await p.locator('.input__search').press('Escape');ck('Escape clears suggestions',0,await p.locator('.suggestions-list-fixed').count());
 failBudget=4;const failedStart=result.mockedPokeUrls.length;await p.evaluate(()=>renderPokemon(1));await p.waitForTimeout(200);ck('503 round uses a bounded single acquisition',1,result.mockedPokeUrls.length-failedStart,'observed four failures then fixture allows success; original recursive retries have no cap');
 result.finalState=await state(p);await c.close();
 const m=await setup(390,844);await screen(m.p,'390-startup-synthetic');ck('mobile document fits width',true,await m.p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));const focus=[];for(let i=0;i<5;i++){await m.p.keyboard.press('Tab');focus.push(await m.p.evaluate(()=>({tag:document.activeElement.tagName,title:document.activeElement.getAttribute('title')})));}result.mobileFocusSamples=focus;await m.c.close();
 result.serverRequests=serverRequests;writeFileSync(out+'/browser-results.json',JSON.stringify(result,null,2));console.log(JSON.stringify({checks:result.checks.length,FAILs:result.checks.filter(x=>!x.pass),browserVersion:result.browserVersion}));process.exitCode=result.checks.some(x=>!x.pass)?1:0;
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve));}
