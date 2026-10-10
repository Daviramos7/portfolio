import { CanvasTexture, CylinderGeometry, ExtrudeGeometry, Group, MeshBasicMaterial, PlaneGeometry, Shape, SRGBColorSpace, TorusGeometry } from 'three'
import type { Locale, ZoneId } from '../../contracts/index.ts'
import type { Resources, Vec3 } from './resources.ts'

// Exactly five authored, passive discoveries. These are visual allusions, not biography/data.
export const personalDetailLayout: readonly { id: string; zone: ZoneId; position: Vec3; yaw: number }[] = [
  { id:'rec-pe', zone:'garage', position:[-4.48,2.55,-6.19], yaw:0 },
  { id:'three-tone-case', zone:'pit-wall', position:[4.46,1.17,-4.12], yaw:0 },
  { id:'science-note', zone:'telemetry', position:[-7.25,1.25,-4.4], yaw:0 },
  { id:'control-360', zone:'strategy-room', position:[7.09,1.27,3.08], yaw:-Math.PI/2 },
  { id:'constancy-grip', zone:'driver-profile', position:[-6.96,.81,3.05], yaw:Math.PI/2 },
]

export function createPersonalDetails(r: Resources) {
  const root=new Group();root.name='five-personal-details'
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512
  const ctx=canvas.getContext('2d')
  const atlas=r.texture(new CanvasTexture(canvas));atlas.colorSpace=SRGBColorSpace
  const ink=r.material(new MeshBasicMaterial({map:atlas,toneMapped:false}))
  const {black,white,paint,metal,tire}=r.palette
  const knob=r.geometry(new CylinderGeometry(.045,.045,.04,12));knob.rotateX(Math.PI/2)
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
        ctx.font='700 54px sans-serif';ctx.fillText('REC / PE',16,62)
        // Invented bridge elevation and waves: no copied skyline, seal or municipal mark.
        ctx.beginPath();ctx.moveTo(18,162);ctx.lineTo(238,162)
        for(const x of [70,182]){ctx.moveTo(x,165);ctx.lineTo(x,105);ctx.lineTo(x+8,105);ctx.lineTo(x+8,165)}
        ctx.moveTo(25,151);ctx.quadraticCurveTo(126,76,232,151);ctx.stroke()
        for(const y of [197,222]){ctx.beginPath();ctx.moveTo(16,y);for(let x=16;x<=240;x+=28)ctx.quadraticCurveTo(x+7,y-8,x+14,y);ctx.stroke()}
      }else if(tile===1){
        ctx.font='700 28px sans-serif'
        const words=next==='pt'?['OBSERVAR','TESTAR','ITERAR']:['OBSERVE','TEST','ITERATE']
        words.forEach((word,i)=>ctx.fillText(word,14,43+i*49))
        ctx.beginPath();ctx.moveTo(211,34);ctx.lineTo(211,130);ctx.lineTo(242,180);ctx.lineTo(182,180);ctx.closePath();ctx.stroke()
        for(const y of [36,85,134]){ctx.beginPath();ctx.arc(211,y,9,0,Math.PI*2);ctx.stroke()}
        ctx.beginPath();ctx.moveTo(29,174);ctx.lineTo(29,213);ctx.lineTo(149,213);ctx.moveTo(29,201);ctx.bezierCurveTo(72,206,80,169,145,183);ctx.stroke()
        ctx.font='500 15px sans-serif';ctx.fillText(next==='pt'?'ESBOÇO · DEMO':'SKETCH · DEMO',14,245)
      }else if(tile===2){
        ctx.font='700 112px sans-serif';ctx.textAlign='center';ctx.fillText('360',128,165)
        ctx.beginPath();ctx.arc(128,128,113,.15,Math.PI*1.88);ctx.stroke()
      }else{
        ctx.textAlign='center';ctx.font='700 31px sans-serif';ctx.fillText(next==='pt'?'CONSTÂNCIA':'CONSISTENCY',128,116)
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
  r.box(rec,[1.1,.74,.055],[0,0,-.035],metal)
  graphic(rec,0,[1.02,.66],[0,0,0])
  r.box(kit,[.88,.2,.43],[0,0,0],black)
  for(const [i,material] of [paint,white,black].entries())r.box(kit,[.26,.13,.014],[-.27+i*.27,0,.223],material)
  for(const x of [-.35,.35])r.box(kit,[.035,.055,.035],[x,.02,.24],metal)
  r.rod(kit,[-.13,.11,0],[-.13,.17,0],.018,metal);r.rod(kit,[.13,.11,0],[.13,.17,0],.018,metal);r.rod(kit,[-.13,.17,0],[.13,.17,0],.018,metal)
  r.box(note,[.52,.43,.045],[0,0,-.015],black)
  graphic(note,1,[.48,.39],[0,0,.012]);note.rotation.x=-.16
  // Original asymmetric pad: no official silhouette, letter keys, logo or branded colors.
  const shell=new Shape();shell.moveTo(-.42,-.07);shell.lineTo(-.32,.15);shell.lineTo(-.12,.19);shell.lineTo(.08,.19);shell.lineTo(.4,.1);shell.lineTo(.36,-.16);shell.lineTo(.21,-.23);shell.lineTo(.09,-.08);shell.lineTo(-.12,-.08);shell.lineTo(-.28,-.25);shell.closePath()
  r.mesh(control,r.geometry(new ExtrudeGeometry(shell,{depth:.08,bevelEnabled:true,bevelSize:.018,bevelThickness:.018,bevelSegments:1,steps:1})),white)
  graphic(control,2,[.18,.18],[0,.065,.103])
  for(const p of [[-.2,.045,.13],[.21,-.04,.13]] as const)r.mesh(control,knob,tire,p)
  r.box(control,[.07,.023,.02],[.23,.11,.11],metal);r.box(control,[.023,.07,.02],[.23,.11,.11],metal)
  r.box(control,[.48,.03,.26],[0,-.225,-.025],black);control.rotation.x=-.22
  r.mesh(grip,coil,metal,[0,.13,0])
  r.rod(grip,[-.035,.11,0],[-.16,-.11,0],.024,metal);r.rod(grip,[.035,.11,0],[.16,-.11,0],.024,metal)
  r.rod(grip,[-.09,.015,.01],[-.17,-.13,.01],.046,tire);r.rod(grip,[.09,.015,.01],[.17,-.13,.01],.046,tire)
  r.box(grip,[.56,.16,.055],[0,-.105,.025],black)
  graphic(grip,3,[.53,.15],[0,-.105,.058])
  r.box(grip,[.55,.025,.29],[0,-.195,0],metal)
  updateLocale('pt')
  return {root,details,updateLocale,get uploads(){return uploads}}
}
