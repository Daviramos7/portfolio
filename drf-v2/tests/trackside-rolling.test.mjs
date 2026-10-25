import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { Box3, Vector3 } from 'three'
import { createResources } from '../src/scene/garage/resources.ts'
import { parseTrackModel, createTrackModelLease } from '../src/scene/trackside/TrackModel.ts'
import { prepareRollingWheels } from '../src/scene/trackside/wheelRolling.ts'
import { tracksidePose, tracksideRoute } from '../src/scene/trackside/preparation.ts'
import { createPassScheduler } from '../src/scene/trackside/scheduler.ts'
const bytes=await readFile(new URL('../public/scene/models/drf-sprint-03.glb',import.meta.url))
const model=()=>parseTrackModel(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength))
const event={direction:'left-to-right'}
const [low,high]=tracksideRoute.durationMs,mid=Math.round((low+high)/2)
const state={renderStatus:'ready',mode:'immersive',ambientEnabled:true,documentVisible:true,panelOpen:false,reducedMotion:false,audio:'off'}
test('constant scene speed and exact travelled arc agree with independent sampled geometry',()=>{
  let length=0,previous=tracksidePose(event,0)
  for(let i=1;i<=4000;i++){
    const p=i/4000,next=tracksidePose(event,p),delta=new Vector3(...next.position).sub(new Vector3(...previous.position))
    length+=delta.length();assert.ok(next.distance>previous.distance)
    assert.ok(delta.normalize().dot(new Vector3(Math.sin(next.yaw),0,Math.cos(next.yaw)))>.999)
    const reverse=tracksidePose({direction:'right-to-left'},1-p)
    assert.ok(new Vector3(...reverse.position).distanceTo(new Vector3(...next.position))<1e-8)
    assert.ok(Math.cos(reverse.yaw-next.yaw)<-.999999)
    assert.ok(Math.abs(reverse.distance+next.distance-tracksidePose(event,1).distance)<1e-8)
    previous=next
  }
  assert.ok(Math.abs(length-previous.distance)<.001)
  assert.ok(Math.abs(length-tracksideRoute.length)<.001)
  // M16 4a (Davi): about 45 m/s of scene speed, +-8 % between passes.
  const [fast,slow]=tracksideRoute.durationMs.map(ms=>tracksideRoute.length/(ms/1000))
  assert.ok(fast>45&&fast<50&&slow<45&&slow>40,'scene speed brackets 45 m/s')
})
test('real GLB keeps four wheel pivots, shared geometry, absolute rolling and one-owner disposal after partial batching',async()=>{
  globalThis.document={createElement:()=>({getContext:()=>null})}
  const r=createResources(),root=await model(),wheels=[],owned=new Set(),counts=[]
  root.traverse(o=>{if(o.name.startsWith('wheel-'))wheels.push(o);if(o.geometry){owned.add(o.geometry);owned.add(o.material)}})
  root.updateMatrixWorld(true)
  const rest=wheels.map(w=>({q:w.quaternion.clone(),p:w.position.clone(),radius:new Box3().setFromObject(w).getSize(new Vector3()).y/2*tracksideRoute.vehicleScale}))
  for(const resource of owned){const counter={n:0};counts.push(counter);resource.addEventListener('dispose',()=>counter.n++)}
  let rolling
  const lease=createTrackModelLease(root=>{rolling=prepareRollingWheels(root,r.batch,tracksideRoute.vehicleScale)},{bytes:async()=>bytes,parse:async()=>root})
  await lease.load('/original');assert.equal(rolling.count,4)
  let meshes=0;root.traverse(o=>{if(o.geometry){assert.ok(owned.has(o.geometry));meshes++}});assert.ok(meshes<=14)
  const travelled=rest[0].radius*Math.PI/2
  rolling.update(travelled)
  for(const [i,w] of wheels.entries()){
    assert.equal(root.getObjectByName(w.name),w);assert.ok(w.quaternion.angleTo(rest[i].q)>.1);assert.ok(w.position.equals(rest[i].p))
    assert.ok(new Vector3(0,1,0).applyQuaternion(w.quaternion).dot(new Vector3(0,0,1).applyQuaternion(rest[i].q))>.999,'quarter circumference rolls the authored X axle by a quarter turn')
    const q=w.quaternion.clone();rolling.update(travelled);assert.ok(q.angleTo(w.quaternion)<1e-7)
  }
  rolling.restore();for(const [i,w] of wheels.entries())assert.ok(w.quaternion.angleTo(rest[i].q)<1e-7)
  lease.dispose();r.dispose();lease.dispose();r.dispose();assert.ok(counts.every(c=>c.n===1))
})
test('DEV direction override respects exclusion, cancel, reduced motion and unsettled camera gates',()=>{
  for(const direction of ['left-to-right','right-to-left']){
    const s=createPassScheduler();s.tick(0,state,true);assert.equal(s.requestSoon(1,direction,mid),true)
    const active=s.tick(1,state,true);assert.equal(active.event.direction,direction);assert.equal(active.event.durationMs,mid)
    assert.equal(s.requestSoon(2,direction,mid+100),false);assert.equal(s.tick(2,state,true).event.id,active.event.id)
    assert.equal(s.tick(3,{...state,ambientEnabled:false},true).event,null)
    assert.equal(s.tick(4,state,true).event,null)
    s.requestSoon(5,direction);assert.equal(s.tick(5,{...state,reducedMotion:true},true).event,null)
    s.requestSoon(6,direction);assert.equal(s.tick(6,state,false).event,null)
  }
})
test('private timing override repeats, rejects invalid input and clears both overrides on reset',()=>{
  const s=createPassScheduler(),natural=createPassScheduler()
  s.tick(0,state,true);natural.tick(0,state,true)
  for(const duration of [NaN,Infinity,0,low-1,high+1])assert.equal(s.requestSoon(1,'left-to-right',duration),false)
  assert.equal(s.requestSoon(NaN,'left-to-right',mid),false)
  assert.equal(s.requestSoon(1,'invalid',mid),false)
  assert.deepEqual(s.tick(1,state,true),natural.tick(1,state,true),'invalid request must not alter seeded production schedule')
  for(const now of [2,5000]){
    assert.equal(s.requestSoon(now,'right-to-left',mid),true)
    const pass=s.tick(now,state,true);assert.equal(pass.event.direction,'right-to-left');assert.equal(pass.event.durationMs,mid)
    s.tick(now+mid,state,true)
  }
  const reset=createPassScheduler();reset.requestSoon(0,'right-to-left',mid);reset.reset()
  const clean=createPassScheduler();assert.deepEqual(reset.tick(0,state,true),clean.tick(0,state,true))
  const next=reset.tick(reset.tick(1,state,true).nextMs,state,true),reference=clean.tick(clean.tick(1,state,true).nextMs,state,true)
  assert.deepEqual(next,reference,'reset cannot leak direction/duration override into natural event')
})
