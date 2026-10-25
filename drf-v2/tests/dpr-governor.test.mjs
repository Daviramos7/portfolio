import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { cappedFrameMs, createDprGovernor, dprPolicy } from '../src/scene/dprGovernor.ts'

const feed=(g,ms,durationMs)=>{let changed=0;for(let t=0;t<durationMs;t+=ms)if(g.sample(ms))changed++;return changed}

test('low quality starts at DPR 1.5 and never exceeds the device ratio',()=>{
  assert.equal(createDprGovernor(()=>3,'low').dpr,1.5)
  assert.equal(createDprGovernor(()=>1,'low').dpr,1)
  assert.equal(createDprGovernor(()=>2,'balanced').dpr,1.5)
})

test('sustained slow frames drop low quality to DPR 1, short spikes do not',()=>{
  const g=createDprGovernor(()=>3,'low')
  feed(g,16.7,3000);feed(g,40,1000);feed(g,16.7,3000)
  assert.equal(g.dpr,1.5,'one second of 25 fps is a spike, not a trend')
  assert.equal(feed(g,40,4000),1)
  assert.equal(g.dpr,1);assert.equal(g.state,'degraded')
})

test('hysteresis: middling frames hold DPR 1, only a long fast stretch restores 1.5',()=>{
  const g=createDprGovernor(()=>2,'low')
  feed(g,40,4000)
  feed(g,22,30000)
  assert.equal(g.dpr,1,'22 ms is between both thresholds: no change either way')
  feed(g,16.7,dprPolicy.restoreAfterMs-1000)
  assert.equal(g.dpr,1,'restore needs the full fast window')
  feed(g,16.7,3000)
  assert.equal(g.dpr,1.5);assert.equal(g.state,'full')
})

test('a second degradation latches DPR 1 for the session (no oscillation)',()=>{
  const g=createDprGovernor(()=>2,'low')
  feed(g,40,4000);feed(g,16.7,15000);feed(g,40,4000)
  assert.equal(g.state,'latched')
  assert.equal(feed(g,8,60000),0)
  assert.equal(g.dpr,1)
})

test('balanced quality never adapts and gaps over maxSampleMs are ignored',()=>{
  const b=createDprGovernor(()=>2,'balanced')
  assert.equal(feed(b,60,10000),0);assert.equal(b.dpr,1.5)
  const g=createDprGovernor(()=>2,'low')
  assert.equal(feed(g,dprPolicy.maxSampleMs+1,20000),0);assert.equal(g.dpr,1.5)
})

test('interrupt forgets the trend: slow time does not carry across a paused loop',()=>{
  const g=createDprGovernor(()=>2,'low')
  feed(g,40,1500);g.interrupt();feed(g,40,1500)
  assert.equal(g.dpr,1.5)
})

// Mirrors the renderer loop under the 30 fps ambient cap: a rendered frame blocks for costMs, a skipped one costs
// a single vsync, and only rendered frames feed the governor. `aligned` snaps the next RAF to the vsync grid; the
// unaligned model is the one from the phase 1 review table.
function cappedLoop(vsyncMs,costMs,durationMs,aligned=true){
  const g=createDprGovernor(()=>3,'low')
  let t=0,lastRenderedAt=-Infinity,loopRenderedAt=null,rendered=0
  while(t<durationMs){
    if(t-lastRenderedAt>=cappedFrameMs){
      if(loopRenderedAt!==null)g.sample(t-loopRenderedAt,'capped')
      loopRenderedAt=lastRenderedAt=t;rendered++
      t=aligned?Math.ceil((t+costMs)/vsyncMs-1e-9)*vsyncMs:t+costMs
    }else t+=vsyncMs
  }
  return {state:g.state,fps:rendered/(durationMs/1000)}
}

test('30 fps cap: healthy displays keep DPR 1.5 at 60, 120 and 144 Hz',()=>{
  for(const vsync of [1000/60,1000/120,1000/144]){
    const run=cappedLoop(vsync,8,20000)
    assert.equal(run.state,'full',`vsync ${vsync.toFixed(1)} ms`)
    assert.ok(run.fps>27,`vsync ${vsync.toFixed(1)} ms renders ${run.fps.toFixed(1)} fps under the cap`)
  }
})

test('30 fps cap: degradation is monotonic in frame cost (review finding 1)',()=>{
  // Before the fix, 30 ms frames (21 fps) held DPR 1.5 while 35 ms frames (28.6 fps) dropped it.
  for(const [vsync,aligned] of [[1000/60,true],[1000/120,true],[1000/60,false],[1000/120,false]]){
    let wasDegraded=false
    for(let cost=5;cost<=60;cost+=1){
      const run=cappedLoop(vsync,cost,20000,aligned),degraded=run.state!=='full'
      // Without vsync snapping the fps itself is not monotonic in cost, so only the aligned loop checks cost order.
      if(aligned)assert.ok(!wasDegraded||degraded,`vsync ${vsync.toFixed(1)} ms: ${cost} ms frames recovered after a cheaper cost degraded`)
      if(run.fps<24)assert.ok(degraded,`vsync ${vsync.toFixed(1)} ms: ${run.fps.toFixed(1)} fps must degrade`)
      if(run.fps>27)assert.ok(!degraded,`vsync ${vsync.toFixed(1)} ms: ${run.fps.toFixed(1)} fps must hold`)
      wasDegraded=degraded
    }
  }
  assert.equal(cappedLoop(1000/60,30,20000,false).state,'degraded','the review case: 21 fps under the cap degrades')
  assert.equal(cappedLoop(1000/60,35,20000,false).state,'full','the review case: 28.6 fps is above the 25 fps floor and holds')
})

test('switching cadence restarts the average instead of mixing thresholds',()=>{
  const g=createDprGovernor(()=>2,'low')
  feed(g,33.4,1500) // fine for the cap, slow for native pacing
  for(let t=0;t<1500;t+=33.4)g.sample(33.4,'capped')
  assert.equal(g.state,'full')
  for(let t=0;t<1900;t+=30)g.sample(30,'native')
  assert.equal(g.state,'full','1.9 s above 25 ms is still under the 2 s window')
  for(let t=0;t<300;t+=30)g.sample(30,'native')
  assert.equal(g.state,'degraded')
})

test('the renderer samples rendered frames with their cadence, not every RAF',()=>{
  const source=readFileSync(new URL('../src/scene/garageRenderer.ts',import.meta.url),'utf8')
  assert.match(source,/const dpr = dprGovernor\.dpr/)
  assert.match(source,/loopRenderedAt !== null && dprGovernor\.sample\(nowMs - loopRenderedAt, cadence\)\) resize\(\)/)
  assert.doesNotMatch(source,/dprGovernor\.sample\(nowMs - lastTimestamp/)
  const cap=source.indexOf('nowMs - lastRenderedAt < cappedFrameMs'),sample=source.indexOf('dprGovernor.sample(')
  assert.ok(cap>0&&sample>cap,'skipped frames return before the governor sees them')
  assert.doesNotMatch(source,/state\.quality === 'low' \? 1 :/)
})
