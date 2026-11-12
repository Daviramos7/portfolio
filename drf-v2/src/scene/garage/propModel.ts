import { Box3, Mesh, Vector3 } from 'three'
import type { BufferGeometry, Group, Material } from 'three'
import { createModelByteCache, parseTrackModel } from '../trackside/TrackModel.ts'

// Small cleaned props (tools/blender/clean_asset.py). Same policy as the track model: CPU bytes are cached,
// every renderer parses and owns its own graph, and any failure leaves the procedural stand-in in place.
export type PropModelLimits = { longest: readonly [min: number, max: number]; triangles: number }
const propBytes = createModelByteCache()

function owner(root: Group) {
  const geometries=new Set<BufferGeometry>(), materials=new Set<Material>()
  root.traverse(object=>{if(object instanceof Mesh){geometries.add(object.geometry);for(const material of Array.isArray(object.material)?object.material:[object.material])materials.add(material)}})
  let released=false
  return () => { if(released)return;released=true;root.removeFromParent();for(const geometry of geometries)geometry.dispose();for(const material of materials)material.dispose() }
}
function withinLimits(root: Group, limits: PropModelLimits) {
  root.updateMatrixWorld(true)
  const size=new Box3().setFromObject(root).getSize(new Vector3()), longest=Math.max(size.x,size.y,size.z)
  let triangles=0
  root.traverse(object=>{if(object instanceof Mesh)triangles+=(object.geometry.index?.count??object.geometry.attributes.position.count)/3})
  return Number.isFinite(longest)&&longest>=limits.longest[0]&&longest<=limits.longest[1]&&triangles>0&&triangles<=limits.triangles
}
export function createPropModelLease(onModel: (root: Group) => void, limits: PropModelLimits, dependencies = { bytes:propBytes, parse:parseTrackModel }) {
  let disposed=false, release:(()=>void)|null=null, pending:Promise<void>|null=null
  let status:'fallback'|'loading'|'loaded'|'disposed'='fallback'
  return {
    get status(){return status},
    load(url: string) {
      if(disposed || pending)return pending ?? Promise.resolve()
      status='loading'
      pending=dependencies.bytes(url).then(dependencies.parse).then(root=>{
        // The lease owns the file's geometry and its placeholder materials; scene materials stay with their owner.
        release=owner(root)
        if(disposed){release();return}
        if(!withinLimits(root,limits))throw new Error('Unexpected prop model bounds')
        onModel(root);status='loaded'
      }).catch(()=>{if(!disposed)status='fallback';release?.();release=null;pending=null})
      return pending
    },
    dispose(){if(disposed)return;disposed=true;status='disposed';release?.()},
  }
}
