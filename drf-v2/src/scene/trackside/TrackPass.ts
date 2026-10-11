import { Group, Mesh, MeshBasicMaterial, PlaneGeometry } from 'three'
import type { CarPass } from '../../contracts/index.ts'
import type { Resources } from '../garage/resources.ts'
import { carPassEnvelope, tracksidePose } from './preparation.ts'
import { createTrackCar } from './TrackCar.ts'
import { createTrackModelLease } from './TrackModel.ts'

export function createTrackPass(r: Resources, opening: { reflection: Group; lightweight: import('three').Mesh; restore: () => void }) {
  const vehicle = new Group(), fallback=createTrackCar(r); vehicle.visible = false
  r.batch(fallback);vehicle.add(fallback)
  const lease=createTrackModelLease(root=>{
    const palette={ivory:r.palette.white,wine:r.palette.paint,carbon:r.palette.carbon,rubber:r.palette.tire,alloy:r.palette.metal}
    root.traverse(object=>{if(object instanceof Mesh){object.castShadow=true;object.receiveShadow=true;const convert=(material:import('three').Material)=>palette[material.name as keyof typeof palette]??r.palette.carbon;object.material=Array.isArray(object.material)?object.material.map(convert):convert(object.material)}})
    r.batch(root);vehicle.add(root);fallback.visible=false
  })
  const mat = r.material(new MeshBasicMaterial({ color: '#b2d9ec', transparent: true, opacity: 0, depthWrite: false }))
  const reflection = r.mesh(opening.reflection, r.geometry(new PlaneGeometry(3.6, 1.5)), mat)
  reflection.rotation.x = -Math.PI / 2; reflection.castShadow = false; reflection.visible = false
  const rest = opening.lightweight.rotation.z
  function restore() { vehicle.position.set(0, 0, 0); vehicle.rotation.y = 0; reflection.position.x = 0; vehicle.visible = false; reflection.visible = false; mat.opacity = 0; opening.restore() }
  function update(event: CarPass | null, progress: number, visual: boolean) {
    if (!event || !visual) { restore(); return }
    const pose = tracksidePose(event, progress), x=pose.position[0]
    vehicle.visible = true; vehicle.position.set(...pose.position)
    vehicle.rotation.y = pose.yaw
    const envelope = carPassEnvelope(progress)
    reflection.visible = true; reflection.position.x = Math.max(-3, Math.min(3, x * .18)); mat.opacity = envelope * .055
    opening.lightweight.position.y += Math.sin(progress * Math.PI * 24) * envelope * .0015
    opening.lightweight.rotation.z = rest + Math.sin(progress * Math.PI * 20) * envelope * .004
  }
  return { vehicle, get modelStatus(){return lease.status}, load:()=>lease.load(new URL('scene/models/drf-sprint-03.glb',document.baseURI).href), dispose:()=>{restore();lease.dispose()}, update: (event: CarPass | null, progress: number, visual: boolean) => { opening.restore(); update(event, progress, visual) }, restore }
}
