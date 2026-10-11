import test from 'node:test'
import assert from 'node:assert/strict'
import { Box3, Mesh, PerspectiveCamera, Vector3 } from 'three'
import { createPersonalDetails, personalDetailLayout } from '../src/scene/garage/personalDetails.ts'
import { createResources } from '../src/scene/garage/resources.ts'
import { framings, mobileFramings } from '../src/scene/camera/framing.ts'

function fixture(draw=false){
  globalThis.document={createElement:()=>({getContext:()=>null})};const r=createResources(),texts=[]
  if(draw){const ctx=new Proxy({fillText:text=>texts.push(text)},{get:(object,key)=>object[key]??(()=>{})});globalThis.document={createElement:()=>({getContext:()=>ctx})}}
  const personal=createPersonalDetails(r);personal.root.updateMatrixWorld(true);return {r,personal,texts}
}
test('exactly five authored discoveries occupy five existing functional zones, outside car/project/track volumes',()=>{
  const {r,personal}=fixture();assert.equal(personal.root.children.length,5);assert.equal(new Set(personalDetailLayout.map(d=>d.id)).size,5)
  assert.deepEqual(new Set(personalDetailLayout.map(d=>d.zone)),new Set(Object.keys(framings)))
  const room=new Box3(new Vector3(-8.3,0,-6.4),new Vector3(8.3,4.5,11.3)),hero=new Box3(new Vector3(-1.6,0,-2.3),new Vector3(1.6,1.6,3)),projects=new Box3(new Vector3(-8.2,.3,-4.25),new Vector3(-7.95,3,-1.7))
  for(const group of personal.details){const bounds=new Box3().setFromObject(group);assert.ok(!bounds.isEmpty());assert.ok(room.containsBox(bounds),group.name+' remains indoors');assert.ok(!bounds.intersectsBox(hero));assert.ok(!bounds.intersectsBox(projects));assert.ok(bounds.min.z>-6.4,'no track/opening obstruction');assert.ok(bounds.getSize(new Vector3()).length()<2,'small purposeful objects including header bracket')}
  const plaque=personal.details.find(group=>group.userData.detailId==='rec-pe')
  const backing=plaque.children.find(mesh=>Math.abs(mesh.scale.x-1.1)<1e-6)
  const lightTrimFront=-6.21+.055/2,postFront=-6.4+.3/2
  assert.ok(new Box3().setFromObject(backing).min.z>lightTrimFront,'entire plaque backing is in front of post and light trim')
  const supportBounds=new Box3().setFromObject(plaque.children[0]);assert.ok(supportBounds.min.z<=postFront&&supportBounds.max.z>postFront,'bracket spans header depth to front-mounted plaque')
  assert.ok(supportBounds.max.y>4.07&&supportBounds.min.y<3.5,'bracket reaches existing header and plaque backing')
  r.dispose()
})
test('all five detail centers project inside their existing desktop/mobile framing without new camera paths',()=>{
  const {r,personal}=fixture()
  // Existing renderer policy; this does not modify approved framing or introduce a zoom.
  for(const [width,height] of [[1440,900],[390,844],[320,844]])for(const group of personal.details){const aspect=width/height,views=aspect<1?mobileFramings:framings,view=views[group.userData.zone],camera=new PerspectiveCamera(aspect<.42?74:aspect<1?63:43,aspect,.1,85);camera.position.set(...view.position);camera.lookAt(new Vector3(...view.lookAt));camera.updateMatrixWorld();const point=group.getWorldPosition(new Vector3()).project(camera);assert.ok(point.z>-1&&point.z<1&&Math.abs(point.x)<1&&Math.abs(point.y)<1,group.name+' belongs to existing framing at '+width)}
  r.dispose()
})
test('one static atlas localizes only on language changes; authored wording has no biography/metrics',()=>{
  const {r,personal,texts}=fixture(true);assert.equal(personal.uploads,1);assert.ok(texts.includes('REC / PE'));assert.ok(texts.includes('OBSERVAR'));assert.ok(texts.includes('CONSTÂNCIA'))
  for(let i=0;i<100;i++)personal.updateLocale('pt');assert.equal(personal.uploads,1)
  personal.updateLocale('en');assert.equal(personal.uploads,2);assert.ok(texts.includes('OBSERVE'));assert.ok(texts.includes('CONSISTENCY'));assert.ok(texts.includes('SKETCH · DEMO'))
  const maps=new Set();personal.root.traverse(o=>{if(o instanceof Mesh&&o.material.map?.image?.width===512)maps.add(o.material.map)})
  assert.equal(maps.size,1);assert.equal([...maps][0].image.height,512);r.dispose()
})
test('personal shapes/material/atlas are disposed exactly once by existing resource owner, with bounded topology',()=>{
  const {r,personal}=fixture(),geometries=new Set(),materials=new Set(),textures=new Set();let triangles=0
  personal.root.traverse(o=>{if(o instanceof Mesh){geometries.add(o.geometry);materials.add(o.material);if(o.material.map)textures.add(o.material.map);triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;assert.ok([...o.geometry.attributes.position.array].every(Number.isFinite));assert.ok([...o.geometry.attributes.normal.array].every(Number.isFinite))}})
  assert.ok(triangles<2500,'five small details do not approach car topology cost')
  const disposed=new Map();for(const resource of [...geometries,...materials,...textures]){disposed.set(resource,0);resource.addEventListener('dispose',()=>disposed.set(resource,disposed.get(resource)+1))}
  r.dispose();r.dispose();assert.ok([...disposed.values()].every(count=>count===1))
})
