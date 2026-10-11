import { Box3, Group, Vector3 } from 'three'
import type { Object3D } from 'three'

// Keep authored wheel pivots out of whole-body instancing; batch within each assembly.
export function prepareRollingWheels(root: Group, batch: (group: Group) => void, scale: number) {
  const assemblies: Object3D[] = []
  root.traverse(object => { if (object.name.startsWith('wheel-')) assemblies.push(object) })
  root.updateMatrixWorld(true)
  const wheels = assemblies.map(wheel => {
    const parent = wheel.parent!, rest = wheel.quaternion.clone()
    const size = new Box3().setFromObject(wheel).getSize(new Vector3())
    const radius = Math.max(size.y, size.z) / 2 * scale
    return { wheel, parent, rest, radius }
  })
  for (const { wheel } of wheels) wheel.removeFromParent()
  batch(root)
  for (const { wheel, parent } of wheels) {
    parent.add(wheel)
    const contents = new Group()
    for (const child of [...wheel.children]) contents.add(child)
    wheel.add(contents); batch(contents)
  }
  return {
    count: wheels.length,
    update(distance: number) {
      for (const { wheel, rest, radius } of wheels) {
        wheel.quaternion.copy(rest)
        if (Number.isFinite(distance) && radius > 0) wheel.rotateX(distance / radius)
      }
    },
    restore() { for (const { wheel, rest } of wheels) wheel.quaternion.copy(rest) },
  }
}
