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
  for(const material of json.materials??[]){delete material.pbrMetallicRoughness?.baseColorTexture;delete material.normalTexture}
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
    // Fila 22d: the figure also carries a normal map (strands and beard grain) on TEXCOORD_1.
    assert.equal(json.images?.length,spec.id==='figure'?2:1,spec.id+' images')
    // Fila 22b: the figure is modelled by script with a flat-colour palette (PNG, nearest filtering), not a photo.
    assert.equal(json.images[0].mimeType,spec.id==='figure'?'image/png':'image/jpeg',spec.id+' image type')
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
  assert.deepEqual(requested.slice(3).sort(),['amplificador-512','case-guitarra-512','guitarra-512'],'phones fetch the 512 px variants (fila 22)')
  await eggs.setZone('pit-wall')
  assert.equal(requested.length,6,'a station is fetched once')
  await eggs.setQuality('low','light')
  assert.equal(hidden.visible,false,'Leve goes back to the selection')
  await eggs.setZone('strategy-room')
  assert.equal(requested.length,6,'Leve never downloads more')
  eggs.dispose()
})

// M16 fila 22: the light profile fetches a variant with the same mesh and UVs and a 512 px texture (desktop unchanged).
const jpegSize=bytes=>{const b=new Uint8Array(bytes);for(let i=2;i<b.length;){const marker=b[i+1],length=b[i+2]<<8|b[i+3];if(marker>=0xc0&&marker<=0xc2)return[b[i+7]<<8|b[i+8],b[i+5]<<8|b[i+6]];i+=2+length}return null}
const glbParts=bytes=>{const view=new DataView(bytes),length=view.getUint32(12,true),json=gltfJson(bytes),bin=new Uint8Array(bytes,28+length,view.getUint32(20+length,true));return{json,view:index=>{const v=json.bufferViews[index];return bin.subarray(v.byteOffset??0,(v.byteOffset??0)+v.byteLength)}}}
test('light variants keep the mesh and UVs and carry a 512 px texture',async()=>{
  const lighter=easterEggModels.filter(spec=>spec.lightUrl)
  assert.deepEqual(lighter.map(spec=>spec.id).sort(),easterEggModels.filter(spec=>spec.tier==='full').map(spec=>spec.id).sort())
  for(const spec of lighter){
    const full=glbParts(await bytesOf(spec.url)),light=glbParts(await bytesOf(spec.lightUrl))
    assert.deepEqual(light.json.accessors,full.json.accessors,spec.id+' accessors')
    assert.deepEqual(light.json.meshes,full.json.meshes,spec.id+' meshes')
    for(const accessor of full.json.accessors) assert.deepEqual(light.view(accessor.bufferView),full.view(accessor.bufferView),spec.id+' vertex data')
    assert.deepEqual(jpegSize(light.view(light.json.images[0].bufferView).slice().buffer),[512,512],spec.id+' light texture')
    assert.deepEqual(jpegSize(full.view(full.json.images[0].bufferView).slice().buffer),[1024,1024],spec.id+' desktop texture')
  }
})

test('the figure is the scripted model: palette texture with nearest filtering, one mesh, under 15k triangles',async()=>{
  const spec=easterEggModels.find(item=>item.id==='figure'),bytes=await bytesOf(spec.url),json=gltfJson(bytes)
  const pbr=json.materials[0].pbrMetallicRoughness,base=json.textures[pbr.baseColorTexture.index]
  assert.equal(json.samplers?.[base.sampler]?.magFilter,9728,'nearest mag filter keeps the colour cells clean')
  const normal=json.materials[0].normalTexture
  assert.ok(normal&&normal.texCoord===1,'normal map on the second UV set')
  assert.ok(json.meshes[0].primitives.every(p=>p.attributes.TEXCOORD_1!==undefined),'second uv set')
  assert.equal(json.meshes.length,1)
  const root=await parse(bytes);let triangles=0;root.traverse(o=>{if(o instanceof Mesh)triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3})
  assert.ok(triangles<=15000,'triangles '+triangles)
  const size=new Box3().setFromObject(root).getSize(new Vector3())
  assert.ok(Math.abs(size.y-.18)<.002,'height '+size.y)
  assert.ok(bytes.byteLength<450000,'bytes '+bytes.byteLength) // 22d: +normal map and second UV set (~410 kB)
})
