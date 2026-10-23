import test from 'node:test'
import assert from 'node:assert/strict'
import { createGarage } from '../src/scene/garage/Garage.ts'
import { createResources } from '../src/scene/garage/resources.ts'

function fixture(level){
  globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>null})}
  const r=createResources();if(level!==undefined)r.setTextAnisotropy(level)
  const {garage}=createGarage(r);garage.updateMatrixWorld(true);return {r,garage}
}
const maps=garage=>{const found=[];garage.traverse(o=>{const map=o.material?.map;if(o.isMesh&&map?.image)found.push({name:o.name,map})});return found}
const isText=({name,map})=>name.startsWith('programme-screen-')||(map.image.width===1024&&map.image.height===256)

test('canvas text surfaces receive the renderer anisotropy before their first upload',()=>{
  const {garage}=fixture(8),all=maps(garage),text=all.filter(isText)
  assert.equal(text.filter(t=>t.name.startsWith('programme-screen-')).length,5,'five programme screens')
  assert.ok(text.length>=10,'screens plus zone/team/programme signs')
  for(const {name,map} of text)assert.equal(map.anisotropy,8,name+' uses anisotropic filtering')
})

test('anisotropy stays scoped to text: material surfaces keep the default filtering',()=>{
  const {garage}=fixture(8),surfaces=[]
  garage.traverse(o=>{for(const key of ['roughnessMap','bumpMap','normalMap','map']){const map=o.material?.[key];if(o.isMesh&&map?.image?.width===256)surfaces.push({name:o.name+':'+key,map})}})
  assert.ok(surfaces.length>0,'procedural material maps are present')
  for(const {name,map} of surfaces)assert.equal(map.anisotropy,1,name)
  const {garage:plain}=fixture()
  for(const {name,map} of maps(plain).filter(isText))assert.equal(map.anisotropy,1,name+' defaults to 1 without a renderer')
})
