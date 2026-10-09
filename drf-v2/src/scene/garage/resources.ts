import { BoxGeometry, CanvasTexture, CylinderGeometry, InstancedMesh, Matrix4, Mesh, MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry, SRGBColorSpace, Vector3 } from 'three'
import type { BufferGeometry, Group, Material, Texture } from 'three'

export type Vec3 = readonly [number, number, number]

export function createResources() {
  const geometries = new Set<BufferGeometry>()
  const materials = new Set<Material>()
  const textures = new Set<Texture>()
  const instances = new Set<InstancedMesh>()
  function geometry<T extends BufferGeometry>(resource: T): T { geometries.add(resource); return resource }
  function material<T extends Material>(resource: T): T { materials.add(resource); return resource }
  const cube = geometry(new BoxGeometry(1, 1, 1))
  const cylinder = geometry(new CylinderGeometry(1, 1, 1, 16))
  const palette = {
    carbon: material(new MeshStandardMaterial({ color: '#171b20', metalness: .48, roughness: .52 })),
    black: material(new MeshStandardMaterial({ color: '#07090c', roughness: .72 })),
    red: material(new MeshStandardMaterial({ color: '#8e1028', metalness: .48, roughness: .3 })),
    white: material(new MeshStandardMaterial({ color: '#e2e7e7', metalness: .18, roughness: .4 })),
    metal: material(new MeshStandardMaterial({ color: '#737f8a', metalness: .8, roughness: .36 })),
    floor: material(new MeshStandardMaterial({ color: '#282d32', metalness: .24, roughness: .55 })),
    tire: material(new MeshStandardMaterial({ color: '#111214', roughness: .95 })),
    light: material(new MeshBasicMaterial({ color: '#dceaf4' })),
    redLight: material(new MeshBasicMaterial({ color: '#cf2946' })),
    glass: material(new MeshStandardMaterial({ color: '#17232d', metalness: .55, roughness: .3 })),
  }
  function mesh(parent: Group, shape: BufferGeometry, surface: Material, position: Vec3 = [0, 0, 0]) {
    const object = new Mesh(shape, surface)
    object.position.set(...position)
    object.castShadow = true
    object.receiveShadow = true
    parent.add(object)
    return object
  }
  function box(parent: Group, size: Vec3, position: Vec3, surface: Material) {
    const object = mesh(parent, cube, surface, position)
    object.scale.set(...size)
    return object
  }
  function rod(parent: Group, from: Vec3, to: Vec3, radius: number, surface: Material) {
    const a = new Vector3(...from), b = new Vector3(...to)
    const delta = b.clone().sub(a)
    const object = mesh(parent, cylinder, surface)
    object.position.copy(a.add(b).multiplyScalar(.5))
    object.scale.set(radius, delta.length(), radius)
    object.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), delta.normalize())
    return object
  }
  function sign(parent: Group, text: string, size: readonly [number, number], position: Vec3) {
    const canvas = document.createElement('canvas')
    canvas.width = 768
    canvas.height = 192
    const context = canvas.getContext('2d')
    const texture = new CanvasTexture(canvas)
    texture.colorSpace = SRGBColorSpace
    textures.add(texture)
    const surface = material(new MeshBasicMaterial({ map: texture }))
    const object = mesh(parent, geometry(new PlaneGeometry(...size)), surface, position)
    object.castShadow = false
    const setText = (label: string) => {
      if (!context) return
      context.fillStyle = '#11161c'
      context.fillRect(0, 0, 768, 192)
      context.fillStyle = '#a71c37'
      context.fillRect(0, 0, 10, 192)
      context.fillStyle = '#edf2f4'
      context.font = '600 46px sans-serif'
      context.textBaseline = 'middle'
      context.fillText(label.toUpperCase(), 30, 98, 708)
      texture.needsUpdate = true
    }
    setText(text)
    return { object, setText }
  }
  // Repeated static parts share a GPU draw, with signs/Trackside anchors left editable.
  function batch(parent: Group) {
    parent.updateMatrixWorld(true)
    const inverse = new Matrix4().copy(parent.matrixWorld).invert()
    const buckets = new Map<string, Mesh[]>()
    parent.traverse(object => {
      if (!(object instanceof Mesh) || Array.isArray(object.material)) return
      const key = `${object.geometry.uuid}/${object.material.uuid}/${object.castShadow}/${object.receiveShadow}`
      const bucket = buckets.get(key) ?? []
      bucket.push(object)
      buckets.set(key, bucket)
    })
    for (const objects of buckets.values()) {
      if (objects.length < 3) continue
      const first = objects[0]
      const batch = new InstancedMesh(first.geometry, first.material, objects.length)
      batch.name = 'static-workshop-batch'
      batch.castShadow = first.castShadow
      batch.receiveShadow = first.receiveShadow
      objects.forEach((object, index) => {
        batch.setMatrixAt(index, new Matrix4().multiplyMatrices(inverse, object.matrixWorld))
        object.removeFromParent()
      })
      batch.computeBoundingSphere()
      instances.add(batch)
      parent.add(batch)
    }
  }
  function dispose() {
    for (const resource of instances) resource.dispose()
    for (const resource of textures) resource.dispose()
    for (const resource of geometries) resource.dispose()
    for (const resource of materials) resource.dispose()
    instances.clear(); textures.clear(); geometries.clear(); materials.clear()
  }
  return { geometry, material, palette, box, rod, mesh, sign, batch, dispose }
}

export type Resources = ReturnType<typeof createResources>
