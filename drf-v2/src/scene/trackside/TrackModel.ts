import { Box3, Mesh, Vector3 } from 'three'
import type { Group, Material, BufferGeometry } from 'three'

// Cache CPU bytes only. Each renderer owns a separately parsed graph/GPU resources.
export function createModelByteCache(fetcher: typeof fetch = fetch) {
  const pending = new Map<string, Promise<ArrayBuffer>>()
  return (url: string) => {
    let result = pending.get(url)
    if (!result) {
      result = fetcher(url).then(async response => {
        if (!response.ok) throw new Error('Track model HTTP ' + response.status)
        const bytes = await response.arrayBuffer(), header = new DataView(bytes)
        if (bytes.byteLength > 1024 * 1024 || bytes.byteLength < 20 || header.getUint32(0,true) !== 0x46546c67 || header.getUint32(4,true) !== 2 || header.getUint32(8,true) !== bytes.byteLength) throw new Error('Invalid bounded track GLB')
        return bytes
      }).catch(error => { pending.delete(url); throw error })
      pending.set(url,result)
    }
    return result
  }
}
const modelBytes = createModelByteCache()
export async function parseTrackModel(bytes: ArrayBuffer): Promise<Group> {
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js')
  return (await new GLTFLoader().parseAsync(bytes,'')).scene
}
function owner(root: Group) {
  const geometries=new Set<BufferGeometry>(), materials=new Set<Material>()
  root.traverse(object=>{if(object instanceof Mesh){geometries.add(object.geometry);for(const material of Array.isArray(object.material)?object.material:[object.material])materials.add(material)}})
  let released=false
  return () => { if(released)return;released=true;root.removeFromParent();for(const geometry of geometries)geometry.dispose();for(const material of materials)material.dispose() }
}
export function createTrackModelLease(onModel: (root: Group) => void, dependencies = { bytes:modelBytes, parse:parseTrackModel }) {
  let disposed=false, release:(()=>void)|null=null, pending:Promise<void>|null=null
  let status:'fallback'|'loading'|'loaded'|'disposed'='fallback'
  return {
    get status(){return status},
    load(url: string) {
      if(disposed || pending)return pending ?? Promise.resolve()
      status='loading'
      pending=dependencies.bytes(url).then(dependencies.parse).then(root=>{
        release=owner(root)
        if(disposed){release();return}
        root.updateMatrixWorld(true)
        const size=new Box3().setFromObject(root).getSize(new Vector3())
        if(![size.x,size.y,size.z].every(Number.isFinite)||size.x<1||size.x>3||size.y<.5||size.y>2||size.z<3||size.z>6){release();release=null;throw new Error('Unexpected track model bounds')}
        onModel(root);status='loaded'
      }).catch(()=>{if(!disposed)status='fallback';release?.();release=null;pending=null})
      return pending
    },
    dispose(){if(disposed)return;disposed=true;status='disposed';release?.()},
  }
}
