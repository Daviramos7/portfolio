import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { Box3, Mesh, Vector3 } from 'three'
import { parseTrackModel } from '../src/scene/trackside/TrackModel.ts'
import { createEasterEggs, easterEggModels } from '../src/scene/garage/easterEggs.ts'
import { createResources } from '../src/scene/garage/resources.ts'

// M16 fila 19: every committed easter egg file fits the limits the scene enforces, and `low` asks for the selection only.
const bytesOf=async url=>{const file=await readFile(new URL('../public/'+url,import.meta.url));return file.buffer.slice(file.byteOffset,file.byteOffset+file.byteLength)}

test('each easter egg GLB is grounded, centred and inside its own limits',async()=>{
  for(const spec of easterEggModels){
    const root=await parseTrackModel(await bytesOf(spec.url));root.updateMatrixWorld(true)
    let triangles=0;root.traverse(o=>{if(o instanceof Mesh)triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3})
    const box=new Box3().setFromObject(root),size=box.getSize(new Vector3()),longest=Math.max(size.x,size.y,size.z)
    assert.ok(longest>=spec.limits.longest[0]&&longest<=spec.limits.longest[1],spec.id+' longest '+longest)
    assert.ok(triangles>0&&triangles<=spec.limits.triangles,spec.id+' triangles '+triangles)
    assert.ok(Math.abs(box.min.y)<1e-3,spec.id+' rests on its origin')
  }
})

test('low downloads only the all-tier selection; balanced adds the rest, each file once',async()=>{
  globalThis.document={createElement:()=>({getContext:()=>null}),baseURI:'http://local/'}
  const requested=[]
  const eggs=createEasterEggs(createResources(),{bytes:url=>{requested.push(url);return bytesOf(url.replace('http://local/',''))},parse:parseTrackModel})
  await eggs.setQuality('low')
  assert.equal(requested.length,0,'nothing before load is requested')
  await eggs.load('http://local/')
  const selection=easterEggModels.filter(spec=>spec.tier==='all').map(spec=>spec.id)
  assert.deepEqual(selection.sort(),['caneca','capacete','figure'])
  assert.equal(requested.length,3)
  const hidden=eggs.root.getObjectByName('easter-egg-setlists');assert.equal(hidden.visible,false)
  await eggs.setQuality('balanced')
  assert.equal(requested.length,easterEggModels.length)
  assert.equal(hidden.visible,true)
  assert.ok(Object.values(eggs.status).every(status=>status==='loaded'))
  eggs.dispose()
})
