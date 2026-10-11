import { CanvasTexture, Group, MeshBasicMaterial, PlaneGeometry, SRGBColorSpace, Vector3 } from 'three'
import type { Camera } from 'three'
import type { Locale, SceneProps, ZoneId } from '../../contracts/index.ts'
import type { Resources, Vec3 } from './resources.ts'
import { bodyFont, displayFont, fitCanvasBlocks, wrapCanvasText } from './canvasText.ts'

export function screenPresentation(zone: ZoneId, index: SceneProps['contentIndex'], locale: Locale, projectId: string | null) {
  const selected = zone === 'garage' ? index.find(e => e.zoneId === zone && e.projectId === projectId) : undefined
  const entry = selected ?? index.find(e => e.zoneId === zone && e.projectId === null)
  return { title: entry?.label[locale] ?? 'DRF-01', lines: entry?.screenLines?.map(line => line[locale]) ?? [] }
}

// Demonstration cursor only: never a changing business metric or fabricated timeline.
export function screenActivity(zone: ZoneId, timeMs: number, publicNodes = 1): readonly [number,number] {
  const phase=(timeMs%12000)/12000
  if(zone==='garage')return [90,155+190*(.5-.5*Math.cos(phase*Math.PI*2))]
  if(zone==='telemetry')return [45+phase*250,225+Math.sin(phase*44*.24)*43+Math.cos(phase*44*.53)*15]
  if(zone==='pit-wall')return [78,145+110*Math.min(Math.max(0,publicNodes-1),Math.floor(phase*Math.max(1,publicNodes)))]
  if(zone==='driver-profile')return [170+84*Math.cos(phase*Math.PI*2),216+84*Math.sin(phase*Math.PI*2)]
  const points=[[93,163],[248,244],[106,363]], segment=Math.floor(phase*3),t=phase*3-segment
  return [points[segment][0]*(1-t)+points[(segment+1)%3][0]*t,points[segment][1]*(1-t)+points[(segment+1)%3][1]*t]
}

