import test from 'node:test'
import assert from 'node:assert/strict'
import { Box3, Group, Mesh, PerspectiveCamera, Vector3 } from 'three'
import { createDRF01 } from '../src/scene/car/DRF01.ts'
import { createResources } from '../src/scene/garage/resources.ts'
import { createProgrammeScreen, screenActivity } from '../src/scene/garage/programmeScreen.ts'
import { createTrackOpening } from '../src/scene/trackside/TrackOpening.ts'
import { tracksideRoute } from '../src/scene/trackside/preparation.ts'
import { createTrackPass } from '../src/scene/trackside/TrackPass.ts'

test('compact rear aero and sculpted wheel faces retain four closed assemblies',()=>{
  globalThis.document={createElement:()=>({getContext:()=>null})}
  const r=createResources(),car=createDRF01(r)
  const tireBounds=new Box3().setFromObject(car.getObjectByName('wheel-rear-right'))
  const wheelSize=tireBounds.getSize(new Vector3())
  for(const side of [-1,1]){
    const plate=car.getObjectByName('rear-endplate-'+side)
    const bounds=new Box3().setFromObject(plate),size=bounds.getSize(new Vector3())
    assert.ok(Math.max(Math.abs(bounds.min.x),Math.abs(bounds.max.x))<tireBounds.max.x,'rear aero stays inside the wheel envelope')
    assert.ok(size.y<wheelSize.y*.5,'endplate height does not dominate a wheel')
    assert.ok(size.y*size.z<wheelSize.y*wheelSize.z*.4,'endplate side projection remains compact')
  }
  assert.ok(car.getObjectByName('cockpit-continuous-rim'))
  for(const axle of ['front','rear'])for(const side of ['left','right']){
    const wheel=car.getObjectByName('wheel-'+axle+'-'+side)
    const spoke=wheel.getObjectByName('spoke-1-0');spoke.geometry.computeBoundingBox()
    const size=spoke.geometry.boundingBox.getSize(new Vector3())
    assert.ok(size.x>size.y*.15&&size.x<size.y,'spokes have volume without filling the rim')
    assert.ok(wheel.getObjectByName('machined-rim-lip--1'));assert.ok(wheel.getObjectByName('machined-rim-lip-1'))
  }
  r.dispose()
})
test('pit lane stays outside the garage with a low separator behind its route',()=>{
  globalThis.document={createElement:()=>({getContext:()=>null})}
  const r=createResources(),opening=createTrackOpening(r),barrier=opening.track.getObjectByName('low-paddock-separator')
  assert.ok(tracksideRoute.start[2]<-6.6&&tracksideRoute.start[2]>barrier.position.z)
  assert.ok(barrier.position.z<tracksideRoute.start[2])
  const vehicle=createTrackPass(r,opening).vehicle
  assert.ok(new Box3().setFromObject(barrier).getSize(new Vector3()).y<new Box3().setFromObject(vehicle).getSize(new Vector3()).y*.6,'separator is lower than the passing vehicle')
  for(const endpoint of [tracksideRoute.start,tracksideRoute.end])assert.ok(endpoint[2]<-6.6&&endpoint[2]>barrier.position.z,'both ends remain outside garage and ahead of separator')
  r.dispose()
})
test('five distinct ambient indicators move without uploading canvas or changing source facts',()=>{
  const ctx=new Proxy({measureText:t=>({width:t.length*12})},{get:(o,k)=>o[k]??(()=>{})})
  globalThis.document={createElement:()=>({getContext:()=>ctx})}
  const owned=[],r={texture:t=>(owned.push(t),t),material:t=>(owned.push(t),t),geometry:t=>(owned.push(t),t),mesh:(p,g,m,pos)=>{const mesh=new Mesh(g,m);mesh.position.set(...pos);p.add(mesh);return mesh}}
  const camera=new PerspectiveCamera(60,2,.1,30);camera.position.set(0,0,5);camera.lookAt(0,0,0);camera.updateMatrixWorld()
  for(const zone of ['garage','telemetry','pit-wall','driver-profile','strategy-room']){
    const display=createProgrammeScreen(r,new Group(),zone,[2.8,1.4],[0,0,0])
    const index=[{zoneId:zone,projectId:null,label:{pt:'Fonte',en:'Source'},screenLines:[{pt:'Único registro',en:'Single record'}]}]
    display.update(index,'pt',null);const version=display.uploadVersion,marker=display.object.getObjectByName('demo-cursor-'+zone)
    display.object.updateMatrixWorld(true);display.updateAmbient(0,camera);const before=[...marker.position.toArray(),...marker.scale.toArray()]
    display.updateAmbient(3000,camera);assert.notDeepEqual([...marker.position.toArray(),...marker.scale.toArray()],before,zone)
    for(let i=0;i<900;i++)display.updateAmbient(i*34,camera)
    assert.equal(display.uploadVersion,version);assert.deepEqual(display.object.userData.screenPresentation.lines,['Único registro'])
    const pose=screenActivity(zone,0);assert.ok(pose[0]>=45&&pose[0]<=295&&pose[1]>=100&&pose[1]<=400)
  }
  owned.forEach(resource=>resource.dispose())
})
