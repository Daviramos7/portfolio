import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { Box3, Group, Mesh, Vector3 } from 'three'
import { parseTrackModel } from '../src/scene/trackside/TrackModel.ts'
import { createPropModelLease } from '../src/scene/garage/propModel.ts'
import { createPersonalDetails, handgripPlacement } from '../src/scene/garage/personalDetails.ts'
import { createResources } from '../src/scene/garage/resources.ts'

const file=await readFile(new URL('../public/models/props/handgrip.glb',import.meta.url)),bytes=file.buffer.slice(file.byteOffset,file.byteOffset+file.byteLength)
const model=()=>parseTrackModel(bytes)
const meshes=root=>{const list=[];root.traverse(o=>{if(o instanceof Mesh)list.push(o)});return list}
const triangleCount=root=>meshes(root).reduce((sum,mesh)=>sum+(mesh.geometry.index?.count??mesh.geometry.attributes.position.count)/3,0)
const limits=handgripPlacement.limits
function fixture(dependencies){
  globalThis.document={createElement:()=>({getContext:()=>null})};const r=createResources()
  const personal=createPersonalDetails(r,dependencies);personal.root.updateMatrixWorld(true)
  return {r,personal,grip:personal.details.find(group=>group.userData.detailId==='constancy-grip')}
}

test('handgrip GLB is a small real-scale prop: budget, two named materials, UVs, grounded and centred',async()=>{
  assert.ok(bytes.byteLength<300*1024,'light enough to ship beside the track model')
  const root=await model();root.updateMatrixWorld(true)
  const triangles=triangleCount(root);assert.ok(triangles<=6000&&triangles>2000,'small-prop budget without padding: '+triangles)
  assert.deepEqual(new Set(meshes(root).map(mesh=>mesh.material.name)),new Set(['handgrip-aluminium','handgrip-spring']))
  for(const mesh of meshes(root)){for(const name of ['position','normal','uv']){assert.ok(mesh.geometry.attributes[name],name+' exported');assert.ok([...mesh.geometry.attributes[name].array].every(Number.isFinite))}}
  const box=new Box3().setFromObject(root),size=box.getSize(new Vector3())
  assert.ok(Math.abs(size.y-.17)<.002,'0.17 m tall, Y up');assert.ok(size.y>size.x&&size.x>size.z,'upright: spring over two handles, thin front to back')
  assert.ok(Math.abs(box.min.y)<1e-4,'origin at the base');assert.ok(Math.abs(box.min.x+box.max.x)<1e-3&&Math.abs(box.min.z+box.max.z)<1e-3,'centred on the footprint')
  const spring=new Box3(),handles=new Box3()
  for(const mesh of meshes(root))(mesh.material.name==='handgrip-spring'?spring:handles).expandByObject(mesh)
  assert.ok(spring.min.y>=handles.max.y-1e-4&&handles.min.y<1e-4,'spring material sits above the handles')
})

