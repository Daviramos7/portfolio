import test from 'node:test'
import assert from 'node:assert/strict'
import { Box3, DoubleSide, Raycaster, Vector3 } from 'three'
import { createDRF01 } from '../src/scene/car/DRF01.ts'
import { createResources } from '../src/scene/garage/resources.ts'

function fixture(){
  globalThis.document={createElement:()=>({getContext:()=>null})}
  const resources=createResources(),car=createDRF01(resources)
  car.updateMatrixWorld(true)
  const nose=car.getObjectByName('front-monocoque');nose.material.side=DoubleSide
  return {resources,car,nose}
}
test('front suspension mounts overlap the actual sculpted monocoque surface',()=>{
  const {resources,car,nose}=fixture()
  const mounts=car.children.filter(o=>o.name.startsWith('wheel-front-')&&o.name.endsWith('-mount'))
  assert.equal(mounts.length,10)
  for(const mount of mounts){
    const box=new Box3().setFromObject(mount),side=Math.sign(mount.position.x)
    const start=mount.position.clone();start.x=side>0?box.min.x:box.max.x
    const ray=new Raycaster(start,new Vector3(side,0,0))
    assert.ok(ray.intersectObject(nose).some(hit=>hit.distance<=box.max.x-box.min.x),'mount intersects nose, rather than hovering above it: '+mount.name)
  }
  resources.dispose()
})
test('front arms join mounts and uprights, exit the body once and stay clear of the tire envelope',()=>{
  const {resources,car,nose}=fixture()
  for(const side of ['left','right']){
    const prefix='wheel-front-'+side,wheel=car.getObjectByName(prefix)
    const tireBox=new Box3().setFromObject(wheel.getObjectByName('tire'))
    const inner=Math.min(Math.abs(tireBox.min.x),Math.abs(tireBox.max.x))
    const mounts=car.children.filter(o=>o.name.startsWith(prefix)&&o.name.endsWith('-mount'))
    const uprightBox=new Box3().setFromObject(car.getObjectByName(prefix+'-upright'))
    const arms=car.children.filter(o=>o.name.startsWith(prefix)&&(o.name.endsWith('-arm')||o.name.endsWith('-pushrod')))
    assert.equal(arms.length,5)
    for(const arm of arms){
      arm.geometry.computeBoundingBox();const local=arm.geometry.boundingBox
      const from=new Vector3(0,local.min.y,0).applyMatrix4(arm.matrixWorld),to=new Vector3(0,local.max.y,0).applyMatrix4(arm.matrixWorld)
      assert.ok(mounts.some(m=>new Box3().setFromObject(m).containsPoint(from)))
      assert.ok(uprightBox.containsPoint(to))
      const box=new Box3().setFromObject(arm)
      assert.ok(Math.max(Math.abs(box.min.x),Math.abs(box.max.x))<inner)
      const direction=to.clone().sub(from),length=direction.length()
      const hits=new Raycaster(from,direction.normalize(),0,length).intersectObject(nose)
      assert.ok(hits.every(hit=>hit.distance<length*.15),'only a short attachment segment enters the body')
    }
  }
  resources.dispose()
})
test('small shared mount/joint geometry costs less than one existing tire mesh',()=>{
  const {resources,car}=fixture()
  const additions=car.children.filter(o=>o.name.startsWith('wheel-front-')&&(o.name.endsWith('-mount')||o.name.endsWith('-joint')))
  const count=o=>(o.geometry.index?.count??o.geometry.attributes.position.count)/3
  assert.ok(additions.reduce((sum,o)=>sum+count(o),0)<count(car.getObjectByName('wheel-front-left').getObjectByName('tire')))
  resources.dispose()
})
