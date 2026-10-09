import { CanvasTexture, SRGBColorSpace } from 'three'
import type { Texture } from 'three'

// Original, room-scale epoxy surface. All marks follow service traffic, not a tile grid.
export function createFloorSurface(register: (texture: Texture) => Texture) {
  const size = 512
  const make = () => { const c = document.createElement('canvas'); c.width = c.height = size; return c }
  const albedo = make(), roughness = make(), height = make()
  const a = albedo.getContext('2d'), r = roughness.getContext('2d'), h = height.getContext('2d')
  if (a && r && h) {
    const colors = a.createImageData(size, size), rough = r.createImageData(size, size), relief = h.createImageData(size, size)
    const hash = (x: number, y: number) => { const n = Math.imul(x + 31, 374761393) ^ Math.imul(y + 17, 668265263); return ((Math.imul(n ^ n >>> 13, 1274126177) >>> 0) / 4294967295) }
    const noise = (x: number, y: number) => {
      const ix = Math.floor(x), iy = Math.floor(y), tx = x - ix, ty = y - iy
      const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty)
      return (hash(ix, iy) * (1 - sx) + hash(ix + 1, iy) * sx) * (1 - sy) + (hash(ix, iy + 1) * (1 - sx) + hash(ix + 1, iy + 1) * sx) * sy
    }
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const broad = noise(x / 72, y / 85), grain = noise(x / 3, y / 3)
      const value = 90 + broad * 30 + grain * 7, i = (y * size + x) * 4
      colors.data[i] = value; colors.data[i + 1] = value + 5; colors.data[i + 2] = value + 7
      rough.data[i] = rough.data[i + 1] = rough.data[i + 2] = 216 + broad * 18 + grain * 10
      relief.data[i] = relief.data[i + 1] = relief.data[i + 2] = 116 + grain * 24
      colors.data[i + 3] = rough.data[i + 3] = relief.data[i + 3] = 255
    }
    a.putImageData(colors, 0, 0); r.putImageData(rough, 0, 0); h.putImageData(relief, 0, 0)
    const x = (world: number) => (world + 8.5) / 17 * size
    const y = (world: number) => (world + 8.5) / 20 * size
    // Two faint wheel paths from pit entrance to the parked car, plus a service-turn arc.
    for (const side of [-1, 1]) {
      for (const [ctx, color] of [[a, 'rgba(20,23,25,.19)'], [r, 'rgba(160,160,160,.22)']] as const) {
        ctx.strokeStyle = color; ctx.lineWidth = .38 / 17 * size; ctx.lineCap = 'round'
        ctx.beginPath(); ctx.moveTo(x(side * 1.3), y(-6.8)); ctx.bezierCurveTo(x(side * 1.5), y(-4.6), x(side * 1.3), y(-2), x(side * 1.3), y(1.55)); ctx.stroke()
        ctx.lineWidth = .23 / 17 * size
        ctx.beginPath(); ctx.moveTo(x(side * 1.55), y(-6.3)); ctx.bezierCurveTo(x(side * 2.5), y(-4.1), x(side * 3.5), y(-4), x(side * 4.2), y(-3.8)); ctx.stroke()
      }
    }
    // Small abrasion cluster beside the maintenance bay, not random floor clutter.
    a.strokeStyle = 'rgba(185,185,176,.14)'; a.lineWidth = 1
    for (let n = 0; n < 20; n++) {
      const px = x(-4.8 + hash(n, 2) * 1.9), py = y(-.8 + hash(n, 3) * 2.5)
      a.beginPath(); a.moveTo(px, py); a.lineTo(px + 3 + hash(n, 5) * 10, py - 2); a.stroke()
    }
  }
  const map = register(new CanvasTexture(albedo)); map.colorSpace = SRGBColorSpace
  return { map, roughness: register(new CanvasTexture(roughness)), height: register(new CanvasTexture(height)) }
}
