import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { Box3, DoubleSide, Group, Mesh, PerspectiveCamera, Raycaster, Vector3 } from 'three'
import { createModelByteCache, createTrackModelLease, parseTrackModel } from '../src/scene/trackside/TrackModel.ts'
import { tracksidePose, tracksideRoute } from '../src/scene/trackside/preparation.ts'
import { framings, mobileFramings } from '../src/scene/camera/framing.ts'
import { createResources } from '../src/scene/garage/resources.ts'
import { createTrackOpening } from '../src/scene/trackside/TrackOpening.ts'

const file=await readFile(new URL('../public/scene/models/drf-sprint-03.glb',import.meta.url)),bytes=file.buffer.slice(file.byteOffset,file.byteOffset+file.byteLength)
const model=()=>parseTrackModel(bytes)
const meshes=root=>{const list=[];root.traverse(o=>{if(o instanceof Mesh)list.push(o)});return list}
test('actual authored GLB loads with bounded topology, five materials, four shared X-axis closed wheel assemblies',async()=>{
  assert.ok(bytes.byteLength<1024*1024)
  const root=await model();root.updateMatrixWorld(true);let triangles=0;const materials=new Set()
  for(const mesh of meshes(root)){for(const name of ['position','normal'])assert.ok([...mesh.geometry.attributes[name].array].every(Number.isFinite));triangles+=(mesh.geometry.index?.count??mesh.geometry.attributes.position.count)/3;materials.add(mesh.material.name)}
  assert.equal(materials.size,5);assert.ok(triangles<15000&&triangles>4000,'bounded meaningful topology, no padding to a target')
  const wheels=[];root.traverse(o=>{if(o.name.startsWith('wheel-'))wheels.push(o)});assert.equal(wheels.length,4)
  const tireGeometries=new Set()
  for(const wheel of wheels){const tire=meshes(wheel).find(o=>o.material.name==='rubber');assert.ok(tire);tireGeometries.add(tire.geometry);const size=new Box3().setFromObject(tire).getSize(new Vector3());assert.ok(size.x<size.y*.6&&Math.abs(size.y-size.z)<.005,'axle X and circular YZ envelope');assert.ok(meshes(wheel).some(o=>o.material.name==='alloy'))}
  assert.equal(tireGeometries.size,1,'four linked wheels share decoded geometry')
  const size=new Box3().setFromObject(root).getSize(new Vector3());assert.ok(size.z/size.y>3&&size.x/size.y>1.4,'car silhouette remains low and wide')
})
test('actual front attachment roots reach solid tub on both sides and carbon arms clear tyre envelope',async()=>{
  const root=await model();root.updateMatrixWorld(true)
  const carbon=root.getObjectByName('body-carbon'),body=root.getObjectByName('body-ivory');assert.ok(carbon&&body)
  for(const m of meshes(body))m.material.side=DoubleSide
  assert.equal(carbon.userData.frontRoots.length,8)
  const vertices=meshes(carbon).flatMap(m=>Array.from({length:m.geometry.attributes.position.count},(_,i)=>new Vector3().fromBufferAttribute(m.geometry.attributes.position,i).applyMatrix4(m.matrixWorld)))
  for(const tuple of carbon.userData.frontRoots){const point=new Vector3(...tuple);assert.ok(vertices.some(v=>v.distanceTo(point)<.04),'metadata root coincides with actual rod geometry');for(const sign of [-1,1]){const hits=new Raycaster(point,new Vector3(sign,0,0),.001,.6).intersectObject(body,true);assert.ok(hits.length,'root lies inside real tub, not beside the nose')}}
  for(const point of vertices.filter(v=>v.z>1.18&&v.z<1.86&&v.y>.2&&v.y<.68))assert.ok(Math.abs(point.x)<.825,'front carbon arm remains inboard of tyre')
})
test('whole GLB has a continuous useful viewport/opening interval in both directions at all approved garage framings',async()=>{
  const root=await model(),event={direction:'left-to-right',durationMs:tracksideRoute.durationMs[0]};let minimum=1
  globalThis.document={createElement:()=>({getContext:()=>null})}
  const resources=createResources(),separator=createTrackOpening(resources).track.getObjectByName('low-paddock-separator')
  for(const width of [1440,390,320])for(const direction of ['left-to-right','right-to-left']){
    const height=width===1440?900:844,aspect=width/height,view=(aspect<1?mobileFramings:framings).garage,camera=new PerspectiveCamera(aspect<.42?74:aspect<1?63:43,aspect,.1,85);camera.position.set(...view.position);camera.lookAt(new Vector3(...view.lookAt));camera.updateMatrixWorld()
    let consecutive=0,best=0
    for(let i=0;i<=400;i++){const pose=tracksidePose({...event,direction},i/400);root.scale.setScalar(tracksideRoute.vehicleScale);root.position.set(...pose.position);root.rotation.y=pose.yaw;root.updateMatrixWorld(true);const box=new Box3().setFromObject(root);assert.ok(box.max.z<-6.8&&box.min.z>separator.position.z+.175,'external lane clearance')
      let inside=true
      // Curved yaw inflates world AABB corners that are not on the model. Use real vertices.
      for(const mesh of meshes(root))for(let v=0;v<mesh.geometry.attributes.position.count&&inside;v++){
        const point=new Vector3().fromBufferAttribute(mesh.geometry.attributes.position,v).applyMatrix4(mesh.matrixWorld),{x,y,z}=point
        const fraction=(-6.4-camera.position.z)/(z-camera.position.z)
        const wallX=camera.position.x+(x-camera.position.x)*fraction,wallY=camera.position.y+(y-camera.position.y)*fraction
        const p=point.project(camera)
        inside&&=wallX>-7.18&&wallX<4.34&&wallY>.1&&wallY<3.9&&Math.abs(p.x)<.99&&Math.abs(p.y)<.99&&p.z>-1&&p.z<1
      }
      consecutive=inside?consecutive+1:0;best=Math.max(best,consecutive)
    }
    minimum=Math.min(minimum,best/400);assert.ok(best/400*event.durationMs>=200,'at least 200ms of whole model inside viewport AND physical opening '+width+' '+direction)
  }
  assert.ok(minimum>0)
  resources.dispose()
})
test('binary cache coalesces successful requests, rejects oversized/HTTP files and retries failure',async()=>{
  let calls=0;const cache=createModelByteCache(async()=>{calls++;return new Response(calls===1?'missing':bytes,{status:calls===1?404:200})})
  await assert.rejects(cache('/model'));const [a,b]=await Promise.all([cache('/model'),cache('/model')]);assert.equal(calls,2);assert.equal(a,b)
  await assert.rejects(createModelByteCache(async()=>new Response(new ArrayBuffer(1024*1024+1)))('/large'))
})
test('lease handles late cancellation, fallback, repeated load and disposal exactly once without touching shared palette',async()=>{
  const root=await model(),geometries=new Set(meshes(root).map(m=>m.geometry)),materials=new Set(meshes(root).map(m=>m.material)),counts=[]
  for(const resource of [...geometries,...materials]){const record={n:0};counts.push(record);resource.addEventListener('dispose',()=>record.n++)}
  let resolve,attached=0;const lease=createTrackModelLease(()=>attached++,{bytes:()=>new Promise(r=>resolve=r),parse:async()=>root})
  const waiting=lease.load('/model');assert.equal(lease.load('/model'),waiting);lease.dispose();resolve(bytes);await waiting;lease.dispose();assert.equal(attached,0);assert.equal(lease.status,'disposed');assert.ok(counts.every(c=>c.n===1))
  const broken=createTrackModelLease(()=>assert.fail('no attach on error'),{bytes:async()=>{throw Error('404')},parse:model});await broken.load('/missing');assert.equal(broken.status,'fallback');broken.dispose()
  const mounted=await model(),parent=new Group(),active=createTrackModelLease(root=>parent.add(root),{bytes:async()=>bytes,parse:async()=>mounted});await active.load('/ok');assert.equal(active.status,'loaded');active.dispose();assert.equal(parent.children.length,0)
})
