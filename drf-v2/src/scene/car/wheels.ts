import { CylinderGeometry, ExtrudeGeometry, Group, LatheGeometry, MeshStandardMaterial, Shape, SphereGeometry, TorusGeometry, Vector2 } from 'three'
import type { Resources } from '../garage/resources.ts'

// Original machined wheel layout. Local X is the axle; Y/Z form both wheel faces.
export function createWheelAssemblies(r: Resources, parent: Group) {
  const tireShape = r.geometry(new LatheGeometry([[.36,-.22],[.53,-.22],[.58,-.17],[.6,-.1],[.6,.1],[.58,.17],[.53,.22],[.36,.22],[.36,-.22]].map(([x,y])=>new Vector2(x,y)),48))
  const rimShape = r.geometry(new LatheGeometry([[.315,-.2],[.36,-.2],[.36,.2],[.315,.2],[.315,-.2]].map(([x,y])=>new Vector2(x,y)),48))
  const discShape = r.geometry(new LatheGeometry([[.075,-.012],[.285,-.012],[.285,.012],[.075,.012],[.075,-.012]].map(([x,y])=>new Vector2(x,y)),40))
  const hubShape = r.geometry(new CylinderGeometry(.083,.083,.065,24))
  const nutShape = r.geometry(new CylinderGeometry(.043,.043,.04,6))
  const spoke = new Shape();spoke.moveTo(-.025,.075);spoke.quadraticCurveTo(-.01,.2,.018,.32);spoke.lineTo(.06,.32);spoke.quadraticCurveTo(.045,.19,.025,.075);spoke.closePath()
  const spokeShape = r.geometry(new ExtrudeGeometry(spoke,{depth:.05,bevelEnabled:true,bevelSize:.007,bevelThickness:.007,bevelSegments:2,steps:1,curveSegments:6}))
  spokeShape.translate(0,0,-.025);spokeShape.rotateY(Math.PI/2)
  const beadShape = r.geometry(new TorusGeometry(.35,.012,8,48));beadShape.rotateY(Math.PI/2)
  const alloy = r.material(new MeshStandardMaterial({color:'#85919b',metalness:.85,roughness:.32}))
  const brake = r.material(new MeshStandardMaterial({color:'#4e4b45',metalness:.65,roughness:.72}))
  const mountShape=r.geometry(new CylinderGeometry(.045,.045,.1,8))
  const jointShape=r.geometry(new SphereGeometry(.026,8,6))
  const wheels: Group[]=[]
  for(const z of [-1.6,1.55])for(const side of [-1,1]) {
    const wheel = new Group();wheel.name=`wheel-${z<0?'rear':'front'}-${side<0?'left':'right'}`;wheel.position.set(side*1.3,.605,z);parent.add(wheel);wheels.push(wheel)
    const tire=r.mesh(wheel,tireShape,r.palette.tire);tire.rotation.z=Math.PI/2;tire.name='tire'
    const rim=r.mesh(wheel,rimShape,alloy);rim.rotation.z=Math.PI/2;rim.name='closed-rim'
    const disc=r.mesh(wheel,discShape,brake,[side*-.12,0,0]);disc.rotation.z=Math.PI/2;disc.name='brake-disc'
    const axle=r.rod(wheel,[-.2,0,0],[.2,0,0],.055,r.palette.black);axle.name='axle'
    for(const face of [-1,1]) {
      const bead=r.mesh(wheel,beadShape,alloy,[face*.205,0,0]);bead.name='machined-rim-lip-'+face
      const hub=r.mesh(wheel,hubShape,alloy,[face*.185,0,0]);hub.rotation.z=Math.PI/2;hub.name='hub-'+face
      for(let n=0;n<8;n++){const arm=r.mesh(wheel,spokeShape,alloy,[face*.17,0,0]);arm.rotation.x=n*Math.PI/4;arm.name='spoke-'+face+'-'+n}
    }
    const nut=r.mesh(wheel,nutShape,r.palette.metal,[side*.24,0,0]);nut.rotation.z=Math.PI/2;nut.name='retaining-nut'
    // Wishbones stop at the upright, outside the tire envelope, rather than piercing the rim.
    const upright=r.rod(parent,[side*1.04,.43,z],[side*1.04,.76,z],.028,alloy);upright.name=wheel.name+'-upright'
    const spindle=r.rod(parent,[side*1.04,.605,z],[side*1.14,.605,z],.045,alloy);spindle.name=wheel.name+'-spindle'
    for(const offset of [-.38,.38]) {
      const front=z>0, aft=offset<0
      const lowerPoint: readonly [number,number,number]=front?[side*(aft?.245:.18),aft?.35:.34,aft?.95:1.65]:[side*.32,.36,z+offset]
      const upperPoint: readonly [number,number,number]=front?[side*(aft?.245:.18),aft?.5:.44,aft?.95:1.65]:[side*.36,.72,z+offset]
      const lower=r.rod(parent,lowerPoint,[side*1.04,.46,z],.021,r.palette.carbon);lower.name=wheel.name+'-lower-arm'
      const upper=r.rod(parent,upperPoint,[side*1.04,.72,z],.016,r.palette.carbon);upper.name=wheel.name+'-upper-arm'
      if(front)for(const [kind,point] of [['lower',lowerPoint],['upper',upperPoint]] as const){
        const mount=r.mesh(parent,mountShape,alloy,point);mount.rotation.z=Math.PI/2;mount.name=wheel.name+'-'+kind+'-mount'
      }
    }
    if(z>0) {
      for(const y of [.46,.72])r.mesh(parent,jointShape,alloy,[side*1.04,y,z]).name=wheel.name+'-upright-joint'
      const mount=r.mesh(parent,mountShape,alloy,[side*.28,.6,.5]);mount.rotation.z=Math.PI/2;mount.name=wheel.name+'-pushrod-mount'
      r.rod(parent,[side*.28,.6,.5],[side*1.04,.5,z],.018,alloy).name=wheel.name+'-pushrod'
    }else r.rod(parent,[side*.48,.84,z-.18],[side*1.04,.5,z],.018,alloy)
  }
  return wheels
}
