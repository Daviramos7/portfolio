import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { Box3, Mesh, Vector3 } from 'three'
import { parseTrackModel } from '../src/scene/trackside/TrackModel.ts'
import { createEasterEggs, easterEggModels } from '../src/scene/garage/easterEggs.ts'
import { createResources } from '../src/scene/garage/resources.ts'

// M16 fila 19: every committed easter egg file fits the limits the scene enforces, and `low` asks for the selection only.
const bytesOf=async url=>{const file=await readFile(new URL('../public/'+url,import.meta.url));return file.buffer.slice(file.byteOffset,file.byteOffset+file.byteLength)}
// Node has no image decoder: geometry tests parse a copy of the GLB without its texture (the texture itself is
// checked through the GLB JSON below and decoded by the browser in the smoke run).
const withoutImages=bytes=>{
  const view=new DataView(bytes),jsonLength=view.getUint32(12,true),json=JSON.parse(new TextDecoder().decode(new Uint8Array(bytes,20,jsonLength)))
  delete json.images;delete json.textures;delete json.samplers
  for(const material of json.materials??[])delete material.pbrMetallicRoughness?.baseColorTexture
  let text=JSON.stringify(json);while(text.length%4)text+=' '
  const head=new TextEncoder().encode(text),rest=new Uint8Array(bytes,20+jsonLength),out=new Uint8Array(20+head.length+rest.length),outView=new DataView(out.buffer)
  outView.setUint32(0,0x46546c67,true);outView.setUint32(4,2,true);outView.setUint32(8,out.length,true);outView.setUint32(12,head.length,true);outView.setUint32(16,0x4e4f534a,true)
  out.set(head,20);out.set(rest,20+head.length);return out.buffer
}
const parse=bytes=>parseTrackModel(withoutImages(bytes))

test('each easter egg GLB is grounded, centred and inside its own limits',async()=>{
  for(const spec of easterEggModels){
    const root=await parse(await bytesOf(spec.url));root.updateMatrixWorld(true)
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
  const eggs=createEasterEggs(createResources(),{bytes:url=>{requested.push(url);return bytesOf(url.replace('http://local/',''))},parse})
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

// M16 fila 21: colour is a projected FLUX image stored in each GLB (one JPEG base colour texture, UVs present).
const gltfJson=bytes=>{const view=new DataView(bytes),length=view.getUint32(12,true);return JSON.parse(new TextDecoder().decode(new Uint8Array(bytes,20,length)))}
test('each easter egg GLB carries one JPEG base colour texture and UVs',async()=>{
  for(const spec of easterEggModels){
    const json=gltfJson(await bytesOf(spec.url))
    assert.equal(json.images?.length,1,spec.id+' images')
    assert.equal(json.images[0].mimeType,'image/jpeg',spec.id+' jpeg')
    assert.ok(json.materials?.[0]?.pbrMetallicRoughness?.baseColorTexture,spec.id+' base colour texture')
    assert.ok(json.meshes.every(mesh=>mesh.primitives.every(p=>p.attributes.TEXCOORD_0!==undefined)),spec.id+' uv')
  }
})

test('phones on Auto show all twelve: selection first, then each station when it is framed',async()=>{
  globalThis.document={createElement:()=>({getContext:()=>null}),baseURI:'http://local/'}
  const requested=[]
  const eggs=createEasterEggs(createResources(),{bytes:url=>{requested.push(url.split('/').pop().replace('.glb',''));return bytesOf(url.replace('http://local/',''))},parse})
  await eggs.setQuality('low','auto')
  await eggs.load('http://local/')
  assert.deepEqual([...requested].sort(),['caneca','capacete','figure'],'opening load is the selection alone')
  const hidden=eggs.root.getObjectByName('easter-egg-setlists');assert.equal(hidden.visible,true,'all twelve are shown')
  await eggs.setZone('pit-wall')
  assert.deepEqual(requested.slice(3).sort(),['amplificador','case-guitarra','guitarra'])
  await eggs.setZone('pit-wall')
  assert.equal(requested.length,6,'a station is fetched once')
  await eggs.setQuality('low','light')
  assert.equal(hidden.visible,false,'Leve goes back to the selection')
  await eggs.setZone('strategy-room')
  assert.equal(requested.length,6,'Leve never downloads more')
  eggs.dispose()
})
