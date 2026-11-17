import { BoxGeometry, CanvasTexture, Color, Group, LatheGeometry, Matrix4, MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry, SRGBColorSpace, Vector2, Vector3 } from 'three'
import type { BufferGeometry } from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import type { Quality } from '../../contracts/index.ts'
import { roomElevation } from '../camera/framing.ts'
import type { Resources, Vec3 } from './resources.ts'
import { displayFont } from './canvasText.ts'

// M16 4a/4b (D1 B): the pit boxes under the elevated technical room, in world space at the M15 grade.
// 4b keeps only the front: three doors with a false depth of 2 m (a dark back wall right behind the door line).
// The structure is one instanced type; props are a separate group that low quality hides.
const grade = -.007
export const pitBoxes = { bays: [-5.6, 0, 5.6] as const, doorZ: -8.3, depth: 2, doorWidth: 5.2 } as const

/** Reserved places for the AI-3D props and easter eggs (fila 11+). Empty on purpose: no stand-in geometry. */
export const pitBoxSlots: readonly { name: string; bay: number; position: Vec3; source: 'ia-3d' | 'geometria+textura' }[] = [
  { name: 'slot-cobra-cavalete', bay: 0, position: [-6.9, 0, -7.1], source: 'ia-3d' },
  { name: 'slot-cinto-ferramentas', bay: 0, position: [-3.05, 1.6, -7.3], source: 'ia-3d' },
  { name: 'slot-setlists', bay: 0, position: [-5.2, 1.7, -6.32], source: 'geometria+textura' },
  { name: 'slot-bola-chuteiras', bay: 1, position: [1.4, 0, -7.5], source: 'ia-3d' },
  { name: 'slot-vaso-esp32', bay: 1, position: [-1.7, .9, -6.7], source: 'ia-3d' },
  { name: 'slot-placa-rec-pe', bay: 1, position: [0, 2.7, -6.32], source: 'geometria+textura' },
  { name: 'slot-case-guitarra', bay: 2, position: [7.7, 0, -6.6], source: 'ia-3d' },
  { name: 'slot-mini-amp', bay: 2, position: [4.3, .9, -6.7], source: 'ia-3d' },
]

