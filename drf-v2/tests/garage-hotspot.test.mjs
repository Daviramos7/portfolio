import test from 'node:test'
import assert from 'node:assert/strict'
import { clampHeroTooltip } from '../src/scene/garageRenderer.ts'

test('hero tooltip stays between actual header/showcase bounds, including tall bilingual copy',()=>{
  for(const width of [320,390,1440])for(const height of [74,92]){
    const free={left:8,right:width-8,top:154,bottom:368},label={width:width<640?135:190,height}
    const button={left:width*.5-22,top:306,width:44,height:44},rect=clampHeroTooltip(button,label,free)
    assert.ok(rect.fits);assert.ok(rect.left>=free.left&&rect.left+label.width<=free.right)
    assert.ok(rect.top>=free.top&&rect.top+height<=free.bottom)
  }
  assert.equal(clampHeroTooltip({left:20,top:40,width:44,height:44},{width:190,height:300},{left:8,right:312,top:154,bottom:368}).fits,false,'never claim fit for an impossible free area')
})
