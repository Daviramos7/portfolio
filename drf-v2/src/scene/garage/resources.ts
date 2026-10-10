import { BoxGeometry, CanvasTexture, CylinderGeometry, InstancedMesh, Matrix4, Mesh, MeshBasicMaterial, MeshPhysicalMaterial, MeshStandardMaterial, PlaneGeometry, RepeatWrapping, SRGBColorSpace, Vector2, Vector3 } from 'three'
import type { BufferGeometry, Group, Material, Texture } from 'three'
import { createFloorSurface } from './floorSurface.ts'

export type Vec3 = readonly [number, number, number]

export function createResources() {
  const geometries = new Set<BufferGeometry>(), materials = new Set<Material>()
  const textures = new Set<Texture>(), instances = new Set<InstancedMesh>()
  function geometry<T extends BufferGeometry>(resource: T): T { geometries.add(resource); return resource }
  function material<T extends Material>(resource: T): T { materials.add(resource); return resource }
  function texture(resource: Texture) { textures.add(resource); return resource }
  function surface(kind: 'carbon' | 'metal' | 'rubber' | 'painted') {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256
    const ctx = canvas.getContext('2d')
    if (ctx) {
      let seed = 17
      const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 }
      const pixels = ctx.createImageData(256, 256)
      for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
        // Twill yarn relief, directional machining and molded/painted finishes are different fields.
        const over = (Math.floor(x / 8) + Math.floor(y / 8)) % 4 < 2
        const yarn = Math.sin((over ? y : x) % 8 / 8 * Math.PI)
        const brush = Math.sin(y * 1.7) * 5 + Math.sin(y * .19) * 2
        const peel = Math.sin(x * .81 + Math.sin(y * .7)) * Math.cos(y * .87) * 8
        const value = kind === 'carbon' ? 185 + yarn * 30 + (over ? 8 : 0) + random() * 4 :
          kind === 'metal' ? 168 + brush + random() * 7 :
          kind === 'painted' ? 194 + peel + Math.sin(x * .04) * 4 + random() * 4 :
          211 + Math.sin(x * .34) * 3 + random() * 11
        const i = (y * 256 + x) * 4
        pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = value
        pixels.data[i + 3] = 255
      }
      ctx.putImageData(pixels, 0, 0)
    }
    const map = texture(new CanvasTexture(canvas)); map.wrapS = map.wrapT = RepeatWrapping
    map.repeat.set(kind === 'rubber' ? 12 : 3, kind === 'metal' ? 1 : 3)
    return map
  }
  const carbonMap = surface('carbon'), metalMap = surface('metal'), rubberMap = surface('rubber'), paintedMap = surface('painted')
  const floorSurface = createFloorSurface(texture)
  // Tangent-space normals from our own height field, wrapped at texture boundaries.
  function normalFromHeight(height: Texture, strength: number) {
    const source = height.image as HTMLCanvasElement
    const size = source.width
    const pixels = source.getContext('2d')?.getImageData(0, 0, size, size).data
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = size
    const ctx = canvas.getContext('2d')
    if (ctx && pixels) {
      const output = ctx.createImageData(size, size)
      const value = (x: number, y: number) => pixels[(((y + size) % size) * size + (x + size) % size) * 4] / 255
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
        const nx = (value(x - 1, y) - value(x + 1, y)) * strength
        const ny = (value(x, y - 1) - value(x, y + 1)) * strength
        const length = Math.hypot(nx, ny, 1), i = (y * size + x) * 4
        output.data[i] = (nx / length * .5 + .5) * 255
        output.data[i + 1] = (ny / length * .5 + .5) * 255
        output.data[i + 2] = (1 / length * .5 + .5) * 255
        output.data[i + 3] = 255
      }
      ctx.putImageData(output, 0, 0)
    }
    const normal = texture(new CanvasTexture(canvas)); normal.wrapS = normal.wrapT = RepeatWrapping
    normal.repeat.copy(height.repeat); return normal
  }
  const carbonNormal = normalFromHeight(carbonMap, 2), rubberNormal = normalFromHeight(rubberMap, .8)
  const metalNormal = normalFromHeight(metalMap, 1.3), paintedNormal = normalFromHeight(paintedMap, 1.5)
  const floorNormal = normalFromHeight(floorSurface.height, 2.5)
  const cube = geometry(new BoxGeometry(1, 1, 1)), cylinder = geometry(new CylinderGeometry(1, 1, 1, 20))
  const palette = {
    carbon: material(new MeshPhysicalMaterial({ specularIntensity: .18, color: '#10171c', metalness: .02, roughness: .9, envMapIntensity: .4, clearcoat: .04, clearcoatRoughness: .4, normalMap: carbonNormal, normalScale: new Vector2(.23, .23), roughnessMap: carbonMap })),
    paint: material(new MeshPhysicalMaterial({ color: '#870c26', metalness: .14, roughness: .3, clearcoat: .85, clearcoatRoughness: .22, envMapIntensity: .8 })),
    panel: material(new MeshStandardMaterial({ color: '#475760', metalness: .3, roughness: .88, roughnessMap: paintedMap, normalMap: paintedNormal, normalScale: new Vector2(.3,.3) })),
    structure: material(new MeshStandardMaterial({ color: '#46545f', metalness: .78, roughness: .8, roughnessMap: metalMap, normalMap: metalNormal, normalScale: new Vector2(.16,.16) })),
    polymer: material(new MeshPhysicalMaterial({ color: '#20323b', metalness: 0, roughness: .7, clearcoat: .12, normalMap: paintedNormal, normalScale: new Vector2(.2,.2) })),
    black: material(new MeshStandardMaterial({ color: '#11141a', roughness: .59, metalness: .22 })),
    red: material(new MeshStandardMaterial({ color: '#930e29', metalness: .55, roughness: .23 })),
    white: material(new MeshStandardMaterial({ color: '#d8e1e3', metalness: .42, roughness: .26 })),
    metal: material(new MeshStandardMaterial({ color: '#a4b3bf', metalness: .9, roughness: .72, normalMap: metalNormal, normalScale: new Vector2(.25,.25), roughnessMap: metalMap })),
    floor: material(new MeshStandardMaterial({ color: '#a5a6a2', map: floorSurface.map, metalness: .015, roughness: .93, roughnessMap: floorSurface.roughness, normalMap: floorNormal, normalScale: new Vector2(.55, .55) })),
    concrete: material(new MeshStandardMaterial({ color: '#81878a', metalness: .02, roughness: .93 })),
    tire: material(new MeshStandardMaterial({ color: '#161819', roughness: .94, normalMap: rubberNormal, normalScale: new Vector2(.3, .3) })),
    light: material(new MeshBasicMaterial({ color: '#8eaebb', toneMapped: false })),
    taskLight: material(new MeshBasicMaterial({ color: '#ffdfa8', toneMapped: false })),
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
      ctx.fillStyle = '#e9f0f2'; ctx.font = '600 50px sans-serif'
      const title = label.toUpperCase()
      if (ctx.measureText(title).width <= 950) ctx.fillText(title, 32, 143)
      else {
        // Physical programme displays retain readable letter proportions for long labels.
        ctx.font = '600 44px sans-serif'
        const words = title.split(' '), lines = ['']
        for (const word of words) {
          const candidate = [lines[lines.length - 1], word].filter(Boolean).join(' ')
          if (lines.length < 2 && ctx.measureText(candidate).width > 950) lines.push(word)
          else lines[lines.length - 1] = candidate
        }
        lines.forEach((line, index) => ctx.fillText(line, 32, 118 + index * 58, 950))
      }
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
