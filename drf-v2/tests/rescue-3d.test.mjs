import test from 'node:test'
import assert from 'node:assert/strict'
import { Group, Vector3 } from 'three'
import { createResources } from '../src/scene/garage/resources.ts'
import { createWheelAssemblies } from '../src/scene/car/wheels.ts'
import { buildCameraPath, framings, mobileFramings, programmeFramings } from '../src/scene/camera/framing.ts'
import { createPassScheduler } from '../src/scene/trackside/scheduler.ts'
import { createTrackAudio } from '../src/scene/trackside/audio.ts'
const state={renderStatus:'ready',mode:'immersive',ambientEnabled:true,documentVisible:true,panelOpen:false,reducedMotion:false,audio:'off'}
test('all four wheels have closed rims, two finished faces and aligned axles',()=>{
  globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>null})}
  const r=createResources(),car=new Group(),wheels=createWheelAssemblies(r,car)
  assert.equal(wheels.length,4);assert.equal(new Set(wheels.map(w=>w.name)).size,4)
  for(const wheel of wheels){
    assert.equal(wheel.children.filter(o=>o.name.startsWith('spoke-')).length,16)
    const spoke=wheel.getObjectByName('spoke-1-0');spoke.geometry.computeBoundingBox()
    assert.ok(Math.abs(spoke.geometry.boundingBox.min.x+spoke.geometry.boundingBox.max.x)<1e-7,'extrusion is centered equally on both faces')
    for(const part of ['closed-rim','brake-disc','hub--1','hub-1','axle','retaining-nut'])assert.ok(wheel.getObjectByName(part))
    for(const object of wheel.children){const g=object.geometry;assert.ok([...g.attributes.position.array].every(Number.isFinite));assert.ok([...g.attributes.normal.array].every(Number.isFinite))}
    const axis=new Vector3(0,1,0).applyQuaternion(wheel.getObjectByName('axle').quaternion);assert.ok(Math.abs(axis.x)>.999)
    const upright=car.getObjectByName(wheel.name+'-upright');assert.equal(Math.abs(upright.position.x),1.04)
    for(const arm of car.children.filter(o=>o.name.startsWith(wheel.name)&&o.name.endsWith('-arm'))){arm.geometry.computeBoundingBox();arm.updateMatrixWorld(true);const box=arm.geometry.boundingBox.clone().applyMatrix4(arm.matrixWorld);assert.ok(Math.max(Math.abs(box.min.x),Math.abs(box.max.x))<1.08)}
  }
  r.dispose()
})
test('camera paths preserve current/end pose and avoid car/furniture corridor, including cancellations',()=>{
  const views=[...Object.values(framings),...Object.values(mobileFramings),...Object.values(programmeFramings)]
  const verify=(from,to)=>{const {path,durationMs}=buildCameraPath(from,to);assert.ok(path.getPointAt(0).distanceTo(from)<1e-8);assert.ok(path.getPointAt(1).distanceTo(to)<1e-8);assert.ok(durationMs>=1600&&durationMs<=2400);for(let i=0;i<=100;i++){const p=path.getPointAt(i/100);assert.ok(Math.abs(p.x)<7.8&&p.z>-6&&p.z<11.3&&p.y>1.7&&p.y<2.5);assert.ok(!(Math.abs(p.x)<2.2&&p.z>-2.5&&p.z<3.3))}return path}
  for(const a of views)for(const b of views){const path=verify(new Vector3(...a.position),new Vector3(...b.position));for(const p of [.2,.5,.8])verify(path.getPointAt(p),new Vector3(...b.position))}
})
test('production-injected first pass is 5–8 seconds, later intervals stay 25–45 and audio off permits visuals',()=>{
  const s=createPassScheduler({seed:4701,initialIntervalMs:[5000,8000]}),initial=s.tick(0,state,true);assert.ok(initial.nextMs>=5000&&initial.nextMs<=8000)
  const first=s.tick(initial.nextMs,state,true);assert.ok(first.event&&first.visual)
  const end=s.tick(first.event.startMs+first.event.durationMs,state,true);assert.ok(end.nextMs>=first.event.startMs+first.event.durationMs+25000)
  s.reset();assert.ok(s.tick(60000,state,true).nextMs>=85000)
})
test('silence path never constructs AudioContext and remains safely unavailable/idempotent',async()=>{
  globalThis.AudioContext=class {constructor(){throw Error('must not create audio')}}
  const audio=createTrackAudio();audio.setAudioVolume(.9);audio.muteAudio();audio.muteAudio();assert.equal(await audio.requestAudioFromGesture(),'unavailable');audio.dispose();audio.dispose()
})
