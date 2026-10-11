import test from 'node:test'
import assert from 'node:assert/strict'
import { Box3, Group, Vector3 } from 'three'
import { createResources } from '../src/scene/garage/resources.ts'
import { createTrackOpening } from '../src/scene/trackside/TrackOpening.ts'
import { createTrackCar } from '../src/scene/trackside/TrackCar.ts'
import { createTrackPass } from '../src/scene/trackside/TrackPass.ts'
import { tracksidePose, tracksideRoute } from '../src/scene/trackside/preparation.ts'

const event={type:'CAR_PASS',id:'test',direction:'left-to-right',startMs:0,durationMs:2000,seed:1,vehicleId:tracksideRoute.vehicleId}
function fixture(){globalThis.document={createElement:()=>({getContext:()=>null})};const r=createResources();return {r,car:createTrackCar(r)}}
test('original external monoposto has four closed wheels, finite normals, X axles and two spoke faces',()=>{
  const {r,car}=fixture();car.updateMatrixWorld(true)
  const wheels=car.children.filter(o=>o.name.startsWith('track-wheel-')&&o instanceof Group);assert.equal(wheels.length,4)
  for(const wheel of wheels){assert.ok(wheel.getObjectByName('closed-rim'));assert.equal(wheel.children.filter(o=>o.name.startsWith('spoke-')).length,12)
    const axle=car.getObjectByName(wheel.name+'-spindle');assert.ok(Math.abs(new Vector3(0,1,0).applyQuaternion(axle.quaternion).x)>.999)
    for(const arm of car.children.filter(o=>o.name.startsWith(wheel.name)&&o.name.endsWith('-arm'))){const bounds=new Box3().setFromObject(arm);const tyre=new Box3().setFromObject(wheel.getObjectByName('tire'));assert.ok(Math.max(Math.abs(bounds.min.x),Math.abs(bounds.max.x))<Math.min(Math.abs(tyre.min.x),Math.abs(tyre.max.x)))}
  }
  let triangles=0;car.traverse(o=>{if(o.geometry){for(const key of ['position','normal'])assert.ok([...o.geometry.attributes[key].array].every(Number.isFinite));triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3}})
  assert.ok(triangles<10000,'small passing model has a bounded topology budget');assert.ok(car.getObjectByName('open-cockpit-seat'));assert.ok(car.getObjectByName('tapered-nose'));r.dispose()
})
test('shallow track bend stays outside workshop and separator, turns continuously, and reverses symmetrically',()=>{
  const {r,car}=fixture(),separator=createTrackOpening(r).track.getObjectByName('low-paddock-separator');let previous=null
  for(let i=0;i<=100;i++){
    const p=i/100,pose=tracksidePose(event,p);car.position.set(...pose.position);car.rotation.y=pose.yaw;car.updateMatrixWorld(true)
    const bounds=new Box3().setFromObject(car);assert.ok(bounds.max.z<-6.8,'car never crosses workshop wall');assert.ok(bounds.min.z>separator.position.z+.175,'car stays ahead of separator')
    if(previous){assert.ok(Math.abs(pose.yaw-previous.yaw)<.02);assert.ok(pose.position[0]>previous.position[0])}previous=pose
    const reverse=tracksidePose({...event,direction:'right-to-left'},1-p);assert.ok(new Vector3(...reverse.position).distanceTo(new Vector3(...pose.position))<1e-8)
    assert.ok(Math.abs(Math.sin(reverse.yaw-pose.yaw))<1e-8)
  }
  assert.ok(tracksidePose(event,.5).position[2]>tracksidePose(event,0).position[2]);r.dispose()
})
test('cancel/end restore vehicle and lightweight anchors without retaining visual effects',()=>{
  const {r}=fixture(),reflection=new Group(),lightweight=r.box(new Group(),[.1,.2,.1],[1,2,3],r.palette.white)
  const rest=lightweight.position.clone(),q=lightweight.quaternion.clone()
  const pass=createTrackPass(r,{reflection,lightweight,restore:()=>{lightweight.position.copy(rest);lightweight.quaternion.copy(q)}})
  pass.update(event,.4,true);assert.equal(pass.vehicle.visible,true);assert.ok(reflection.children[0].material.opacity>0)
  for(const args of [[null,0,false],[event,.8,false]]){pass.update(...args);assert.equal(pass.vehicle.visible,false);assert.equal(reflection.children[0].visible,false);assert.equal(reflection.children[0].material.opacity,0);assert.ok(lightweight.position.equals(rest));assert.ok(lightweight.quaternion.equals(q))}
  r.dispose()
})
