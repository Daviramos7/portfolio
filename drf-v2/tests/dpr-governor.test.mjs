import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createDprGovernor, dprPolicy } from '../src/scene/dprGovernor.ts'

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

test('the renderer sizes the canvas through the governor and samples only continuous frames',()=>{
  const source=readFileSync(new URL('../src/scene/garageRenderer.ts',import.meta.url),'utf8')
  assert.match(source,/const dpr = dprGovernor\.dpr/)
  assert.match(source,/lastTimestamp !== null && dprGovernor\.sample\(nowMs - lastTimestamp\)\) resize\(\)/)
  assert.doesNotMatch(source,/state\.quality === 'low' \? 1 :/)
})
