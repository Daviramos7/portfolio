import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { Box3, Mesh, Raycaster, Vector3 } from 'three'
import { createResources } from '../src/scene/garage/resources.ts'
import { createGarage } from '../src/scene/garage/Garage.ts'
import { createTrackOpening } from '../src/scene/trackside/TrackOpening.ts'
import { tracksidePose, tracksideRoute } from '../src/scene/trackside/preparation.ts'
import { createTrackModelLease, parseTrackModel } from '../src/scene/trackside/TrackModel.ts'
import { prepareRollingWheels } from '../src/scene/trackside/wheelRolling.ts'

function fixture(){globalThis.document={createElement:()=>({getContext:()=>null})};const r=createResources(),garage=createGarage(r).garage,opening=createTrackOpening(r);garage.updateMatrixWorld(true);opening.track.updateMatrixWorld(true);const finish=garage.children.find(o=>o.material===r.palette.floor&&o.geometry?.type==='PlaneGeometry');return {r,garage,opening,finish}}
const top=o=>new Box3().setFromObject(o).max.y

test('actual garage finish, exterior lane and apron join at grade, without coplanar finish overlap or a retaining platform',()=>{
  const {r,opening,finish}=fixture(),lane=opening.track.getObjectByName('supported-service-lane'),apron=opening.track.getObjectByName('level-service-apron')
  const inside=top(finish),laneBounds=new Box3().setFromObject(lane),insideBounds=new Box3().setFromObject(finish)
  assert.ok(Math.abs(laneBounds.max.y-inside)<.001,'road meets actual garage floor height, not a raised shelf')
  assert.ok(inside-top(apron)>=0&&inside-top(apron)<.01,'small apron drainage fall, no metre-scale step')
  assert.ok(laneBounds.max.z<=insideBounds.min.z+1e-6,'floor finishes touch at their edge, without coincident overlapping planes')
  for(const z of [-5,-6.4,-7.8,-8.6,-12,-27]){
    const ray=new Raycaster(new Vector3(0,3,z),new Vector3(0,-1,0)),hit=ray.intersectObjects([finish,apron,lane])[0]
    assert.ok(hit&&Math.abs(hit.point.y-inside)<.01,'continuous ground across opening and lane at '+z)
  }
  const separator=opening.track.getObjectByName('low-paddock-separator'),bounds=new Box3().setFromObject(separator)
  assert.ok(Math.abs(bounds.min.y-laneBounds.max.y)<.001,'barrier has a grounded base after lane lowering')
  assert.ok(bounds.max.y-inside<.5)
  assert.equal(opening.track.getObjectByName('service-lane-access-ramp'),undefined,'elevated platform access removed')
  r.dispose()
})

test('all four real GLB tyres remain supported through rolling and reversed route, without sinking or floating',async()=>{
  const {r,opening}=fixture(),bytes=await readFile(new URL('../public/scene/models/drf-sprint-03.glb',import.meta.url)),root=await parseTrackModel(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength))
  const wheels=[];root.traverse(o=>{if(o.name.startsWith('wheel-'))wheels.push(o)});assert.equal(wheels.length,4)
  const rolling=prepareRollingWheels(root,()=>{},tracksideRoute.vehicleScale),lease=createTrackModelLease(()=>{},{bytes:async()=>bytes,parse:async()=>root});await lease.load('/fixture')
  const ground=['supported-service-lane','level-service-apron','curve-exit-road'].map(name=>opening.track.getObjectByName(name))
  let greatestGap=0
  for(const direction of ['left-to-right','right-to-left'])for(let i=0;i<=100;i++){
    const pose=tracksidePose({direction},i/100);root.position.set(...pose.position);root.rotation.y=pose.yaw;root.scale.setScalar(tracksideRoute.vehicleScale);rolling.update(pose.distance);root.updateMatrixWorld(true)
    for(const wheel of wheels){
      const bounds=new Box3();wheel.traverse(o=>{if(!(o instanceof Mesh))return;const vertices=o.geometry.getAttribute('position');for(let v=0;v<vertices.count;v++)bounds.expandByPoint(new Vector3().fromBufferAttribute(vertices,v).applyMatrix4(o.matrixWorld))})
      const center=wheel.getWorldPosition(new Vector3()),ray=new Raycaster(new Vector3(center.x,3,center.z),new Vector3(0,-1,0)),hit=ray.intersectObjects(ground)[0]
      assert.ok(hit,'paved surface below every tyre, not just route center');const gap=bounds.min.y-hit.point.y;greatestGap=Math.max(greatestGap,gap)
      assert.ok(gap>-.001&&gap<.012,'contact tolerance limited to small faceted-tread clearance')
    }
  }
  assert.ok(greatestGap<.012);rolling.restore();lease.dispose();r.dispose()
})
