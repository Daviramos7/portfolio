import { CanvasTexture, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry, RepeatWrapping, SRGBColorSpace, TorusGeometry, Vector2 } from 'three'
import type { Locale, ZoneId } from '../../contracts/index.ts'
import type { Resources, Vec3 } from './resources.ts'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { bodyFont, displayFont } from './canvasText.ts'
import { createGamepad, gamepadBadgePosition } from './gamepad.ts'
import { createPropModelLease } from './propModel.ts'
import type { PropModelLimits } from './propModel.ts'

export const personalDetailDescriptions: Record<ZoneId, Record<Locale, string>> = {
  garage: {pt:'REC/PE — ponte e mar na placa da abertura.',en:'REC/PE — bridge and sea on the opening plaque.'},
  'pit-wall': {pt:'Três cores — um estojo autoral na bancada do pit wall.',en:'Three colours — an original case on the pit wall bench.'},
  telemetry: {pt:'Observar, testar, iterar — um laboratório de ideias na bancada.',en:'Observe, test, iterate — a laboratory of ideas on the bench.'},
  'strategy-room': {pt:'DRF — uma pausa para jogar, na bancada de estratégia.',en:'DRF — a gaming break, on the strategy bench.'},
  'driver-profile': {pt:'Constância — um handgrip na área do perfil.',en:'Consistency — a handgrip in the profile area.'},
}
// Exactly five authored, passive discoveries. These are visual allusions, not biography/data.
// M16 4b: the two details on the rear consoles follow the desks down 0.2 m (Garage.ts consoleDrop).
export const personalDetailLayout: readonly { id: string; zone: ZoneId; position: Vec3; yaw: number }[] = [
  { id:'rec-pe', zone:'garage', position:[-3.92,3.05,-6.09], yaw:0 },
  { id:'three-tone-case', zone:'pit-wall', position:[4.46,.97,-4.12], yaw:0 },
  { id:'science-note', zone:'telemetry', position:[-7.22,1.19,-4.18], yaw:.18 },
  { id:'control-360', zone:'strategy-room', position:[7.09,1.5,3.08], yaw:-Math.PI/2 },
  { id:'constancy-grip', zone:'driver-profile', position:[-6.96,.998,2.9], yaw:Math.PI/2 },
]

// M16 fila 09: generated mesh cleaned in Blender (docs/production/ASSETS.md). The file is authored at real size
// (0.17 m tall, origin at the base); the scene enlarges it like the other desk props, to the height the procedural
// stand-in already occupied, and seats it on the "constância" plaque. Same station, same framing.
export const handgripPlacement = {
  url:'models/props/handgrip.glb', position:[0,-.205,.025] as Vec3, scale:2.35,
  limits:{longest:[.12,.22],triangles:12000} as PropModelLimits,
}
// Silver anodised aluminium with a diamond knurl (our own height field, no image asset) and a black steel spring.
function handgripMaterials(r: Resources) {
  const size=128,diamonds=4
  const canvases=[0,1].map(()=>{const canvas=document.createElement('canvas');canvas.width=canvas.height=size;return canvas})
  const [normalContext,roughContext]=canvases.map(canvas=>canvas.getContext('2d'))
  const [normalImage,roughImage]=[normalContext,roughContext].map(context=>context?.createImageData(size,size))
  if(normalContext&&roughContext&&normalImage&&roughImage){
    const ridge=(t: number)=>1-Math.abs(((t%1)+1)%1*2-1)
    // Two crossed groove families leave pyramids between them; the period divides the tile, so it wraps.
    const height=(x: number,y: number)=>Math.min(ridge((x+y)*diamonds/size),ridge((x-y)*diamonds/size))
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      const nx=(height(x-1,y)-height(x+1,y))*2.2,ny=(height(x,y-1)-height(x,y+1))*2.2,length=Math.hypot(nx,ny,1),i=(y*size+x)*4
      normalImage.data[i]=(nx/length*.5+.5)*255;normalImage.data[i+1]=(ny/length*.5+.5)*255;normalImage.data[i+2]=(1/length*.5+.5)*255;normalImage.data[i+3]=255
      // Grooves stay matt, worn peaks catch the light.
      roughImage.data[i]=roughImage.data[i+1]=roughImage.data[i+2]=255-height(x,y)*70;roughImage.data[i+3]=255
    }
    normalContext.putImageData(normalImage,0,0);roughContext.putImageData(roughImage,0,0)
  }
  const [normalMap,roughnessMap]=canvases.map(canvas=>{const map=r.texture(new CanvasTexture(canvas));map.wrapS=map.wrapT=RepeatWrapping;map.repeat.set(14,14);return map})
  return {
    aluminium:r.material(new MeshStandardMaterial({name:'handgrip-aluminium',color:'#a4abb1',metalness:.92,roughness:.46,envMapIntensity:.7,normalMap,normalScale:new Vector2(.55,.55),roughnessMap})),
    // Dark steel, glossy enough for the coils to read against the dark locker behind the station.
    spring:r.material(new MeshStandardMaterial({name:'handgrip-spring',color:'#1d2125',metalness:.85,roughness:.3,envMapIntensity:1.1})),
  }
}

