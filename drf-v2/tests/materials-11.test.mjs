import test from 'node:test'
import assert from 'node:assert/strict'
import { MeshPhysicalMaterial, ShaderLib } from 'three'
import { createGarage } from '../src/scene/garage/Garage.ts'
import { createResources } from '../src/scene/garage/resources.ts'
import { objectSpaceFinish, setBrushedAnisotropy } from '../src/scene/garage/surfaceFinish.ts'

// M16 fila 11 (materiais): contract of the finishes. Appearance itself is judged on the prints, not here.
function fixture(){
  globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>null})}
  const r=createResources(),{garage}=createGarage(r);garage.updateMatrixWorld(true);return {r,garage}
}

test('carbon shows its weave under a lacquer coat; rubber and paints are not metallic',()=>{
  const {r}=fixture(),{carbon,tire,red,white,black,panel}=r.palette
  assert.ok(carbon.clearcoat>=.5&&carbon.clearcoatRoughness<=.3,'carbon has a visible clearcoat')
  assert.ok(carbon.map&&carbon.map===carbon.roughnessMap&&carbon.normalMap,'twill field drives albedo, roughness and relief')
  assert.equal(carbon.metalness,0)
  assert.ok(tire.roughness>=.95&&tire.metalness===0&&tire.envMapIntensity<=.3,'rubber is matte')
  for(const [name,paint] of Object.entries({red,white,black,panel})){
    assert.ok(paint.metalness<=.1,name+' is a coating, not metal')
    assert.ok(paint.roughness>=.5,name+' is satin or matte')
  }
})

test('brushed aluminium is anisotropic only when the renderer asks for it (balanced)',()=>{
  const {r}=fixture(),{metal}=r.palette
  assert.ok(metal instanceof MeshPhysicalMaterial&&metal.roughnessMap&&metal.normalMap)
  assert.equal(metal.anisotropy,0,'off by default: low quality never pays for it')
  const version=metal.version
  setBrushedAnisotropy(metal,true);assert.ok(metal.anisotropy>0&&metal.version>version,'balanced recompiles with anisotropy')
  const enabled=metal.version;setBrushedAnisotropy(metal,true);assert.equal(metal.version,enabled,'no recompile when unchanged')
  setBrushedAnisotropy(metal,false);assert.equal(metal.anisotropy,0)
})

test('epoxy floor carries absolute roughness in its map and keeps the M15 grade',()=>{
  const {r,garage}=fixture(),{floor}=r.palette
  assert.equal(floor.roughness,1);assert.equal(floor.metalness,0);assert.ok(floor.roughnessMap&&floor.normalMap&&floor.map)
  const top=garage.children.find(o=>o.material===floor&&o.geometry?.type==='PlaneGeometry')
  assert.equal(top.position.y,-.007,'floor grade is untouched')
})

test('texture budget: every procedural material map stays at or under 1024 px, and the count did not grow',()=>{
  const {r}=fixture(),maps=new Set()
  for(const material of Object.values(r.palette))for(const value of Object.values(material))if(value?.isTexture)maps.add(value)
  assert.equal(maps.size,10,'carbon 2, metal 2, painted 2, rubber 1, floor 3 (same ten as before the mission)')
  for(const map of maps)assert.ok(map.image.width<=1024&&map.image.height<=1024,'map of '+map.image.width+' px')
})

test('object-space finish patches the stock shader at anchors that exist in this three release',()=>{
  const {r}=fixture()
  for(const name of ['carbon','paint','panel','structure','polymer','black','red','white','metal']){
    const material=r.palette[name],lib=material instanceof MeshPhysicalMaterial?ShaderLib.physical:ShaderLib.standard
    const shader={uniforms:{},vertexShader:lib.vertexShader,fragmentShader:lib.fragmentShader}
    material.onBeforeCompile(shader)
    assert.ok(shader.uniforms.drfWear&&shader.uniforms.drfWearColor,name+' receives its wear uniforms')
    assert.match(shader.vertexShader,/#include <project_vertex>\s+mat4 drfMatrix/,name+' vertex anchor')
    assert.match(shader.fragmentShader,/#include <roughnessmap_fragment>\s+\{\s+float drfMacro/,name+' fragment anchor')
    assert.match(shader.vertexShader,/attribute float drfCube;[\s\S]*void main\(\) \{/)
  }
  assert.equal(r.palette.floor.onBeforeCompile.toString(),new MeshPhysicalMaterial().onBeforeCompile.toString(),'floor keeps its own UVs')
  assert.equal(r.palette.tire.onBeforeCompile.toString(),new MeshPhysicalMaterial().onBeforeCompile.toString(),'tyre keeps its lathe UVs')
})

test('only the shared unit cube is marked for edge wear, and wear settings stay per material',()=>{
  const {garage}=fixture();let marked=0,unmarked=0
  garage.traverse(o=>{if(!o.isMesh)return;if(o.geometry.getAttribute('drfCube'))marked++;else unmarked++})
  assert.ok(marked>0&&unmarked>0)
  garage.traverse(o=>{const flag=o.isMesh&&o.geometry.getAttribute('drfCube');if(flag){assert.equal(o.geometry.type,'BoxGeometry');assert.equal(flag.count,o.geometry.getAttribute('position').count)}})
  const a={uniforms:{},vertexShader:ShaderLib.standard.vertexShader,fragmentShader:ShaderLib.standard.fragmentShader},b={...a,uniforms:{}}
  objectSpaceFinish(new MeshPhysicalMaterial(),{edge:.2}).onBeforeCompile(a);objectSpaceFinish(new MeshPhysicalMaterial(),{edge:.4}).onBeforeCompile(b)
  assert.equal(a.uniforms.drfWear.value.x,.2);assert.equal(b.uniforms.drfWear.value.x,.4)
})
