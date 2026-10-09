import test from 'node:test'
import assert from 'node:assert/strict'
import { createPassScheduler, canSchedulePass } from '../src/scene/trackside/scheduler.ts'
const state = { renderStatus:'ready', mode:'immersive', ambientEnabled:true, documentVisible:true, panelOpen:false, reducedMotion:false, audio:'off' }
test('seed is deterministic and initial interval/duration respect production bounds', () => {
  const a=createPassScheduler({seed:12}), b=createPassScheduler({seed:12})
  const first=a.tick(0,state,true); assert.ok(first.nextMs>=25000&&first.nextMs<=45000)
  for(let t=0;t<200000;t+=100) { const x=a.tick(t,state,true); assert.deepEqual(x,b.tick(t,state,true)); if(x.event)assert.ok(x.event.durationMs>=3000&&x.event.durationMs<=5000) }
})
test('one active event retains identity until completion; next interval starts at end', () => {
  const s=createPassScheduler(), first=s.tick(0,state,true), start=s.tick(first.nextMs,state,true)
  assert.equal(start.started,true); const id=start.event.id
  for(let t=1;t<start.event.durationMs;t+=100) { const x=s.tick(start.event.startMs+t,state,true); assert.equal(x.event.id,id); assert.equal(x.started,false) }
  const endTime=start.event.startMs+start.event.durationMs, end=s.tick(endTime,state,true)
  assert.equal(end.event,null); assert.ok(end.nextMs>=endTime+25000&&end.nextMs<=endTime+45000)
})
test('every contract gate cancels and restarting receives a fresh interval without catch-up', () => {
  for(const change of [{renderStatus:'loading'},{mode:'recruiter'},{ambientEnabled:false},{documentVisible:false},{panelOpen:true},{reducedMotion:true}]) {
    const s=createPassScheduler(), first=s.tick(0,state,true); assert.ok(s.tick(first.nextMs,state,true).event)
    assert.equal(s.tick(50000,{...state,...change},true).event,null)
    const restart=s.tick(500000,state,true); assert.equal(restart.event,null); assert.ok(restart.nextMs>=525000)
  }
  assert.equal(canSchedulePass(state,false),false)
})
test('camera transition and explicit cancellation clear active event and deadline', () => {
  const s=createPassScheduler(), first=s.tick(0,state,true); s.tick(first.nextMs,state,true)
  assert.equal(s.tick(40000,state,false).nextMs,null)
  const restart=s.tick(41000,state,true); assert.ok(restart.nextMs>=66000); s.reset()
  assert.ok(s.tick(42000,state,true).nextMs>=67000)
})
test('reduced motion is static unless explicitly opted into the sound-only variant', () => {
  const reduced={...state,reducedMotion:true}; const s=createPassScheduler()
  assert.equal(s.tick(0,reduced,true).nextMs,null)
  const audio={...reduced,audio:'on'}, initial=s.tick(100,audio,true), pass=s.tick(initial.nextMs,audio,true)
  assert.ok(pass.event); assert.equal(pass.visual,false)
  assert.equal(s.tick(initial.nextMs+100,reduced,true).event,null)
})
test('invalid/backward clock cannot rewind progress or create overlapping events', () => {
  const s=createPassScheduler(), first=s.tick(0,state,true), pass=s.tick(first.nextMs,state,true)
  const progress=s.tick(first.nextMs+1000,state,true)
  assert.equal(s.tick(first.nextMs,state,true).progress,progress.progress)
  assert.equal(s.tick(NaN,state,true).event.id,pass.event.id)
})
