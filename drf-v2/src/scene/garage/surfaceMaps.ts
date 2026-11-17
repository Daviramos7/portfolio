import { CanvasTexture, RepeatWrapping } from 'three'
import type { Texture } from 'three'

export type SurfaceKind = 'carbon' | 'metal' | 'rubber' | 'painted'

// Tiles per metre for the object-space finishes (see surfaceFinish.ts). Rubber keeps the lathe UVs of the tyre.
// carbon: 16 tows of 7 mm per tile; metal: 256 brush rows over 25 cm; painted: orange peel over 40 cm.
const repeats: Record<SurfaceKind, readonly [number, number]> = { carbon: [8.9, 8.9], metal: [4, 4], painted: [2.5, 2.5], rubber: [12, 3] }
const size = 256, tow = 16, turn = Math.PI * 2 / size

/**
 * Original procedural finishes, 256 px, seamless. `map` is a grey field used as roughness (and as albedo modulation
 * on carbon); `relief` is the height the normal map is derived from and is never uploaded to the GPU.
 */
export function createSurfaceMaps(register: (texture: Texture) => Texture, kind: SurfaceKind) {
  const make = () => { const canvas = document.createElement('canvas'); canvas.width = canvas.height = size; return canvas }
  const tone = make(), height = make(), t = tone.getContext('2d'), h = height.getContext('2d')
  if (t && h) {
    let seed = 17
    const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 }
    const hash = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s) }
    // One value per brush row, softened with its neighbours: long straight scratches, not noise.
    const row = (y: number) => { const at = (n: number) => hash((n + size) % size); return at(y) * .5 + (at(y - 1) + at(y + 1)) * .25 }
    const tones = t.createImageData(size, size), heights = h.createImageData(size, size)
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      let value: number, relief: number
      if (kind === 'carbon') {
        // 2x2 twill: each tow passes over two and under two; the diagonal shifts one tow per row.
        const cx = Math.floor(x / tow), cy = Math.floor(y / tow), phase = (cx + cy) % 4, warp = phase < 2
        const across = ((warp ? x : y) % tow + .5) / tow, along = ((warp ? y : x) % tow + .5) / tow
        const round = Math.sin(across * Math.PI)
        const filament = Math.sin(across * Math.PI * 9 + (warp ? cx : cy) * 1.7) * .5 + .5
        // Tows dip under their neighbours at both ends of the float.
        const dip = Math.sin(((warp ? phase : phase - 2) + along) / 2 * Math.PI)
        value = (warp ? 216 : 164) + round * 24 + filament * 7 + random() * 4 - (round < .28 ? 26 : 0)
        relief = 96 + round * 92 + dip * 30 + filament * 6
      } else if (kind === 'metal') {
        const scratch = row(y), drift = Math.sin(x * turn * 2 + hash(y) * 6.28) * .5 + .5
        value = 186 + scratch * 52 + drift * 8 + random() * 5
        relief = 120 + scratch * 90 + drift * 6
      } else if (kind === 'painted') {
        const peel = Math.sin(x * turn * 33 + Math.sin(y * turn * 29) * 1.2) * Math.cos(y * turn * 35)
        value = 206 + peel * 9 + Math.sin(x * turn * 2) * Math.sin(y * turn * 3) * 6 + random() * 4
        relief = 128 + peel * 70
      } else {
        value = 211 + Math.sin(x * turn * 14) * 3 + random() * 11
        relief = value
      }
      const i = (y * size + x) * 4
      tones.data[i] = tones.data[i + 1] = tones.data[i + 2] = value
      heights.data[i] = heights.data[i + 1] = heights.data[i + 2] = relief
      tones.data[i + 3] = heights.data[i + 3] = 255
    }
    t.putImageData(tones, 0, 0); h.putImageData(heights, 0, 0)
  }
  const finish = (canvas: HTMLCanvasElement) => {
    const texture = register(new CanvasTexture(canvas)); texture.wrapS = texture.wrapT = RepeatWrapping
    texture.repeat.set(...repeats[kind]); return texture
  }
  return { map: finish(tone), relief: finish(height) }
}
