import { BoxGeometry, CanvasTexture, CylinderGeometry, InstancedMesh, Matrix4, Mesh, MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry, RepeatWrapping, SRGBColorSpace, Vector3 } from 'three'
import type { BufferGeometry, Group, Material, Texture } from 'three'

export type Vec3 = readonly [number, number, number]

export function createResources() {
  const geometries = new Set<BufferGeometry>(), materials = new Set<Material>()
  const textures = new Set<Texture>(), instances = new Set<InstancedMesh>()
  function geometry<T extends BufferGeometry>(resource: T): T { geometries.add(resource); return resource }
  function material<T extends Material>(resource: T): T { materials.add(resource); return resource }
  function texture(resource: Texture) { textures.add(resource); return resource }
  function surface(kind: 'carbon' | 'metal' | 'floor' | 'rubber') {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256
    const ctx = canvas.getContext('2d')
    if (ctx) {
      let seed = 17
      const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 }
      const pixels = ctx.createImageData(256, 256)
      for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
        const weave = ((Math.floor(x / 4) + Math.floor(y / 4)) % 2) * 17
        const value = kind === 'carbon' ? 108 + weave + random() * 10 :
          kind === 'metal' ? 165 + Math.sin(y * 3) * 16 + random() * 10 :
          kind === 'rubber' ? 148 + random() * 22 : 154 + random() * 28
        const i = (y * 256 + x) * 4
        pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = value
        pixels.data[i + 3] = 255
      }
      ctx.putImageData(pixels, 0, 0)
    }
    const map = texture(new CanvasTexture(canvas)); map.wrapS = map.wrapT = RepeatWrapping
    map.repeat.set(kind === 'floor' ? 12 : 3, kind === 'floor' ? 12 : 3)
    return map
  }
  const carbonMap = surface('carbon'), metalMap = surface('metal'), floorMap = surface('floor'), rubberMap = surface('rubber')
  const cube = geometry(new BoxGeometry(1, 1, 1)), cylinder = geometry(new CylinderGeometry(1, 1, 1, 20))
  const palette = {
    carbon: material(new MeshStandardMaterial({ color: '#222831', metalness: .68, roughness: .34, bumpMap: carbonMap, bumpScale: .009, roughnessMap: carbonMap })),
    black: material(new MeshStandardMaterial({ color: '#11141a', roughness: .59, metalness: .22 })),
    red: material(new MeshStandardMaterial({ color: '#930e29', metalness: .55, roughness: .23 })),
    white: material(new MeshStandardMaterial({ color: '#d8e1e3', metalness: .42, roughness: .26 })),
    metal: material(new MeshStandardMaterial({ color: '#8b97a1', metalness: .88, roughness: .35, bumpMap: metalMap, bumpScale: .004, roughnessMap: metalMap })),
    floor: material(new MeshStandardMaterial({ color: '#252c35', metalness: .25, roughness: .55, bumpMap: floorMap, bumpScale: .012, roughnessMap: floorMap })),
    tire: material(new MeshStandardMaterial({ color: '#161819', roughness: .86, bumpMap: rubberMap, bumpScale: .005 })),
    light: material(new MeshBasicMaterial({ color: '#d9edff', toneMapped: false })),
    redLight: material(new MeshBasicMaterial({ color: '#e33352', toneMapped: false })),
    glass: material(new MeshStandardMaterial({ color: '#0b1a23', metalness: .55, roughness: .19 })),
  }
  function mesh(parent: Group, shape: BufferGeometry, mat: Material, position: Vec3 = [0, 0, 0]) {
    const object = new Mesh(shape, mat); object.position.set(...position)
    object.castShadow = object.receiveShadow = true; parent.add(object); return object
  }
  function box(parent: Group, size: Vec3, position: Vec3, mat: Material) {
    const object = mesh(parent, cube, mat, position); object.scale.set(...size); return object
  }
  function rod(parent: Group, from: Vec3, to: Vec3, radius: number, mat: Material) {
    const a = new Vector3(...from), b = new Vector3(...to), delta = b.clone().sub(a)
    const object = mesh(parent, cylinder, mat); object.position.copy(a.add(b).multiplyScalar(.5))
    object.scale.set(radius, delta.length(), radius)
    object.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), delta.normalize()); return object
  }
  function sign(parent: Group, text: string, size: readonly [number, number], position: Vec3) {
    const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 256
    const ctx = canvas.getContext('2d'), map = texture(new CanvasTexture(canvas)); map.colorSpace = SRGBColorSpace
    const mat = material(new MeshBasicMaterial({ map, toneMapped: false }))
    const object = mesh(parent, geometry(new PlaneGeometry(...size)), mat, position); object.castShadow = false
    const setText = (label: string, detail = 'DRF / ENGINEERING') => {
      if (!ctx) return
      ctx.fillStyle = '#111820'; ctx.fillRect(0, 0, 1024, 256)
      ctx.fillStyle = '#a41431'; ctx.fillRect(0, 0, 8, 256)
      ctx.fillStyle = '#a4b5c1'; ctx.font = '500 22px sans-serif'; ctx.fillText(detail.toUpperCase(), 34, 47, 950)
      ctx.fillStyle = '#e9f0f2'; ctx.font = '600 50px sans-serif'; ctx.fillText(label.toUpperCase(), 32, 143, 950)
      ctx.fillStyle = '#293843'; ctx.fillRect(34, 197, 953, 2)
      ctx.fillStyle = '#bc2946'; ctx.fillRect(34, 197, 100, 2); map.needsUpdate = true
    }
    setText(text); return { object, setText }
  }
  function batch(parent: Group) {
    parent.updateMatrixWorld(true); const inverse = new Matrix4().copy(parent.matrixWorld).invert()
    const buckets = new Map<string, Mesh[]>()
    parent.traverse(object => {
      if (!(object instanceof Mesh) || Array.isArray(object.material) || object.userData.dynamic) return
      const key = object.geometry.uuid + '/' + object.material.uuid + '/' + object.castShadow + '/' + object.receiveShadow
      const bucket = buckets.get(key) ?? []; bucket.push(object); buckets.set(key, bucket)
    })
    for (const objects of buckets.values()) {
      if (objects.length < 3) continue
      const first = objects[0], batch = new InstancedMesh(first.geometry, first.material, objects.length)
      batch.name = 'static-workshop-batch'; batch.castShadow = first.castShadow; batch.receiveShadow = first.receiveShadow
      objects.forEach((object, index) => { batch.setMatrixAt(index, new Matrix4().multiplyMatrices(inverse, object.matrixWorld)); object.removeFromParent() })
      batch.computeBoundingSphere(); instances.add(batch); parent.add(batch)
    }
  }
  function dispose() {
    for (const item of instances) item.dispose()
    for (const item of textures) item.dispose()
    for (const item of geometries) item.dispose()
    for (const item of materials) item.dispose()
    instances.clear(); textures.clear(); geometries.clear(); materials.clear()
  }
  return { geometry, material, texture, palette, box, rod, mesh, sign, batch, dispose }
}
export type Resources = ReturnType<typeof createResources>
