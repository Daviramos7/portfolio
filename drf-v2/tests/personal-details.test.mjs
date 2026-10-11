import test from 'node:test'
import assert from 'node:assert/strict'
import { Box3, Mesh, PerspectiveCamera, Raycaster, Vector3 } from 'three'
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
  assert.ok(triangles<4500,'bounded authored controller surfaces; five details remain below one third of the 13710-triangle track model')
  const disposed=new Map();for(const resource of [...geometries,...materials,...textures]){disposed.set(resource,0);resource.addEventListener('dispose',()=>disposed.set(resource,disposed.get(resource)+1))}
  r.dispose();r.dispose();assert.ok([...disposed.values()].every(count=>count===1))
})

test('case stripe slabs clear the real body surface with outward normals and independent ray depth',()=>{
  const {r,personal}=fixture(),kit=personal.details[1],body=kit.getObjectByName('case-body')
  const bodyBounds=new Box3().setFromObject(body)
  for(let i=0;i<3;i++){
    const stripe=kit.getObjectByName('case-front-stripe-'+i),bounds=new Box3().setFromObject(stripe)
    assert.ok(bounds.min.z>bodyBounds.max.z,'entire slab clears body, not just one coplanar face')
    assert.equal(stripe.material.polygonOffset,false)
    const origin=stripe.getWorldPosition(new Vector3());origin.z+=1
    const ray=new Raycaster(origin,new Vector3(0,0,-1)),stripeHit=ray.intersectObject(stripe)[0],bodyHit=ray.intersectObject(body)[0]
    assert.ok(stripeHit&&bodyHit);assert.ok(bodyHit.distance-stripeHit.distance>.01)
    assert.ok(stripeHit.face.normal.z>.99,'stripe facing the observer uses outward +Z normal')
  }
  r.dispose()
})

test('authored controller has distinct non-overlapping controls and physically seated face/rear assemblies',()=>{
  const {r,personal}=fixture(),pad=personal.details[3].getObjectByName('authored-gamepad'),shell=pad.getObjectByName('rounded-controller-shell'),face=pad.getObjectByName('gamepad-domed-face')
  // Actual vertices in pad space, avoiding phantom AABB overlap from the station yaw/tilt.
  const inverse=pad.matrixWorld.clone().invert()
  const bounds=o=>{const box=new Box3();o.traverse(mesh=>{if(!mesh.geometry)return;const matrix=mesh.matrixWorld.clone().premultiply(inverse),vertices=mesh.geometry.getAttribute('position');for(let i=0;i<vertices.count;i++)box.expandByPoint(new Vector3().fromBufferAttribute(vertices,i).applyMatrix4(matrix))});return box}
  const shellBounds=bounds(shell),faceBounds=bounds(face)
  for(const [x,y] of [[0,.12],[-.3,.08],[.3,.08]]){
    const ray=new Raycaster(new Vector3(x,y,1).applyMatrix4(pad.matrixWorld),new Vector3(0,0,-1).transformDirection(pad.matrixWorld))
    const front=ray.intersectObject(face)[0],back=ray.intersectObject(shell)[0]
    assert.ok(front&&back&&front.distance<back.distance,'domed face must not be cut by the underlying shell')
  }
  const buttons=pad.children.filter(o=>o.name.startsWith('gamepad-face-button-'))
  assert.equal(buttons.length,4)
  const sticks=pad.children.filter(o=>o.name.startsWith('gamepad-stick-'));assert.equal(sticks.length,2)
  assert.ok(sticks[0].position.x<0&&sticks[1].position.x>0&&sticks[0].position.y>sticks[1].position.y,'asymmetric upper/lower thumb placement')
  const dpad=pad.getObjectByName('gamepad-dpad')
  for(const [i,b] of buttons.entries()){
    assert.ok(!bounds(b).intersectsBox(bounds(dpad)))
    for(const s of sticks)assert.ok(!bounds(b).intersectsBox(bounds(s)))
    for(const other of buttons.slice(i+1))assert.ok(!bounds(b).intersectsBox(bounds(other)))
    const seat=pad.getObjectByName('gamepad-button-seat-'+i)
    assert.ok(bounds(seat).intersectsBox(bounds(b)))
    assert.ok(bounds(seat).intersectsBox(faceBounds),'button foot enters face instead of floating')
  }
  for(const side of [-1,1]){
    const bumper=pad.getObjectByName('gamepad-bumper-'+side),trigger=pad.getObjectByName('gamepad-trigger-'+side)
    assert.ok(bounds(bumper).intersectsBox(shellBounds));assert.ok(bounds(trigger).intersectsBox(shellBounds))
    assert.ok(trigger.position.z<bumper.position.z,'trigger sits behind face and bumper')
  }
  assert.equal(new Set(buttons.map(b=>b.geometry)).size,1,'face caps share geometry')
  assert.ok(shell.geometry===face.geometry,'shell/face reuse a single curved mesh')
  const cap=sticks[0].getObjectByName('stick-concave-cap').geometry.getAttribute('position');let center=-Infinity,rim=-Infinity
  for(let i=0;i<cap.count;i++){const radius=Math.hypot(cap.getX(i),cap.getY(i));if(radius<.01)center=Math.max(center,cap.getZ(i));else rim=Math.max(rim,cap.getZ(i))}
  assert.ok(rim>center,'thumb cap has a recessed center and raised rim')
  assert.ok(face.material!==shell.material&&face.material!==sticks[0].getObjectByName('stick-concave-cap').material)
  const normals=shell.geometry.getAttribute('normal');for(let i=0;i<normals.count;i++){const length=Math.hypot(normals.getX(i),normals.getY(i),normals.getZ(i));assert.ok(Number.isFinite(length)&&length>.9&&length<1.1)}
  r.dispose()
})
