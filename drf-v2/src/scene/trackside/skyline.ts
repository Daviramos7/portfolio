import { CanvasTexture, ClampToEdgeWrapping, Group, MeshBasicMaterial, PlaneGeometry, RepeatWrapping, SRGBColorSpace } from 'three'
import type { BufferGeometry } from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import type { Quality } from '../../contracts/index.ts'
import type { Resources } from '../garage/resources.ts'
import { tracksideRoute } from './preparation.ts'

// M16 4b (D2 B): a fictional Recife horizon. Two alpha-tested cut-out planes share one canvas atlas: the far row is
// a hazy line of invented towers with a lighthouse, the near row a low waterfront with a tied-arch bridge and palms.
// Every silhouette is drawn here; none copies a real building. The near plane opens where the exit road runs out.
export const skylinePlan = {
  halfWidth: 120,
  /** Metres covered by one atlas repeat; wider than any single view through the facade. */
  tile: 120,
  near: { z: -76, height: 14, gap: [tracksideRoute.end[0] - 6, tracksideRoute.end[0] + 6] as const },
  far: { z: -90, height: 24, shift: .43 },
  atlas: [2048, 512] as const,
} as const

type Ctx = CanvasRenderingContext2D
function drawAtlas(ctx: Ctx) {
  const [width, height] = skylinePlan.atlas, row = height / 2, metres = skylinePlan.tile
  let seed = 20261112
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 }
  const pick = <T,>(items: readonly T[]) => items[Math.floor(random() * items.length)]
  ctx.clearRect(0, 0, width, height)
  // Each row is drawn in metres, y up from its own base line; the top 3 px stay clear so rows never bleed.
  const layer = (index: number, high: number, paint: () => void) => {
    ctx.save(); ctx.beginPath(); ctx.rect(0, index * row + 3, width, row - 3); ctx.clip()
    ctx.setTransform(width / metres, 0, 0, -(row - 3) / high, 0, (index + 1) * row); paint(); ctx.restore()
  }
  // Far row: slim towers in three hazy tones, grouped in clusters, with setbacks, masts and facade ribs.
  layer(0, skylinePlan.far.height, () => {
    ctx.fillStyle = '#7b90a0'; ctx.fillRect(0, 0, metres, 2.4)
    const lighthouse = 87
    for (let x = .8; x < metres - 4;) {
      if (x > lighthouse - 5 && x < lighthouse + 3) { x = lighthouse + 3; continue }
      const cluster = .5 + .5 * Math.sin(x / metres * Math.PI * 6 + 1.1), tall = random() < .22 + cluster * .4
      const w = 2.6 + random() * 3.8, h = tall ? 11 + random() * 10 : 4.5 + random() * 6
      ctx.fillStyle = pick(['#7b90a0', '#8499a9', '#728797']); ctx.fillRect(x, 0, w, h)
      if (random() < .45) ctx.fillRect(x + w * .22, h, w * .56, .7 + random() * 1.3)
      if (tall && random() < .35) ctx.fillRect(x + w * .5 - .07, h, .14, 2 + random() * 1.4)
      ctx.fillStyle = '#90a4b3'
      for (let rib = x + .55; rib < x + w - .4; rib += .95) ctx.fillRect(rib, 1.2, .2, h - 1.9)
      x += w + (random() < .3 ? .8 + random() * 2.6 : .12)
    }
    // An invented lighthouse: tapered shaft, two bands, gallery and lantern.
    ctx.fillStyle = '#8fa3b1'; ctx.beginPath(); ctx.moveTo(lighthouse - 1, 0); ctx.lineTo(lighthouse - .55, 12.6); ctx.lineTo(lighthouse + .55, 12.6); ctx.lineTo(lighthouse + 1, 0); ctx.fill()
    ctx.fillStyle = '#6c8190'; ctx.fillRect(lighthouse - .86, 3.6, 1.72, 1.5); ctx.fillRect(lighthouse - .7, 8.2, 1.4, 1.5)
    ctx.fillRect(lighthouse - .95, 12.6, 1.9, .35); ctx.fillRect(lighthouse - .45, 12.95, .9, 1.25)
    ctx.beginPath(); ctx.moveTo(lighthouse - .65, 14.2); ctx.lineTo(lighthouse, 15.3); ctx.lineTo(lighthouse + .65, 14.2); ctx.fill()
  })
  // Near row: low sheds and trees, a bridge whose openings are real holes in the cut-out, and palms.
  layer(1, skylinePlan.near.height, () => {
    const bridge = [38, 86] as const, deck = 4.3
    ctx.fillStyle = '#44565f'; ctx.fillRect(0, 0, metres, 1.5)
    for (let x = .6; x < metres - 6;) {
      if (x > bridge[0] - 7 && x < bridge[1] + 1) { x = bridge[1] + 1; continue }
      const w = 5 + random() * 6, h = 2.6 + random() * 2.8, roof = random()
      ctx.fillStyle = pick(['#475a66', '#506470', '#3f515c']); ctx.fillRect(x, 0, w, h)
      if (roof < .4) { ctx.beginPath(); ctx.moveTo(x - .2, h); ctx.lineTo(x + w * .5, h + 1 + random()); ctx.lineTo(x + w + .2, h); ctx.fill() }
      // Saw-tooth warehouse roof.
      else if (roof < .7) for (let tooth = x; tooth < x + w - .1; tooth += w / 4) { ctx.beginPath(); ctx.moveTo(tooth, h); ctx.lineTo(tooth, h + .9); ctx.lineTo(tooth + w / 4, h); ctx.fill() }
      if (random() < .6) {
        // Lumpy canopy, never a single disc.
        ctx.fillStyle = '#42544f'; ctx.fillRect(x + w + 1.25, 0, .3, 2.2)
        for (let lump = 0; lump < 4; lump++) { ctx.beginPath(); ctx.ellipse(x + w + .4 + lump * .65 + random() * .3, 2.3 + random() * 1.1, 1 + random() * .45, .8 + random() * .35, 0, 0, Math.PI * 2); ctx.fill() }
      }
      x += w + 3 + random() * 3
    }
    ctx.fillStyle = ctx.strokeStyle = '#3f515c'
    ctx.fillRect(bridge[0], deck, bridge[1] - bridge[0], .7)
    for (const pier of [44, 56, 68, 80]) ctx.fillRect(pier - .55, 0, 1.1, deck)
    const span = [50, 74] as const, crown = 10.4, rise = (x: number) => { const t = (x - span[0]) / (span[1] - span[0]); return deck + .7 + (crown - deck - .7) * 4 * t * (1 - t) }
    ctx.lineWidth = .55; ctx.beginPath()
    for (let x = span[0]; x <= span[1] + .01; x += .5) ctx.lineTo(x, rise(x))
    ctx.stroke()
    for (let x = span[0] + 2; x < span[1] - 1; x += 2) ctx.fillRect(x - .08, deck, .16, rise(x) - deck)
    // Two quay cranes (generic luffing jibs) on the waterfront.
    ctx.lineCap = 'round'
    for (const [x, reach] of [[14.5, 1], [98, -1]] as const) {
      ctx.fillRect(x - .3, 0, .6, 8.8); ctx.fillRect(x - .9, 7.2, 1.8, 1.3)
      ctx.lineWidth = .32; ctx.beginPath(); ctx.moveTo(x - reach * 2.2, 7.9); ctx.lineTo(x + reach * 7.5, 11.6); ctx.stroke()
      ctx.lineWidth = .16; ctx.beginPath(); ctx.moveTo(x - reach * 2.2, 7.9); ctx.lineTo(x, 10.4); ctx.lineTo(x + reach * 7.5, 11.6); ctx.moveTo(x, 8.8); ctx.lineTo(x, 10.4); ctx.stroke()
    }
    // Coconut palms: a leaning trunk and a crown of tapered blades that droop with their angle.
    ctx.fillStyle = ctx.strokeStyle = '#3c4d4b'
    const blade = (bx: number, by: number, angle: number, length: number) => {
      const droop = (1 - Math.sin(angle)) * length * .34, tx = bx + Math.cos(angle) * length, ty = by + Math.sin(angle) * length - droop
      const cx = bx + Math.cos(angle) * length * .5, cy = by + Math.sin(angle) * length * .5 + .45
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo(cx, cy + .34, tx, ty); ctx.quadraticCurveTo(cx, cy - .22, bx, by); ctx.fill()
    }
    for (const [x, tall, lean] of [[8, 6.4, .8], [24, 5.2, -.6], [33.5, 7, .4], [91.5, 5.8, -.8], [106, 6.9, .6], [112.5, 5, -.4]] as const) {
      ctx.lineWidth = .26; ctx.beginPath(); ctx.moveTo(x, .8); ctx.quadraticCurveTo(x + lean * .15, tall * .55, x + lean, tall); ctx.stroke()
      for (let n = 0; n < 9; n++) blade(x + lean, tall, Math.PI * (1.12 - n * 1.24 / 8), 2 + (n * 7 % 3) * .35)
      ctx.beginPath(); ctx.arc(x + lean, tall, .28, 0, Math.PI * 2); ctx.fill()
    }
  })
}

