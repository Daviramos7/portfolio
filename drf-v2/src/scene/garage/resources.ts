import { BoxGeometry, CanvasTexture, CylinderGeometry, InstancedMesh, Matrix4, Mesh, MeshBasicMaterial, MeshPhysicalMaterial, MeshStandardMaterial, PlaneGeometry, RepeatWrapping, SRGBColorSpace, Vector2, Vector3 } from 'three'
import type { BufferGeometry, Group, Material, Texture } from 'three'
import { createFloorSurface } from './floorSurface.ts'
import { bodyFont, fitCanvasBlocks } from './canvasText.ts'

export type Vec3 = readonly [number, number, number]

  export function createResources(invalidate: () => void = () => {}) {
    let released = false, fontsReady = false
    const fontListeners = new Set<() => void>()
    if (document.fonts?.load) {
      void Promise.all([document.fonts.load('700 38px "Barlow Condensed"'), document.fonts.load('500 27px "Geist Variable"')])
        .then(results => {
          if (released || results.some(result => result.length === 0)) return
          fontsReady = true
          for (const redraw of fontListeners) redraw()
          fontListeners.clear(); invalidate()
        }).catch(() => { /* Readable fallback remains; no repeated font polling. */ })
    }
    function onFontsReady(redraw: () => void) { if (released) return; if (fontsReady) redraw(); else fontListeners.add(redraw) }
  const geometries = new Set<BufferGeometry>(), materials = new Set<Material>()
  const textures = new Set<Texture>(), instances = new Set<InstancedMesh>()
  function geometry<T extends BufferGeometry>(resource: T): T { geometries.add(resource); return resource }
  function material<T extends Material>(resource: T): T { materials.add(resource); return resource }
  function texture(resource: Texture) { textures.add(resource); return resource }
  // Text surfaces are minified (1.5-4 texels/px) and often oblique; anisotropy keeps glyphs from mip blur.
  const textTextures = new Set<Texture>(); let textAnisotropy = 1
  function textTexture(resource: Texture) { texture(resource); textTextures.add(resource); resource.anisotropy = textAnisotropy; return resource }
  function setTextAnisotropy(level: number) {
    textAnisotropy = Math.max(1, level)
    for (const map of textTextures) if (map.anisotropy !== textAnisotropy) { map.anisotropy = textAnisotropy; map.needsUpdate = true }
  }
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
    paint: material(new MeshPhysicalMaterial({ color: '#9b1730', metalness: .1, roughness: .32, clearcoat: .65, clearcoatRoughness: .28, envMapIntensity: .7, roughnessMap: paintedMap, normalMap: paintedNormal, normalScale: new Vector2(.06,.06) })),
    panel: material(new MeshStandardMaterial({ color: '#b4b5ac', metalness: .08, roughness: .82, roughnessMap: paintedMap, normalMap: paintedNormal, normalScale: new Vector2(.12,.12) })),
    structure: material(new MeshStandardMaterial({ color: '#26333f', metalness: .78, roughness: .44, envMapIntensity: .65, roughnessMap: metalMap, normalMap: metalNormal, normalScale: new Vector2(.12,.12) })),
    polymer: material(new MeshPhysicalMaterial({ color: '#101a24', metalness: 0, roughness: .82, clearcoat: .04, envMapIntensity: .3, normalMap: paintedNormal, normalScale: new Vector2(.15,.15) })),
    black: material(new MeshStandardMaterial({ color: '#11141a', roughness: .59, metalness: .22 })),
    red: material(new MeshStandardMaterial({ color: '#930e29', metalness: .55, roughness: .23 })),
    white: material(new MeshStandardMaterial({ color: '#d8e1e3', metalness: .42, roughness: .26 })),
    metal: material(new MeshStandardMaterial({ color: '#87949c', metalness: .9, roughness: .42, envMapIntensity: .7, normalMap: metalNormal, normalScale: new Vector2(.18,.18), roughnessMap: metalMap })),
    floor: material(new MeshStandardMaterial({ color: '#a5a6a2', map: floorSurface.map, metalness: .015, roughness: .93, roughnessMap: floorSurface.roughness, normalMap: floorNormal, normalScale: new Vector2(.55, .55) })),
    concrete: material(new MeshStandardMaterial({ color: '#81878a', metalness: .02, roughness: .93 })),
    tire: material(new MeshStandardMaterial({ color: '#161819', roughness: .94, normalMap: rubberNormal, normalScale: new Vector2(.3, .3) })),
    light: material(new MeshBasicMaterial({ color: '#8eaebb', toneMapped: false })),
    taskLight: material(new MeshBasicMaterial({ color: '#ffdfa8', toneMapped: false })),
    redLight: material(new MeshBasicMaterial({ color: '#e33352', toneMapped: false })),
    glass: material(new MeshStandardMaterial({ color: '#0b1a23', metalness: .55, roughness: .19 })),
    // M16 4b exterior: matte ground finishes; trackPaint is white so instance colours tint kerbs and lines.
    asphalt: material(new MeshStandardMaterial({ color: '#2a2e33', metalness: 0, roughness: .95 })),
    grass: material(new MeshStandardMaterial({ color: '#4c5a41', metalness: 0, roughness: 1 })),
    gravel: material(new MeshStandardMaterial({ color: '#9d9786', metalness: 0, roughness: 1 })),
    trackPaint: material(new MeshStandardMaterial({ color: '#ffffff', metalness: 0, roughness: .78 })),
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
    const ctx = canvas.getContext('2d'), map = textTexture(new CanvasTexture(canvas)); map.colorSpace = SRGBColorSpace
    const mat = material(new MeshBasicMaterial({ map, toneMapped: false }))
    const object = mesh(parent, geometry(new PlaneGeometry(...size)), mat, position); object.castShadow = false
    let currentLabel=text, currentDetail='DRF / ENGINEERING'
    const setText = (label: string, detail = 'DRF / ENGINEERING') => {
      currentLabel=label;currentDetail=detail
      if (!ctx) return
      ctx.fillStyle = '#111820'; ctx.fillRect(0, 0, 1024, 256)
      ctx.fillStyle = '#a41431'; ctx.fillRect(0, 0, 8, 256)
      ctx.fillStyle = '#a4b5c1'; ctx.font = `500 22px ${bodyFont}`; ctx.fillText(detail.toUpperCase(), 34, 47)
      ctx.fillStyle = '#e9f0f2'
      const title = label.toUpperCase()
      const layout=fitCanvasBlocks(ctx,[title],950,128,64)
      object.userData.textFits=layout.fits
      for(const block of layout.blocks){ctx.font=`700 ${block.font}px ${block.family}`;block.lines.forEach((line,index)=>ctx.fillText(line,32,(block.lines.length>1?118:143)+index*block.font*1.3))}
      if(!layout.fits){ctx.font=`500 24px ${bodyFont}`;ctx.fillText('DRF · HTML',32,120)}
      ctx.fillStyle = '#293843'; ctx.fillRect(34, 197, 953, 2)
      ctx.fillStyle = '#bc2946'; ctx.fillRect(34, 197, 100, 2); map.needsUpdate = true
    }
    setText(text);onFontsReady(()=>setText(currentLabel,currentDetail));return { object, setText }
  }
  /** One draw call per repeated type; the owner disposes it. Callers fill matrices, then computeBoundingSphere. */
  function instanced(parent: Group, shape: BufferGeometry, mat: Material, count: number, name: string) {
    const object = new InstancedMesh(shape, mat, count); object.name = name
    object.castShadow = object.receiveShadow = false; instances.add(object); parent.add(object); return object
  }
  function batch(parent: Group) {
    parent.updateMatrixWorld(true); const inverse = new Matrix4().copy(parent.matrixWorld).invert()
    const buckets = new Map<string, Mesh[]>()
    parent.traverse(object => {
      if (!(object instanceof Mesh) || object instanceof InstancedMesh || Array.isArray(object.material) || object.userData.dynamic) return
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
    if (released) return
    released = true; fontListeners.clear()
    for (const item of instances) item.dispose()
    for (const item of textures) item.dispose()
    for (const item of geometries) item.dispose()
    for (const item of materials) item.dispose()
    instances.clear(); textures.clear(); geometries.clear(); materials.clear()
  }
  return { geometry, material, texture, textTexture, setTextAnisotropy, palette, box, rod, mesh, sign, batch, instanced, dispose, onFontsReady }
}
export type Resources = ReturnType<typeof createResources>
