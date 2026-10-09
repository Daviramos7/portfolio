import { BoxGeometry, Color, Mesh, MeshBasicMaterial, PMREMGenerator, Scene } from 'three'
import type { WebGLRenderer } from 'three'

// Original studio lighting capture, generated once; no HDR asset or live reflection pass.
export function createWorkshopEnvironment(renderer: WebGLRenderer) {
  const room = new Scene()
  room.background = new Color('#10131b')
  const shape = new BoxGeometry(1, 1, 1)
  const surfaces: MeshBasicMaterial[] = []
  function panel(color: string, intensity: number, size: [number, number, number], position: [number, number, number]) {
    const material = new MeshBasicMaterial({ color: new Color(color).multiplyScalar(intensity) })
    surfaces.push(material)
    const mesh = new Mesh(shape, material); mesh.scale.set(...size); mesh.position.set(...position); room.add(mesh)
  }
  panel('#d0e3ff', 4, [.1, 3, 11], [-7, 2.5, 0])
  panel('#e8e7df', 5, [11, .1, 1.2], [0, 5, -1])
  panel('#c6dfff', 3, [6, 3, .1], [0, 2, -8])
  panel('#b32742', 1.2, [.1, 2, 8], [7, 1.8, 0])
  panel('#626a76', .7, [12, .1, 14], [0, -1, 0])
  const generator = new PMREMGenerator(renderer)
  try {
    return generator.fromScene(room, .04, .1, 50)
  } finally {
    generator.dispose(); shape.dispose(); surfaces.forEach(material => material.dispose()); room.clear()
  }
}