export function createSkyline(r: Resources) {
  const skyline = new Group(); skyline.name = 'recife-fiction-skyline'
  const canvas = document.createElement('canvas'); [canvas.width, canvas.height] = skylinePlan.atlas
  const ctx = canvas.getContext('2d'); if (ctx) drawAtlas(ctx)
  const atlas = r.texture(new CanvasTexture(canvas)); atlas.colorSpace = SRGBColorSpace
  atlas.wrapS = RepeatWrapping; atlas.wrapT = ClampToEdgeWrapping
  // Unlit and outside tone mapping: with fog the cut-outs dissolve into the exact background colour.
  const material = r.material(new MeshBasicMaterial({ map: atlas, alphaTest: .5, toneMapped: false }))
  const grade = tracksideRoute.start[1], { halfWidth, tile, near, far } = skylinePlan, texel = 1 / skylinePlan.atlas[1]
  /** One upright quad from x0 to x1 mapped onto an atlas row (v0..v1); u repeats every `tile` metres. */
  const quad = (x0: number, x1: number, z: number, high: number, v0: number, v1: number, shift = 0) => {
    const plane = new PlaneGeometry(x1 - x0, high), uv = plane.attributes.uv
    for (let n = 0; n < uv.count; n++) uv.setXY(n, (x0 + uv.getX(n) * (x1 - x0) + halfWidth) / tile + shift, v0 + uv.getY(n) * (v1 - v0))
    return plane.translate((x0 + x1) / 2, grade + high / 2, z)
  }
  const add = (name: string, parts: BufferGeometry[]) => {
    const mesh = r.mesh(skyline, r.geometry(parts.length > 1 ? mergeGeometries(parts) as BufferGeometry : parts[0]), material)
    mesh.name = name; mesh.castShadow = mesh.receiveShadow = false
    if (parts.length > 1) parts.forEach(part => part.dispose())
    return mesh
  }
  add('skyline-far', [quad(-halfWidth, halfWidth, far.z, far.height, .5 + texel, 1 - 4 * texel, far.shift)])
  add('skyline-near', [quad(-halfWidth, near.gap[0], near.z, near.height, texel, .5 - 4 * texel), quad(near.gap[1], halfWidth, near.z, near.height, texel, .5 - 4 * texel)])
  return skyline
}

/** Budget (design §4): low quality keeps a single horizon plane. */
export function setSkylineQuality(skyline: Group, quality: Quality) {
  const far = skyline.getObjectByName('skyline-far'); if (far) far.visible = quality === 'balanced'
}