test('station keeps its procedural handgrip until the model arrives, then swaps it in the same place',async()=>{
  const {r,personal,grip}=fixture({bytes:async()=>bytes,parse:parseTrackModel})
  const fallback=grip.getObjectByName('handgrip-procedural-fallback');assert.ok(fallback);assert.equal(personal.handgripStatus,'fallback')
  assert.equal(meshes(fallback).length,5);assert.ok(meshes(fallback).every(mesh=>mesh.userData.dynamic),'stand-in stays out of the static instanced batches')
  const before=new Box3().setFromObject(fallback),plaque=new Box3().setFromObject(grip.children.find(o=>o instanceof Mesh&&Math.abs(o.scale.y-.16)<1e-6))
  r.batch(personal.root);assert.equal(fallback.parent,grip,'batching leaves the stand-in removable')
  const loading=personal.loadModels('/models/props/handgrip.glb');assert.equal(personal.handgripStatus,'loading');assert.equal(personal.loadModels('/again'),loading);await loading
  assert.equal(personal.handgripStatus,'loaded');assert.equal(grip.getObjectByName('handgrip-procedural-fallback'),undefined)
  const placed=grip.getObjectByName('handgrip-model');assert.ok(placed);personal.root.updateMatrixWorld(true)
  const after=new Box3().setFromObject(placed),size=after.getSize(new Vector3())
  assert.ok(Math.abs(size.y-.17*handgripPlacement.scale)<.01,'uniform scene scale');assert.ok(Math.abs(size.y-before.getSize(new Vector3()).y)<.06,'about as tall as the stand-in it replaces')
  assert.ok(Math.abs(after.min.y-plaque.max.y)<.003,'handles rest on the plaque');assert.ok(after.max.y<=before.max.y+.01,'no higher than before: monitor sightline kept')
  assert.ok(after.getCenter(new Vector3()).distanceTo(before.getCenter(new Vector3()))<.08,'same spot on the station')
  const materials=new Set(meshes(placed).map(mesh=>mesh.material));assert.equal(materials.size,2)
  const aluminium=[...materials].find(m=>m.name==='handgrip-aluminium'),spring=[...materials].find(m=>m.name==='handgrip-spring')
  assert.ok(aluminium.metalness>.8&&aluminium.normalMap&&aluminium.roughnessMap,'knurled aluminium from procedural maps');assert.ok(spring.metalness>.7&&!spring.map,'plain dark steel spring')
  assert.ok(meshes(placed).every(mesh=>mesh.castShadow&&mesh.receiveShadow))
  const counts=new Map();for(const resource of [...materials,aluminium.normalMap,aluminium.roughnessMap,...meshes(placed).map(mesh=>mesh.geometry)]){counts.set(resource,0);resource.addEventListener('dispose',()=>counts.set(resource,counts.get(resource)+1))}
  personal.disposeModels();personal.disposeModels();assert.equal(grip.getObjectByName('handgrip-model'),undefined);r.dispose();r.dispose()
  assert.ok([...counts.values()].every(count=>count===1),'model geometry by its lease, scene materials and maps by the resource owner, once each')
})

test('missing, invalid or oversized model leaves the procedural handgrip and never throws into the scene',async()=>{
  for(const dependencies of [{bytes:async()=>{throw new Error('404')},parse:parseTrackModel},{bytes:async()=>bytes,parse:async()=>{throw new Error('corrupt')}},{bytes:async()=>bytes,parse:async()=>{const root=await model();root.scale.setScalar(40);return root}}]){
    const {r,personal,grip}=fixture(dependencies);await personal.loadModels('/models/props/handgrip.glb')
    assert.equal(personal.handgripStatus,'fallback');assert.ok(grip.getObjectByName('handgrip-procedural-fallback'));assert.equal(grip.getObjectByName('handgrip-model'),undefined)
    personal.disposeModels();r.dispose()
  }
})

test('lease enforces limits, survives late cancellation and releases the file resources exactly once',async()=>{
  const root=await model(),resources=[...new Set(meshes(root).flatMap(mesh=>[mesh.geometry,mesh.material]))],counts=resources.map(()=>0)
  resources.forEach((resource,index)=>resource.addEventListener('dispose',()=>counts[index]++))
  let resolve,attached=0;const lease=createPropModelLease(()=>attached++,limits,{bytes:()=>new Promise(done=>resolve=done),parse:async()=>root})
  const waiting=lease.load('/model');lease.dispose();resolve(bytes);await waiting;lease.dispose()
  assert.equal(attached,0);assert.equal(lease.status,'disposed');assert.ok(counts.every(count=>count===1))
  const heavy=createPropModelLease(()=>assert.fail('no attach above the triangle limit'),{...limits,triangles:100},{bytes:async()=>bytes,parse:model});await heavy.load('/heavy');assert.equal(heavy.status,'fallback')
  const parent=new Group(),active=createPropModelLease(loaded=>parent.add(loaded),limits,{bytes:async()=>bytes,parse:model});await active.load('/ok')
  assert.equal(active.status,'loaded');assert.equal(parent.children.length,1);active.dispose();assert.equal(parent.children.length,0)
})
