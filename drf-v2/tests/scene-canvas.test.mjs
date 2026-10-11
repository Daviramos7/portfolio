import test from 'node:test'
import assert from 'node:assert/strict'
import { fitCanvasBlocks, wrapCanvasText } from '../src/scene/garage/canvasText.ts'
import { createResources } from '../src/scene/garage/resources.ts'
import { createPersonalDetails, personalDetailDescriptions } from '../src/scene/garage/personalDetails.ts'
import { Box3 } from 'three'

test('measured wrapping preserves long words and paragraphs without horizontal compression',()=>{
  const input='Análise municipal\nABCDEFGHIJKLMNOPQRSTUVWXYZ · produção'
  const measure=text=>Array.from(text).length*8
  const lines=wrapCanvasText(input,96,measure)
  assert.ok(lines.every(line=>measure(line)<=96))
  assert.equal(lines.join('').replace(/\s/g,''),input.replace(/\s/g,''))
  const ctx={font:'',measureText(text){return {width:text.length*parseFloat(this.font.split(' ')[1])*.5}}}
  const layout=fitCanvasBlocks(ctx,['Projeto municipal com título longo','STACK · TypeScript · React · PostgreSQL','ESTADO · Produto em desenvolvimento'],616,414)
  assert.ok(layout.fits&&layout.height<=414);assert.ok(layout.blocks.every(block=>block.font>=18))
  assert.equal(fitCanvasBlocks(ctx,['x '.repeat(10000)],616,414).fits,false,'overflow is explicit, never claims fit via tiny font')
})

test('font completion redraws once and invalidates demand rendering; disposal cancels late callbacks',async()=>{
  let pending=[];globalThis.document={createElement:()=>({getContext:()=>null}),fonts:{load:()=>new Promise(resolve=>pending.push(resolve))}}
  let invalidations=0,redraws=0;const r=createResources(()=>invalidations++)
  r.onFontsReady(()=>redraws++);pending.forEach(resolve=>resolve([{}]));await new Promise(resolve=>setImmediate(resolve))
  assert.equal(redraws,1);assert.equal(invalidations,1);r.dispose()
  pending=[];const late=createResources(()=>assert.fail('disposed surface cannot request a frame'))
  late.onFontsReady(()=>assert.fail('disposed surface cannot upload'));late.dispose();pending.forEach(resolve=>resolve([{}]));await new Promise(resolve=>setImmediate(resolve))
})

test('five passive descriptions and rounded controller remain scoped; grips clear the existing worktop',()=>{
  globalThis.document={createElement:()=>({getContext:()=>null})};const r=createResources(),personal=createPersonalDetails(r)
  assert.equal(Object.keys(personalDetailDescriptions).length,5)
  for(const description of Object.values(personalDetailDescriptions)){assert.ok(description.pt.length<90&&description.en.length<90);assert.doesNotMatch(description.pt+' '+description.en,/passivo|alegação|Passive|claimed/)}
  const controller=personal.details.find(detail=>detail.userData.detailId==='control-360')
  assert.ok(controller.getObjectByName('rounded-controller-shell'));assert.ok(controller.children.every(child=>child.geometry?.type!=='BoxGeometry'),'no intrusive front block')
  personal.root.updateMatrixWorld(true);assert.ok(new Box3().setFromObject(controller).min.y>=1.045,'rounded grips stay above worktop, not sunk into it')
  r.dispose()
})
