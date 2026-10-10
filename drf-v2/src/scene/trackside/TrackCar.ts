import { BufferGeometry, CylinderGeometry, Float32BufferAttribute, Group, LatheGeometry, Mesh, Vector2, Vector3 } from 'three'
import type { Material } from 'three'
import type { Resources, Vec3 } from '../garage/resources.ts'

// Original DRF track prototype: narrow white tub, deep-red aero, exposed running gear.
// Lower tessellation than the garage hero; no external model, logo or driver likeness.
export function createTrackCar(r: Resources) {
  const car = new Group(); car.name = 'DRF-track-02-original-single-seater'
  const { white, paint, carbon, black, metal, tire } = r.palette
  const rodShape=r.geometry(new CylinderGeometry(1,1,1,8))
  function rod(parent: Group, from: Vec3, to: Vec3, radius: number, material: Material) {
    const a=new Vector3(...from), b=new Vector3(...to), delta=b.clone().sub(a)
    const object=r.mesh(parent,rodShape,material);object.position.copy(a.add(b).multiplyScalar(.5))
    object.scale.set(radius,delta.length(),radius);object.quaternion.setFromUnitVectors(new Vector3(0,1,0),delta.normalize());return object
  }
  function shell(name: string, sections: readonly (readonly [number, number, number, number])[], material: Material, x = 0) {
    const points: number[] = [], indices: number[] = [], sides = 12
    for (const [z, width, low, high] of sections) for (let i = 0; i < sides; i++) {
      const angle = i / sides * Math.PI * 2
      points.push(x + Math.sin(angle) * width, (low + high) / 2 + Math.cos(angle) * (high - low) / 2, z)
    }
    for (let ring = 0; ring < sections.length - 1; ring++) for (let i = 0; i < sides; i++) {
      const a = ring * sides + i, b = ring * sides + (i + 1) % sides
      indices.push(a, a + sides, b, b, a + sides, b + sides)
    }
    for (const end of [0, sections.length - 1]) for (let i = 1; i < sides - 1; i++) {
      const a = end * sides
      if (end === 0) indices.push(a, a + i, a + i + 1)
      else indices.push(a, a + i + 1, a + i)
    }
    const shape = r.geometry(new BufferGeometry()); shape.setAttribute('position', new Float32BufferAttribute(points, 3)); shape.setIndex(indices); shape.computeVertexNormals()
    const object = r.mesh(car, shape, material); object.name = name; return object
  }
  shell('exposed-floor', [[-1.9,.66,.13,.18],[.8,.69,.13,.18],[1.85,.18,.13,.18]], carbon)
  shell('tapered-nose', [[-.1,.3,.25,.59],[.65,.28,.25,.56],[1.55,.15,.22,.38],[2.1,.095,.2,.31]], white)
  shell('engine-cover', [[-1.9,.18,.23,.48],[-1.25,.32,.23,.77],[-.55,.24,.23,.88]], white)
  // Separate cockpit walls leave the seat/opening hollow, rather than a glass roof.
  for (const side of [-1,1]) {
    shell('cockpit-shoulder-'+side,[[-.6,.075,.27,.72],[.12,.065,.27,.65],[.4,.035,.28,.56]],white,side*.29)
    shell('sculpted-sidepod-'+side,[[-1.65,.16,.2,.4],[-.6,.24,.22,.57],[.25,.23,.22,.53],[.5,.14,.22,.4]],paint,side*.56)
    r.box(car,[.035,.18,.32],[side*.78,.42,.35],black).name='sidepod-inlet-'+side
    rod(car,[side*.28,.68,-.55],[side*.2,1.04,-.72],.028,carbon)
    rod(car,[side*.2,1.04,-.72],[side*.2,1.04,-.45],.028,carbon)
    rod(car,[side*.2,1.04,-.45],[0,.72,.35],.022,carbon)
    rod(car,[side*.21,.65,.25],[side*.57,.69,.25],.012,metal)
    r.box(car,[.17,.06,.1],[side*.59,.7,.25],paint)
  }
  r.box(car,[.38,.12,.45],[0,.37,-.2],black).name='open-cockpit-seat'
  const head = r.geometry(new LatheGeometry([[.0,-.08],[.13,-.08],[.15,.02],[.11,.12],[0,.14]].map(([x,y])=>new Vector2(x,y)),16))
  r.mesh(car,head,paint,[0,.8,-.27]).name='abstract-protective-helmet'
  rod(car,[0,.94,-.7],[0,1.06,-.7],.06,carbon).name='roll-hoop'
  // Aero chords are bounded by wheel track; original compact two-element profile.
  for (const [z,y,width,chord] of [[2,.22,2.15,.3],[1.82,.28,1.98,.14],[-1.75,.91,1.68,.3],[-1.61,1.01,1.68,.12]]) {
    r.box(car,[width,.045,chord],[0,y,z],paint).name=z>0?'front-wing':'rear-wing'
  }
  for (const side of [-1,1]) {
    r.box(car,[.025,.22,.42],[side*1.08,.28,1.98],white)
    r.box(car,[.025,.32,.42],[side*.85,.93,-1.73],white)
    rod(car,[side*.25,.33,-1.45],[side*.25,.91,-1.73],.028,metal)
  }
  const tireShape = r.geometry(new LatheGeometry([[.27,-.16],[.39,-.16],[.445,-.11],[.46,-.04],[.46,.04],[.445,.11],[.39,.16],[.27,.16],[.27,-.16]].map(([x,y])=>new Vector2(x,y)),24))
  const rimShape = r.geometry(new LatheGeometry([[.245,-.145],[.28,-.145],[.28,.145],[.245,.145],[.245,-.145]].map(([x,y])=>new Vector2(x,y)),24))
  const hubShape = r.geometry(new CylinderGeometry(.075,.075,.045,12)); hubShape.rotateZ(Math.PI/2)
  for (const z of [-1.27,1.3]) for (const side of [-1,1]) {
    const wheel = new Group(); wheel.name='track-wheel-'+(z>0?'front':'rear')+'-'+(side<0?'left':'right'); wheel.position.set(side*.98,.46,z); car.add(wheel)
    const rubber = r.mesh(wheel,tireShape,tire); rubber.rotation.z=Math.PI/2;rubber.name='tire'
    const rim=r.mesh(wheel,rimShape,metal);rim.rotation.z=Math.PI/2;rim.name='closed-rim'
    for (const face of [-1,1]) {
      r.mesh(wheel,hubShape,metal,[face*.145,0,0]).name='hub-'+face
      for (let spoke=0;spoke<6;spoke++) {
        const angle=spoke*Math.PI/3
        rod(wheel,[face*.14,Math.sin(angle)*.055,Math.cos(angle)*.055],[face*.14,Math.sin(angle+.12)*.25,Math.cos(angle+.12)*.25],.018,metal).name='spoke-'+face+'-'+spoke
      }
    }
    rod(car,[side*.79,.41,z],[side*.79,.57,z],.025,metal).name=wheel.name+'-upright'
    rod(car,[side*.79,.46,z],[side*1.0,.46,z],.035,metal).name=wheel.name+'-spindle'
    for (const delta of [-.24,.24]) {
      const fore=delta>0
      rod(car,[side*(z>0?(fore?.16:.205):.66),z>0?(fore?.32:.34):.3,z>0?(fore?1.12:.75):z+delta],[side*.79,.42,z],.017,carbon).name=wheel.name+'-lower-arm'
      rod(car,[side*(z>0?(fore?.17:.21):.66),z>0?(fore?.37:.43):.38,z>0?(fore?1.12:.75):z+delta],[side*.79,.56,z],.014,carbon).name=wheel.name+'-upper-arm'
    }
  }
  car.traverse(object=>{if(object instanceof Mesh){object.castShadow=false;object.receiveShadow=false}})
  return car
}
