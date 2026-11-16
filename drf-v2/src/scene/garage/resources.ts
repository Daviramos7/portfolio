import { BoxGeometry, CanvasTexture, CylinderGeometry, Float32BufferAttribute, InstancedMesh, Matrix4, Mesh, MeshBasicMaterial, MeshPhysicalMaterial, MeshStandardMaterial, PlaneGeometry, RepeatWrapping, SRGBColorSpace, Vector2, Vector3 } from 'three'
import type { BufferGeometry, Group, Material, Texture } from 'three'
import { createFloorSurface } from './floorSurface.ts'
import { createSurfaceMaps } from './surfaceMaps.ts'
import { objectSpaceFinish } from './surfaceFinish.ts'
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
  // M16 fila 11: twill, brushing and orange peel live in surfaceMaps.ts and are mapped in metres (surfaceFinish.ts).
  const carbonSurface = createSurfaceMaps(texture, 'carbon'), metalSurface = createSurfaceMaps(texture, 'metal')
  const rubberSurface = createSurfaceMaps(texture, 'rubber'), paintedSurface = createSurfaceMaps(texture, 'painted')
  const carbonMap = carbonSurface.map, metalMap = metalSurface.map, paintedMap = paintedSurface.map
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
  const carbonNormal = normalFromHeight(carbonSurface.relief, 2.2), rubberNormal = normalFromHeight(rubberSurface.relief, .8)
  const metalNormal = normalFromHeight(metalSurface.relief, 1.6), paintedNormal = normalFromHeight(paintedSurface.relief, 1.2)
  const floorNormal = normalFromHeight(floorSurface.height, 2.5)
  const cube = geometry(new BoxGeometry(1, 1, 1)), cylinder = geometry(new CylinderGeometry(1, 1, 1, 20))
  // Marks the unit cube for the edge-wear term of surfaceFinish.ts; any other geometry reads 0 (no wear).
  cube.setAttribute('drfCube', new Float32BufferAttribute(new Float32Array(cube.getAttribute('position').count).fill(1), 1))
  const palette = {
    // M16 fila 11. Carbon: visible 2x2 twill (the grey field modulates albedo and roughness) under a smooth lacquer.
    carbon: material(objectSpaceFinish(new MeshPhysicalMaterial({ specularIntensity: .35, color: '#1b2228', map: carbonMap, metalness: 0, roughness: .62, envMapIntensity: .55, clearcoat: .6, clearcoatRoughness: .2, normalMap: carbonNormal, normalScale: new Vector2(.55, .55), roughnessMap: carbonMap }),
      { edge: .22, width: .004, roughness: .25, macro: .18, color: '#4a5158' })),
    paint: material(objectSpaceFinish(new MeshPhysicalMaterial({ color: '#9b1730', metalness: .1, roughness: .32, clearcoat: .65, clearcoatRoughness: .28, envMapIntensity: .7, roughnessMap: paintedMap, normalMap: paintedNormal, normalScale: new Vector2(.06,.06) }))),
    // Matte wall paint with scuffed joints; dark painted steel; moulded polymer that polishes on its edges.
    panel: material(objectSpaceFinish(new MeshStandardMaterial({ color: '#b4b5ac', metalness: 0, roughness: .88, roughnessMap: paintedMap, normalMap: paintedNormal, normalScale: new Vector2(.1,.1) }),
      { edge: .3, width: .03, roughness: .08, macro: .22, color: '#8d8e86' })),
    structure: material(objectSpaceFinish(new MeshStandardMaterial({ color: '#26333f', metalness: .55, roughness: .5, envMapIntensity: .6, roughnessMap: metalMap, normalMap: metalNormal, normalScale: new Vector2(.1,.1) }),
      { edge: .3, width: .004, roughness: -.12, macro: .25, color: '#6c7780' })),
    polymer: material(objectSpaceFinish(new MeshPhysicalMaterial({ color: '#101a24', metalness: 0, roughness: .8, clearcoat: .04, envMapIntensity: .3, normalMap: paintedNormal, normalScale: new Vector2(.15,.15) }),
      { edge: .28, width: .005, roughness: -.22, macro: .2, color: '#2c3742' })),
    // Paint, not chrome: black, red and white are matte/satin coatings that chip to a duller tone on edges.
    black: material(objectSpaceFinish(new MeshStandardMaterial({ color: '#11141a', roughness: .74, metalness: .04 }),
      { edge: .25, width: .004, roughness: -.15, macro: .2, color: '#3a3f47' })),
    red: material(objectSpaceFinish(new MeshStandardMaterial({ color: '#7e0d24', metalness: .04, roughness: .52 }),
      { edge: .35, width: .004, roughness: .1, macro: .2, color: '#6d6f73' })),
    white: material(objectSpaceFinish(new MeshStandardMaterial({ color: '#d3dcde', metalness: 0, roughness: .6 }),
      { edge: .3, width: .004, roughness: .1, macro: .3, color: '#8e9494' })),
    // Brushed aluminium: brush rows along the part; the anisotropic highlight is switched on for `balanced` only.
    metal: material(objectSpaceFinish(new MeshPhysicalMaterial({ color: '#a9b1b5', metalness: .88, roughness: .4, envMapIntensity: .9, anisotropyRotation: Math.PI / 2, normalMap: metalNormal, normalScale: new Vector2(.2,.2), roughnessMap: metalMap }),
      { edge: .3, width: .004, roughness: -.1, macro: .22, color: '#c3cacd' })),
    // Epoxy: the roughness map carries the absolute value (gloss patches, dull wheel paths, dusty perimeter).
    floor: material(new MeshStandardMaterial({ color: '#a5a6a2', map: floorSurface.map, metalness: 0, roughness: 1, envMapIntensity: .65, roughnessMap: floorSurface.roughness, normalMap: floorNormal, normalScale: new Vector2(.1, .1) })),
    concrete: material(new MeshStandardMaterial({ color: '#81878a', metalness: .02, roughness: .93 })),
    tire: material(new MeshStandardMaterial({ color: '#1a1b1c', metalness: 0, roughness: .97, envMapIntensity: .25, normalMap: rubberNormal, normalScale: new Vector2(.3, .3) })),
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
    if (released) return
    released = true; fontListeners.clear()
    for (const item of instances) item.dispose()
    for (const item of textures) item.dispose()
    for (const item of geometries) item.dispose()
    for (const item of materials) item.dispose()
    instances.clear(); textures.clear(); geometries.clear(); materials.clear()
  }
  return { geometry, material, texture, textTexture, setTextAnisotropy, palette, box, rod, mesh, sign, batch, dispose, onFontsReady }
}
export type Resources = ReturnType<typeof createResources>