// Original canvas diagrams; source text is supplied solely by the Lead's scene projection.
export function createProgrammeScreen(r: Resources, parent: Group, zone: ZoneId, size: readonly [number, number], position: Vec3) {
  const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 512
  const ctx = canvas.getContext('2d'), map = r.texture(new CanvasTexture(canvas)); map.colorSpace = SRGBColorSpace
  const material = r.material(new MeshBasicMaterial({ map, toneMapped: false }))
  const object = r.mesh(parent, r.geometry(new PlaneGeometry(...size)), material, position)
  object.name = 'programme-screen-' + zone; object.castShadow = false
  const activity=new Group();object.add(activity)
  const marker=r.mesh(activity,r.geometry(new PlaneGeometry(size[0]*10/1024,size[1]*10/512)),r.material(new MeshBasicMaterial({color:'#f3d0ab',toneMapped:false})),[0,0,.004])
  marker.userData.dynamic=true;marker.castShadow=false;marker.name='demo-cursor-'+zone
  const [initialX,initialY]=screenActivity(zone,0)
  marker.position.set((initialX/1024-.5)*size[0],(.5-initialY/512)*size[1],.004)
  const projected=new Vector3();let publicNodes=1
  let previous = ''
  let lastInput: readonly [SceneProps['contentIndex'], Locale, string | null] = [[], 'pt', null]
  function update(index: SceneProps['contentIndex'], locale: Locale, projectId: string | null) {
    lastInput=[index,locale,projectId]
    const presentation = screenPresentation(zone,index,locale,projectId), key = JSON.stringify([locale,presentation])
    if (!ctx || key === previous) return
    previous = key; object.userData.screenPresentation = presentation
    publicNodes=Math.min(3,Math.max(1,presentation.lines.length))
    const en = locale === 'en'
    ctx.fillStyle = '#0c1720'; ctx.fillRect(0,0,1024,512)
    ctx.fillStyle = '#132934'; ctx.fillRect(20,20,300,472)
    ctx.strokeStyle = '#39616e'; ctx.lineWidth = 2; ctx.strokeRect(20,20,984,472)
    const path = (points: readonly (readonly [number,number])[], color = '#80c7d1', close = false) => {
      ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));if(close)ctx.closePath();ctx.stroke()
    }
    const text = (label: string, x: number, y: number, width: number, font = 28) => {
      ctx.font = `700 ${font}px ${displayFont}`;ctx.fillStyle = '#dbe8ec'
      const lines=wrapCanvasText(label,width,value=>ctx.measureText(value).width)
      for(const line of lines){ctx.fillText(line,x,y);y+=font*1.3}return y
    }
    if(zone==='garage') {
      path([[166,96],[198,96],[207,208],[239,292],[232,367],[209,399],[151,399],[128,367],[121,292],[153,208]],'#80c7d1',true)
      for(const y of [155,345]) { path([[88,y],[272,y]]);for(const x of [90,245]){ctx.fillStyle='#050b11';ctx.fillRect(x,y-25,26,50);ctx.strokeStyle='#8ea2aa';ctx.strokeRect(x,y-25,26,50)} }
      path([[137,106],[225,106]]);path([[126,389],[236,389]])
      ctx.strokeStyle='#db5064';ctx.strokeRect(162,245,35,66)
      text('DRF-01',48,58,250,28);text(en?'Original prototype':'Protótipo original',48,455,248,22)
    } else if(zone==='telemetry') {
      text('DEMO',48,58,240,30)
      for(let y=115;y<=385;y+=54)path([[45,y],[295,y]],'#244854')
      for(let x=45;x<=295;x+=50)path([[x,115],[x,385]],'#244854')
      for(const [offset,color]of [[0,'#80c7d1'],[75,'#d84863']] as const){const p=Array.from({length:45},(_,i)=>[45+i*5.6,225+offset+Math.sin(i*.24)*43+Math.cos(i*.53)*15] as const);path(p,color)}
      text(en?'Ambient demonstration':'Demonstração ambiental',45,427,254,23)
    } else if(zone==='pit-wall') {
      text(en?'EXPERIENCE':'EXPERIÊNCIA',45,60,254,25)
      const count = Math.min(3,Math.max(1,presentation.lines.length))
      if(count>1)path([[78,145],[78,145+(count-1)*110]])
      for(let n=0;n<count;n++){ctx.fillStyle=n===0?'#df5064':'#80c7d1';ctx.beginPath();ctx.arc(78,145+n*110,10,0,Math.PI*2);ctx.fill();path([[94,145+n*110],[272,145+n*110]])}
      text(en?'Public record':'Registro público',45,455,254,22)
    } else if(zone==='driver-profile') {
      text(en?'IDENTITY':'IDENTIDADE',45,60,254,27)
      ctx.strokeStyle='#80c7d1';ctx.lineWidth=4;ctx.beginPath();ctx.arc(170,216,84,0,Math.PI*2);ctx.stroke()
      text('DRF',114,231,180,44);path([[70,343],[272,343]]);path([[70,365],[231,365]])
      text(en?'Profile / education':'Perfil / formação',45,455,254,22)
    } else {
      text(en?'INTERESTS':'INTERESSES',45,60,254,27)
      path([[93,163],[248,244],[106,363],[93,163]])
      for(const [x,y]of [[93,163],[248,244],[106,363]]){ctx.fillStyle='#183845';ctx.fillRect(x-24,y-24,48,48);ctx.strokeStyle='#80c7d1';ctx.strokeRect(x-24,y-24,48,48)}
      text(en?'Areas of interest':'Áreas de interesse',45,455,254,22)
    }
    ctx.font=`500 16px ${bodyFont}`;ctx.fillStyle='#d0a785';ctx.fillText(en?'DEMO · ambient cursor':'DEMO · indicador ambiente',45,485)
    const lines: readonly string[] = presentation.lines.length ? presentation.lines : [en?'Details in reading':'Detalhes na leitura']
    const selected=zone==='garage'&&index.some(entry=>entry.zoneId===zone&&entry.projectId===projectId&&projectId!==null)
    const copy=[presentation.title,...lines.map((line,i)=>selected?`${i===0?'STACK':en?'STATUS':'ESTADO'} · ${line}`:line)]
    const layout=fitCanvasBlocks(ctx,copy,616,414)
    object.userData.textLayout=layout;object.userData.textFits=layout.fits
    for(const [index,block] of layout.blocks.entries()){
      ctx.font=`${index===0?700:500} ${block.font}px ${block.family}`;ctx.fillStyle=index===0?'#f0f4f2':'#dbe8ec'
      const start=49+block.y+block.font
      block.lines.forEach((line,i)=>ctx.fillText(line,350,start+i*block.font*1.3))
      if(index===0){ctx.fillStyle='#b7314c';ctx.fillRect(350,start+(block.lines.length-1)*block.font*1.3+8,120,3)}
    }
    if(!layout.fits){ctx.font=`500 26px ${bodyFont}`;ctx.fillStyle='#f0d0af';ctx.fillText(en?'Full text in reading':'Texto integral na leitura',350,260)}
    map.needsUpdate = true
  }
  // Every surface has a diagram even before optional presentation data arrives.
  update([],'pt',null)
  r.onFontsReady?.(()=>{previous='';update(...lastInput)})
  function updateAmbient(timeMs:number,camera:Camera) {
    object.getWorldPosition(projected);projected.project(camera)
    if(projected.z<=-1||projected.z>=1||Math.abs(projected.x)>1.15||Math.abs(projected.y)>1.15)return
    const [x,y]=screenActivity(zone,timeMs,publicNodes)
    marker.position.set((x/1024-.5)*size[0],(.5-y/512)*size[1],.004)
    // A single public experience still has activity, without adding fictitious nodes.
    if(zone==='pit-wall')marker.scale.setScalar(1+.45*(.5-.5*Math.cos(timeMs*Math.PI*2/8000)))
  }
  return {object,update,updateAmbient,get uploadVersion(){return map.version}}
}