export function createPersonalDetails(r: Resources, dependencies?: Parameters<typeof createPropModelLease>[2]) {
  const root=new Group();root.name='five-personal-details'
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512
  const ctx=canvas.getContext('2d')
  const atlas=r.textTexture(new CanvasTexture(canvas));atlas.colorSpace=SRGBColorSpace
  const ink=r.material(new MeshBasicMaterial({map:atlas,toneMapped:false}))
  const {black,white,paint,metal,tire}=r.palette
  const coil=r.geometry(new TorusGeometry(.07,.016,6,20))
  let locale: Locale | null=null, uploads=0
  function updateLocale(next: Locale) {
    if(locale===next)return
    locale=next
    if(!ctx)return
    ctx.clearRect(0,0,512,512)
    for(let tile=0;tile<4;tile++){
      ctx.save();ctx.translate(tile%2*256,Math.floor(tile/2)*256)
      ctx.fillStyle=tile===1?'#e7e0ca':'#16252d';ctx.fillRect(0,0,256,256)
      ctx.strokeStyle=tile===1?'#32474b':'#92bbc3';ctx.lineWidth=4
      ctx.fillStyle=tile===1?'#243d42':'#edf1e6'
      if(tile===0){
        // M16 fila 19: redrawn as an original street plate (enamel blue, white inset border); same words and drawing.
        ctx.fillStyle='#1d4a78';ctx.fillRect(0,0,256,256)
        ctx.strokeStyle='#eef1ea';ctx.lineWidth=5;ctx.beginPath();ctx.roundRect(7,7,242,242,14);ctx.stroke();ctx.lineWidth=4
        ctx.fillStyle='#eef1ea';ctx.font=`700 60px ${displayFont}`;ctx.fillText('REC / PE',20,66)
        // Invented bridge elevation and waves: no copied skyline, seal or municipal mark.
        ctx.beginPath();ctx.moveTo(18,162);ctx.lineTo(238,162)
        for(const x of [70,182]){ctx.moveTo(x,165);ctx.lineTo(x,105);ctx.lineTo(x+8,105);ctx.lineTo(x+8,165)}
        ctx.moveTo(25,151);ctx.quadraticCurveTo(126,76,232,151);ctx.stroke()
        for(const y of [197,222]){ctx.beginPath();ctx.moveTo(16,y);for(let x=16;x<=240;x+=28)ctx.quadraticCurveTo(x+7,y-8,x+14,y);ctx.stroke()}
      }else if(tile===1){
        ctx.font=`700 34px ${displayFont}`
        const words=next==='pt'?['OBSERVAR','TESTAR','ITERAR']:['OBSERVE','TEST','ITERATE']
        words.forEach((word,i)=>ctx.fillText(word,14,43+i*49))
        ctx.beginPath();ctx.moveTo(211,34);ctx.lineTo(211,130);ctx.lineTo(242,180);ctx.lineTo(182,180);ctx.closePath();ctx.stroke()
        for(const y of [36,85,134]){ctx.beginPath();ctx.arc(211,y,9,0,Math.PI*2);ctx.stroke()}
        ctx.beginPath();ctx.moveTo(29,174);ctx.lineTo(29,213);ctx.lineTo(149,213);ctx.moveTo(29,201);ctx.bezierCurveTo(72,206,80,169,145,183);ctx.stroke()
        ctx.font=`500 15px ${bodyFont}`;ctx.fillText(next==='pt'?'ESBOÇO · DEMO':'SKETCH · DEMO',14,245)
      }else if(tile===2){
        ctx.font=`700 86px ${displayFont}`;ctx.textAlign='center';ctx.fillText('DRF',128,158) // fila 25: own monogram, no third-party mark
        ctx.beginPath();ctx.arc(128,128,113,.15,Math.PI*1.88);ctx.stroke()
      }else{
        ctx.textAlign='center';ctx.font=`700 36px ${displayFont}`;ctx.fillText(next==='pt'?'CONSTÂNCIA':'CONSISTENCY',128,116)
        for(let x=53;x<=203;x+=30){ctx.beginPath();ctx.moveTo(x,149);ctx.lineTo(x,190);ctx.stroke()}
      }
      ctx.restore()
    }
    atlas.needsUpdate=true;uploads++
  }
  function graphic(parent: Group,tile: number,size: readonly [number,number],position: Vec3) {
    const shape=r.geometry(new PlaneGeometry(...size)),uv=shape.getAttribute('uv')
    for(let i=0;i<uv.count;i++)uv.setXY(i,(uv.getX(i)+tile%2)/2,(uv.getY(i)+1-Math.floor(tile/2))/2)
    const object=r.mesh(parent,shape,ink,position);object.castShadow=false;return object
  }
  const details=personalDetailLayout.map(layout=>{
    const group=new Group();group.name='personal-detail-'+layout.id;group.userData.detailId=layout.id;group.userData.zone=layout.zone
    group.position.set(...layout.position);group.rotation.y=layout.yaw;root.add(group);return group
  })
  const [rec,kit,note,control,grip]=details
  // Raised front stand-off joins the post face and clears trim/monitor sightlines.
  r.rod(rec,[-.56,1.15,-.25],[0,.33,-.07],.035,metal)
  r.box(rec,[1.1,.74,.055],[0,0,-.035],metal)
  graphic(rec,0,[1.02,.66],[0,0,0])
  r.mesh(kit,r.geometry(new RoundedBoxGeometry(.92,.2,.46,1,.035)),black).name='case-body'
  r.mesh(kit,r.geometry(new RoundedBoxGeometry(.94,.055,.48,1,.022)),metal,[0,.126,0])
  // Entire stripe slab stands in front of the body's +Z face; no coplanar back/front.
  for(const [i,material] of [paint,white,black].entries())r.box(kit,[.26,.13,.014],[-.27+i*.27,0,.247],material).name='case-front-stripe-'+i
  for(const x of [-.35,.35])r.box(kit,[.035,.055,.035],[x,.02,.24],metal)
  const handle=r.geometry(new TorusGeometry(.13,.018,6,18,Math.PI))
  r.mesh(kit,handle,tire,[0,.17,.03])
  for(const x of [-.28,.28])r.rod(kit,[x,.08,-.24],[x+.1,.08,-.24],.024,metal)
  r.box(note,[.63,.52,.045],[0,0,-.015],black)
  graphic(note,1,[.59,.48],[0,0,.012]);note.rotation.x=-.16
  r.rod(note,[-.27,-.23,-.02],[-.27,-.23,-.18],.02,metal)
  r.rod(note,[.27,-.23,-.02],[.27,-.23,-.18],.02,metal)
  createGamepad(r,control)
  graphic(control,2,[.105,.105],gamepadBadgePosition)
  // Rear support ends below the shell, never hiding grips or face controls.
  for(const x of [-.27,.27])r.rod(control,[x,-.43,-.11],[x,-.1,-.11],.025,black)
  // Tilt in the object's local frame: both grips remain above the worktop after station yaw.
  control.rotation.order='YXZ'
  control.rotation.x=-.3
  // Procedural stand-in: stays if the GLB is missing, invalid or still loading.
  const gripFallback=new Group();gripFallback.name='handgrip-procedural-fallback';grip.add(gripFallback)
  r.mesh(gripFallback,coil,metal,[0,.13,0])
  r.rod(gripFallback,[-.035,.11,0],[-.16,-.11,0],.024,metal);r.rod(gripFallback,[.035,.11,0],[.16,-.11,0],.024,metal)
  r.rod(gripFallback,[-.09,.015,.01],[-.17,-.13,.01],.046,tire);r.rod(gripFallback,[.09,.015,.01],[.17,-.13,.01],.046,tire)
  // Kept out of the static instanced batches so it can leave the scene when the model arrives.
  gripFallback.traverse(object=>{object.userData.dynamic=true})
  const handgripLease=createPropModelLease(model=>{
    const {aluminium,spring}=handgripMaterials(r)
    model.name='handgrip-model';model.position.set(...handgripPlacement.position);model.scale.setScalar(handgripPlacement.scale)
    model.traverse(object=>{
      if(!(object instanceof Mesh))return
      const source=Array.isArray(object.material)?object.material[0]:object.material
      object.material=source?.name==='handgrip-spring'?spring:aluminium;object.castShadow=object.receiveShadow=true
    })
    gripFallback.removeFromParent();grip.add(model)
  },handgripPlacement.limits,dependencies)
  r.box(grip,[.56,.16,.055],[0,-.285,.025],black)
  graphic(grip,3,[.53,.15],[0,-.285,.058])
  r.box(grip,[.55,.025,.29],[0,-.375,0],metal)
  updateLocale('pt')
  r.onFontsReady?.(()=>{const current=locale??'pt';locale=null;updateLocale(current)})
  return {root,details,updateLocale,get uploads(){return uploads},
    // Asynchronous and optional: the scene is complete without it.
    loadModels:(url?: string)=>handgripLease.load(url??new URL(handgripPlacement.url,document.baseURI).href),
    disposeModels:()=>handgripLease.dispose(),
    get handgripStatus(){return handgripLease.status}}
}
