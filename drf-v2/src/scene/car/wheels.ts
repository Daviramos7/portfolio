import { CylinderGeometry, ExtrudeGeometry, Group, LatheGeometry, MeshStandardMaterial, Shape, Vector2 } from 'three'
import type { Resources } from '../garage/resources.ts'

// Original machined wheel layout. Local X is the axle; Y/Z form both wheel faces.
export function createWheelAssemblies(r: Resources, parent: Group) {
  const tireShape = r.geometry(new LatheGeometry([[.36,-.22],[.53,-.22],[.58,-.17],[.6,-.1],[.6,.1],[.58,.17],[.53,.22],[.36,.22],[.36,-.22]].map(([x,y])=>new Vector2(x,y)),48))
  const rimShape = r.geometry(new LatheGeometry([[.315,-.2],[.36,-.2],[.36,.2],[.315,.2],[.315,-.2]].map(([x,y])=>new Vector2(x,y)),48))
  const discShape = r.geometry(new LatheGeometry([[.075,-.012],[.285,-.012],[.285,.012],[.075,.012],[.075,-.012]].map(([x,y])=>new Vector2(x,y)),40))
  const hubShape = r.geometry(new CylinderGeometry(.083,.083,.065,24))
  const nutShape = r.geometry(new CylinderGeometry(.043,.043,.04,6))
  const spoke = new Shape();spoke.moveTo(-.025,.075);spoke.lineTo(.025,.075);spoke.lineTo(.036,.325);spoke.lineTo(-.036,.325);spoke.closePath()
  const spokeShape = r.geometry(new ExtrudeGeometry(spoke,{depth:.028,bevelEnabled:true,bevelSize:.003,bevelThickness:.003,bevelSegments:1,steps:1}))
  spokeShape.translate(0,0,-.014);spokeShape.rotateY(Math.PI/2)
  const alloy = r.material(new MeshStandardMaterial({color:'#5b6269',metalness:.8,roughness:.48}))
  const brake = r.material(new MeshStandardMaterial({color:'#4e4b45',metalness:.65,roughness:.72}))
  const wheels: Group[]=[]
  for(const z of [-1.6,1.55])for(const side of [-1,1]) {
    const wheel = new Group();wheel.name=`wheel-${z<0?'rear':'front'}-${side<0?'left':'right'}`;wheel.position.set(side*1.3,.605,z);parent.add(wheel);wheels.push(wheel)
    const tire=r.mesh(wheel,tireShape,r.palette.tire);tire.rotation.z=Math.PI/2;tire.name='tire'
    const rim=r.mesh(wheel,rimShape,alloy);rim.rotation.z=Math.PI/2;rim.name='closed-rim'
    const disc=r.mesh(wheel,discShape,brake,[side*-.12,0,0]);disc.rotation.z=Math.PI/2;disc.name='brake-disc'
    const axle=r.rod(wheel,[-.2,0,0],[.2,0,0],.055,r.palette.black);axle.name='axle'
    for(const face of [-1,1]) {
      const hub=r.mesh(wheel,hubShape,alloy,[face*.185,0,0]);hub.rotation.z=Math.PI/2;hub.name='hub-'+face
      for(let n=0;n<8;n++){const arm=r.mesh(wheel,spokeShape,alloy,[face*.17,0,0]);arm.rotation.x=n*Math.PI/4;arm.name='spoke-'+face+'-'+n}
    }
    const nut=r.mesh(wheel,nutShape,r.palette.metal,[side*.24,0,0]);nut.rotation.z=Math.PI/2;nut.name='retaining-nut'
    // Wishbones stop at the upright, outside the tire envelope, rather than piercing the rim.
    const upright=r.rod(parent,[side*1.04,.43,z],[side*1.04,.76,z],.028,alloy);upright.name=wheel.name+'-upright'
    const spindle=r.rod(parent,[side*1.04,.605,z],[side*1.14,.605,z],.045,alloy);spindle.name=wheel.name+'-spindle'
    for(const offset of [-.38,.38]) {
      const lower=r.rod(parent,[side*.32,.36,z+offset],[side*1.04,.46,z],.021,r.palette.carbon);lower.name=wheel.name+'-lower-arm'
      const upper=r.rod(parent,[side*.36,.72,z+offset],[side*1.04,.72,z],.016,r.palette.carbon);upper.name=wheel.name+'-upper-arm'
    }
    r.rod(parent,[side*.48,.84,z-.18],[side*1.04,.5,z],.018,alloy)
  }
  return wheels
}
