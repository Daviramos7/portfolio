import { CylinderGeometry, ExtrudeGeometry, Group, LatheGeometry, Shape, SphereGeometry, TorusGeometry, Vector2 } from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import type { Resources, Vec3 } from './resources.ts'

/** Authored tabletop controller, not a scan/CAD or branded product silhouette. */
export function createGamepad(r: Resources, parent: Group) {
  const root = new Group(); root.name = 'authored-gamepad'; parent.add(root)
  const { polymer, panel, tire, black, metal, paint } = r.palette
  const outline = new Shape()
  outline.moveTo(-.46, .02); outline.bezierCurveTo(-.45,.18,-.35,.225,-.22,.225)
  outline.quadraticCurveTo(0,.19,.22,.225); outline.bezierCurveTo(.35,.225,.45,.18,.46,.02)
  outline.bezierCurveTo(.455,-.12,.40,-.34,.32,-.36)
  outline.bezierCurveTo(.245,-.365,.18,-.17,.13,-.12)
  outline.quadraticCurveTo(0,-.065,-.13,-.12)
  outline.bezierCurveTo(-.18,-.17,-.245,-.365,-.32,-.36)
  outline.bezierCurveTo(-.40,-.34,-.455,-.12,-.46,.02)
  const shell = r.geometry(new ExtrudeGeometry(outline,{depth:.13,curveSegments:5,bevelEnabled:true,bevelSize:.025,bevelThickness:.025,bevelSegments:2,steps:1}))
  shell.translate(0,0,-.07)
  const position = shell.getAttribute('position')
  for (let i=0;i<position.count;i++) {
    const x=position.getX(i), y=position.getY(i), z=position.getZ(i)
    if(z>.035) position.setZ(i,z+.035*Math.max(0,1-(x/.48)**2)*Math.max(0,1-(y/.4)**2))
  }
  shell.computeVertexNormals()
  r.mesh(root,shell,polymer).name='rounded-controller-shell'
  const face=r.mesh(root,shell,panel,[0,.008,.085]);face.name='gamepad-domed-face';face.scale.set(.91,.85,.42)
  // Soft grip sleeves have tapered profiles; their upper ends embed in the shell.
  const grip=r.geometry(new LatheGeometry([new Vector2(0,-.11),new Vector2(.049,-.105),new Vector2(.076,-.055),new Vector2(.083,.03),new Vector2(.063,.1),new Vector2(0,.105)],10))
  for(const side of [-1,1]){const g=r.mesh(root,grip,tire,[side*.323,-.22,-.022]);g.name='gamepad-grip-'+side;g.scale.z=.67;g.rotation.z=side*-.3}
  const collar=r.geometry(new TorusGeometry(.067,.012,3,12))
  const stem=r.geometry(new CylinderGeometry(.025,.028,.03,12));stem.rotateX(Math.PI/2)
  // Rim rises above the center: genuine concavity, not a flat button used as a stick.
  const cap=r.geometry(new LatheGeometry([new Vector2(0,.014),new Vector2(.025,.014),new Vector2(.045,.018),new Vector2(.057,.03),new Vector2(.064,.025),new Vector2(.061,0),new Vector2(0,0)],12));cap.rotateX(Math.PI/2)
  for(const [index,p] of ([[-.235,.082,.139],[.125,-.069,.147]] as const).entries()){
    const assembly=new Group();assembly.name='gamepad-stick-'+index;assembly.position.set(p[0],p[1],p[2]);root.add(assembly)
    r.mesh(assembly,collar,black).name='stick-collar'
    r.mesh(assembly,stem,metal,[0,0,.014]).name='stick-stem'
    r.mesh(assembly,cap,tire,[0,0,.027]).name='stick-concave-cap'
  }
  const cross=new Shape();const arm=.026, reach=.072
  cross.moveTo(-arm,reach);for(const [x,y] of [[arm,reach],[arm,arm],[reach,arm],[reach,-arm],[arm,-arm],[arm,-reach],[-arm,-reach],[-arm,-arm],[-reach,-arm],[-reach,arm],[-arm,arm]])cross.lineTo(x,y);cross.closePath()
  const dpad=r.geometry(new ExtrudeGeometry(cross,{depth:.02,bevelEnabled:true,bevelSize:.006,bevelThickness:.005,bevelSegments:1,steps:1}))
  r.mesh(root,dpad,black,[-.13,-.077,.136]).name='gamepad-dpad'
  const button=r.geometry(new SphereGeometry(1,8,5))
  const buttonSeat=r.geometry(new CylinderGeometry(.022,.026,.055,8));buttonSeat.rotateX(Math.PI/2)
  for(const [index,p] of ([[.27,.148,.152],[.335,.083,.142],[.27,.018,.155],[.205,.083,.161]] as const).entries()){
    r.mesh(root,buttonSeat,black,[p[0],p[1],p[2]-.025]).name='gamepad-button-seat-'+index
    const b=r.mesh(root,button,index===0?paint:black,p);b.name='gamepad-face-button-'+index;b.scale.set(.027,.027,.015)
  }
  const bumper=r.geometry(new RoundedBoxGeometry(.205,.055,.065,1,.016))
  const trigger=r.geometry(new RoundedBoxGeometry(.11,.115,.075,1,.02))
  for(const side of [-1,1]){
    const b=r.mesh(root,bumper,black,[side*.265,.216,-.013]);b.name='gamepad-bumper-'+side;b.rotation.z=side*-.09
    const t=r.mesh(root,trigger,tire,[side*.28,.179,-.088]);t.name='gamepad-trigger-'+side;t.rotation.x=-.22
  }
  // Expose only original geometry and ownership through the existing resource registry.
  return root
}

export const gamepadBadgePosition: Vec3 = [0,.095,.143]