export function createPitLevel(r: Resources) {
  const pit = new Group(); pit.name = 'pit-level-boxes'
  const { black, taskLight, concrete } = r.palette
  const ceiling = roomElevation - .19, { bays, doorZ, depth, doorWidth } = pitBoxes, backZ = doorZ + depth
  // The slab nosing (room-local y -0.5..0, z -8.62) covers the top 0.5 m: the fascia starts right under it.
  const head = roomElevation - .5
  const cube = r.geometry(new BoxGeometry(1, 1, 1))
  // Bay floor sits 5 mm over the apron (grade), from the bay mouth to the false back wall.
  const floor = r.box(pit, [16.8, .02, depth + .2], [0, grade - .01, doorZ + depth / 2], concrete); floor.name = 'pit-bay-floor'; floor.castShadow = false
  // Near-black wall 2 m behind the doors: reads as depth from above without modelling the room behind it.
  const back = r.box(pit, [16.8, ceiling, .2], [0, ceiling / 2, backZ + .1], black); back.name = 'pit-back-wall'; back.castShadow = false

  const tones = { carbon: new Color('#14191d'), panel: new Color('#8f918a'), metal: new Color('#6f7a81'), slat: new Color('#59636a'), red: new Color('#930e29'), white: new Color('#d8dcd8') }
  const items: [size: Vec3, position: Vec3, tone: Color][] = []
  for (const x of [-8.4, -2.8, 2.8, 8.4]) {
    items.push([[.4, ceiling, .4], [x, ceiling / 2, doorZ], tones.carbon])
    items.push([[.15, ceiling, depth], [x, ceiling / 2, doorZ + depth / 2], tones.panel])
  }
  // Fascia over the doors with the team stripe; the room slab is the ceiling.
  items.push([[16.8, .55, .14], [0, head - .275, doorZ - .13], tones.carbon])
  items.push([[16.8, .07, .02], [0, head - .5, doorZ - .21], tones.red])
  for (const x of bays) {
    // Rolled-up shutter: housing plus the last slats of the curtain.
    items.push([[doorWidth, .32, .34], [x, head - .71, doorZ + .1], tones.metal])
    for (let n = 0; n < 4; n++) items.push([[doorWidth, .11, .03], [x, head - .93 - n * .12, doorZ + .02], n % 2 ? tones.metal : tones.slat])
    // Pit box markings in front of each bay (paint only).
    for (const z of [-9.1, -11.6]) items.push([[4.8, .012, .08], [x, grade + .006, z], tones.white])
    for (const side of [-1, 1]) items.push([[.08, .012, 2.5], [x + side * 2.4, grade + .006, -10.35], tones.white])
  }
  // Fast-lane boundary: dashed line along the pit lane.
  for (let x = -29; x <= 29; x += 3) items.push([[1.6, .012, .1], [x, grade + .006, -12.9], tones.white])
  const structure = r.instanced(pit, cube, r.material(new MeshStandardMaterial({ color: '#ffffff', metalness: .05, roughness: .78 })), items.length, 'pit-level-structure')
  items.forEach(([size, position, tone], index) => {
    structure.setMatrixAt(index, new Matrix4().makeTranslation(...position).scale(new Vector3(...size))); structure.setColorAt(index, tone)
  })
  structure.computeBoundingSphere()
  const lights = r.instanced(pit, cube, taskLight, bays.length, 'pit-bay-lights')
  bays.forEach((x, index) => lights.setMatrixAt(index, new Matrix4().makeTranslation(x, ceiling - .03, doorZ + depth / 2).scale(new Vector3(3.6, .04, .25))))
  lights.computeBoundingSphere()

  // Door numbers: one atlas, three quads on the fascia, one draw call.
  const sheet = document.createElement('canvas'); sheet.width = 768; sheet.height = 128
  const ctx = sheet.getContext('2d'), numbers = r.textTexture(new CanvasTexture(sheet)); numbers.colorSpace = SRGBColorSpace
  const draw = () => { if (!ctx) return
    ctx.fillStyle = '#10161b'; ctx.fillRect(0, 0, 768, 128); ctx.textBaseline = 'middle'
    bays.forEach((_, index) => {
      ctx.fillStyle = '#a41431'; ctx.fillRect(index * 256 + 14, 22, 10, 84)
      ctx.fillStyle = '#e9f0f2'; ctx.font = `700 78px ${displayFont}`; ctx.fillText('BOX 0' + (index + 1), index * 256 + 40, 68)
    })
    numbers.needsUpdate = true }
  draw(); r.onFontsReady(draw)
  const plates = bays.map((x, index) => {
    const plate = new PlaneGeometry(1.5, .25), uv = plate.attributes.uv
    for (let n = 0; n < uv.count; n++) uv.setX(n, (index + uv.getX(n)) / bays.length)
    return plate.rotateY(Math.PI).translate(x, head - .22, doorZ - .205) as BufferGeometry
  })
  const signs = r.mesh(pit, r.geometry(mergeGeometries(plates) as BufferGeometry), r.material(new MeshBasicMaterial({ map: numbers, toneMapped: false })))
  signs.name = 'pit-box-numbers'; signs.castShadow = signs.receiveShadow = false; plates.forEach(plate => plate.dispose())

  // Props (balanced only): tyre sets in warming blankets, two stacks per bay. The AI-3D props join this group.
  const props = new Group(); props.name = 'pit-box-props'; pit.add(props)
  const blankets = [new Color('#8f1d2c'), new Color('#22282d'), new Color('#3d5a6b')]
  // Tyre profile with round shoulders and an open hub, so a stack reads as tyres and not as a drum.
  const tyre = r.geometry(new LatheGeometry([[.2, -.16], [.31, -.16], [.36, -.1], [.36, .1], [.31, .16], [.2, .16]].map(([x, y]) => new Vector2(x, y)), 14))
  const stacks = r.instanced(props, tyre, r.material(new MeshStandardMaterial({ color: '#ffffff', metalness: 0, roughness: .92 })), bays.length * 8, 'pit-tyre-blankets')
  bays.forEach((x, bay) => [-1, 1].forEach((side, s) => { for (let n = 0; n < 4; n++) {
    const index = bay * 8 + s * 4 + n
    stacks.setMatrixAt(index, new Matrix4().makeTranslation(x + side * 2.05, grade + .16 + n * .325, doorZ + 1.3)); stacks.setColorAt(index, blankets[(bay + s) % blankets.length])
  } }))
  stacks.computeBoundingSphere()
  const slots = new Group(); slots.name = 'pit-box-slots'; pit.add(slots)
  for (const slot of pitBoxSlots) {
    const anchor = new Group(); anchor.name = slot.name; anchor.position.set(slot.position[0], grade + slot.position[1], slot.position[2])
    anchor.userData = { bay: slot.bay, source: slot.source, reserved: true }; slots.add(anchor)
  }
  return pit
}

/**
 * The boxes hang under the room slab: from inside the room no ray reaches them (slab and sill hide the ground nearer
 * than z -25). Skipping them while the camera is inside the room saves their draw calls on every station.
 * `local` is the camera position in room coordinates.
 */
export const pitLevelHiddenFrom = (local: { x: number; y: number; z: number }) =>
  Math.abs(local.x) < 8.4 && local.y > 0 && local.y < 4.65 && local.z > -6.6 && local.z < 12

/** Budget (design §4): low quality drops the box props (and whatever fills the slots later). */
export function setPitLevelQuality(pit: Group, quality: Quality) {
  for (const name of ['pit-box-props', 'pit-box-slots']) { const group = pit.getObjectByName(name); if (group) group.visible = quality === 'balanced' }
}
