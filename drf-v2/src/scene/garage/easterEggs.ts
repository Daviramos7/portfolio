import { BufferAttribute, CanvasTexture, Color, CylinderGeometry, Group, Mesh, MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry, SRGBColorSpace } from 'three'
import type { Quality } from '../../contracts/index.ts'
import type { Resources, Vec3 } from './resources.ts'
import { bodyFont, displayFont } from './canvasText.ts'
import { createPropModelLease } from './propModel.ts'
import type { PropModelLimits } from './propModel.ts'

// M16 fila 19: the approved easter eggs (_fila/NOITE-11-11-DECISOES.md, option A), all in the elevated room.
// Volumes are the cleaned AI 3D meshes (docs/production/ASSETS.md); every word lives in our own canvas atlas,
// never in a generated image. Passive details: no clicks (interactives are a later mission).
// `low` keeps a small selection; `balanced` adds the rest. Coordinates are garage-local (floor y = 0).

type Paint = (x: number, y: number, z: number) => string
type Tier = 'all' | 'full'
export type EasterEggModel = {
  id: string; url: string; tier: Tier; position: Vec3; yaw: number; scale: number
  tilt?: readonly [x: number, z: number]; limits: PropModelLimits
  finish: { roughness: number; metalness?: number; paint: Paint }
}

const solid = (color: string): Paint => () => color
const between = (value: number, low: number, high: number) => value >= low && value < high
// Helmet: DRF-01 livery, matte black with a red and white horizontal band round the shell (decision 11/11).
// The visor faces local +z, so the band stops short of it instead of crossing the opening.
const helmet: Paint = (_x, y, z) => z > .045 ? '#141619' : between(y, .165, .205) ? '#9b1730' : between(y, .205, .222) ? '#d9dede' : '#141619'
// Original mascot: round black base, red race suit with a white chest band, warm face, dark hair.
// The head is large (anime proportions) and starts near y .097; the face looks along local +z.
const mascot: Paint = (_x, y, z) => y < .016 ? '#1b1e22' : y < .028 ? '#2a2d31' : between(y, .07, .079) ? '#e4e6e3' : y < .097 ? '#8e1529' : y > .163 || z < -.024 ? '#2a211d' : '#d6a382'
// Coral snake rings (red, black, yellow-white, black) follow the coil angle; plain belly near the floor.
const coral: Paint = (x, y, z) => {
  if (y < .006) return '#3b2a22'
  const ring = Math.floor((Math.atan2(z, x) / (Math.PI * 2) + .5) * 28 + Math.hypot(x, z) * 30) % 4
  return ['#a5281e', '#121212', '#e3d7a6', '#121212'][ring]
}
// Guitar: gloss black body crossed by a red and a white stripe; dark neck and headstock (no logo).
const guitar: Paint = (x, y) => {
  if (y > .33) return '#241b15'
  const s = y + x * .55
  return between(s, .15, .19) ? '#a31a33' : between(s, .19, .215) ? '#e2e5e4' : '#0f1012'
}
const pot: Paint = (_x, y) => y < .088 ? '#8f4f33' : y < .1 ? '#6d3a25' : '#3f6b36'

export const easterEggModels: readonly EasterEggModel[] = [
  { id:'caneca', url:'models/props/caneca.glb', tier:'all', position:[-6.58,.85,-4.38], yaw:.62, scale:1.4,
    limits:{longest:[.1,.14],triangles:7000}, finish:{roughness:.32,paint:solid('#16181b')} },
  { id:'capacete', url:'models/props/capacete.glb', tier:'all', position:[-2.6,1.085,2.95], yaw:.95, scale:1,
    limits:{longest:[.3,.42],triangles:16000}, finish:{roughness:.62,paint:helmet} },
  { id:'figure', url:'models/props/figure.glb', tier:'all', position:[-7.02,.61,1.15], yaw:1.57, scale:1.6,
    limits:{longest:[.15,.21],triangles:16000}, finish:{roughness:.45,paint:mascot} },
  { id:'amplificador', url:'models/props/amplificador.glb', tier:'full', position:[4.3,.85,-4.58], yaw:-.2, scale:1,
    limits:{longest:[.25,.34],triangles:16000}, finish:{roughness:.85,paint:solid('#1c1e21')} },
  { id:'case-guitarra', url:'models/props/case-guitarra.glb', tier:'full', position:[3.25,0,-5.98], yaw:-.15, scale:1, tilt:[-.1,0],
    limits:{longest:[.95,1.15],triangles:16000}, finish:{roughness:.78,paint:solid('#121315')} },
  { id:'guitarra', url:'models/props/guitarra.glb', tier:'full', position:[2.86,0,-5.86], yaw:.3, scale:1, tilt:[-.06,-.21],
    limits:{longest:[.9,1.1],triangles:16000}, finish:{roughness:.22,paint:guitar} },
  { id:'bola', url:'models/props/bola.glb', tier:'full', position:[-1.75,0,4.05], yaw:.3, scale:1,
    limits:{longest:[.19,.25],triangles:7000}, finish:{roughness:.7,paint:(_x,y)=>y<.05?'#a9a291':'#d8d2c2'} },
  { id:'chuteira-em-pe', url:'models/props/chuteira-em-pe.glb', tier:'full', position:[-1.25,0,4.3], yaw:2.2, scale:1,
    limits:{longest:[.26,.32],triangles:7000}, finish:{roughness:.55,paint:(_x,y)=>y<.018?'#d0d2cf':'#17191c'} },
  { id:'chuteira-caida', url:'models/props/chuteira-caida.glb', tier:'full', position:[-2.25,0,4.45], yaw:-.5, scale:1,
    limits:{longest:[.26,.32],triangles:7000}, finish:{roughness:.55,paint:solid('#17191c')} },
  { id:'cobra-coral', url:'models/props/cobra-coral.glb', tier:'full', position:[-7.62,1.09,-.25], yaw:.4, scale:1,
    limits:{longest:[.27,.33],triangles:7000}, finish:{roughness:.4,paint:coral} },
  { id:'vaso-esp32', url:'models/props/vaso-esp32.glb', tier:'full', position:[6.98,1.05,.55], yaw:-1.2, scale:1.2,
    limits:{longest:[.25,.31],triangles:13000}, finish:{roughness:.8,paint:pot} },
  { id:'cinto-ferramentas', url:'models/props/cinto-ferramentas.glb', tier:'full', position:[8.06,1.02,-2.55], yaw:-Math.PI/2, scale:1,
    limits:{longest:[.55,.65],triangles:16000}, finish:{roughness:.7,paint:solid('#4f3421')} },
]

// Atlas rectangles in pixels (1024 x 1024). Paper is opaque; marks on objects keep a transparent background.
const atlasSize = 1024
const rects = {
  setlist1:[0,0,256,384], setlist2:[256,0,256,384], watchlist:[512,0,256,384], board:[768,0,256,176],
  postit:[768,192,128,128], ticket:[896,192,128,64], tape:[896,264,128,48],
  helmetName:[0,400,256,96], helmetNumber:[256,400,96,96], bootNumber:[352,400,96,96],
  mug:[448,400,320,96], pick:[768,400,96,96], sticker:[864,400,160,72],
} as const
type Rect = keyof typeof rects
const hand = `"Segoe Print", "Bradley Hand", "Comic Sans MS", ${bodyFont}`
const setlists = {
  setlist1:['NOITE 1','Waiting for the End','The Little Things Give You Away','November Rain',"Don't Cry",'Re-Arranged','Boiler','Lost in Hollywood','Soldier Side','Sad Statue','Old School Hollywood'],
  setlist2:['NOITE 2','Bohemian Rhapsody','Love of My Life','Under Pressure','The Show Must Go On','Shine On You Crazy Diamond','Welcome to the Machine','Time','Us and Them','Brain Damage','Eclipse'],
} as const
const watched = ['Dragon Ball','Attack on Titan','Dr. Stone','Death Note','Hunter x Hunter','Cowboy Bebop']
const watching = ['Vinland Saga','Fullmetal Alchemist','Jujutsu Kaisen']

function drawAtlas(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, atlasSize, atlasSize)
  const tile = (name: Rect, draw: (w: number, h: number) => void) => {
    const [x, y, w, h] = rects[name]; ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.translate(x, y); draw(w, h); ctx.restore()
  }
  const paper = (w: number, h: number, color = '#ece6d6') => { ctx.fillStyle = color; ctx.fillRect(0, 0, w, h) }
  const write = (text: string, x: number, y: number, size: number, color = '#1d2a44', weight = 500, family = hand) => {
    ctx.fillStyle = color; ctx.font = `${weight} ${size}px ${family}`; ctx.fillText(text, x, y)
  }
  for (const name of ['setlist1', 'setlist2'] as const) tile(name, (w, h) => {
    paper(w, h)
    const [title, ...songs] = setlists[name]
    write(title, 18, 44, 30, '#8e1529', 700)
    ctx.strokeStyle = '#8e1529'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(16, 54); ctx.lineTo(w - 24, 56); ctx.stroke()
    songs.forEach((song, i) => { ctx.save(); ctx.translate(18, 86 + i * 29); ctx.rotate((i % 3 - 1) * .006); write(song, 0, 0, song.length > 24 ? 13 : 16); ctx.restore() })
  })
  tile('watchlist', (w, h) => {
    paper(w, h, '#f1eee4')
    write('WATCHLIST', 18, 42, 28, '#1d2a44', 700)
    watched.forEach((name, i) => write('✓ ' + name, 20, 82 + i * 30, 17))
    ctx.strokeStyle = '#1d2a44'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(14, 262); ctx.lineTo(w - 18, 260); ctx.stroke()
    write('ASSISTINDO ▸', 18, 290, 18, '#8e1529', 700)
    watching.forEach((name, i) => write(name, 26, 318 + i * 24, 16))
  })
  tile('board', (w, h) => {
    paper(w, h, '#f4f6f5')
    ctx.strokeStyle = '#21407a'; ctx.fillStyle = '#21407a'; ctx.lineWidth = 3
    const states = [[42, 92, 'q0'], [128, 92, 'q1'], [214, 92, 'q2']] as const
    for (const [x, y, label] of states) { ctx.beginPath(); ctx.arc(x, y, 22, 0, Math.PI * 2); ctx.stroke(); write(label, x - 11, y + 7, 18, '#21407a', 700) }
    ctx.beginPath(); ctx.arc(214, 92, 17, 0, Math.PI * 2); ctx.stroke()
    const arrow = (x0: number, x1: number, y: number, label: string) => {
      ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.lineTo(x1 - 8, y - 5); ctx.moveTo(x1, y); ctx.lineTo(x1 - 8, y + 5); ctx.stroke(); write(label, (x0 + x1) / 2 - 6, y - 8, 16, '#b0262e', 700)
    }
    arrow(66, 104, 92, 'a'); arrow(152, 190, 92, 'b'); arrow(4, 18, 92, '')
    // Self loop on q1 and the way back from q2.
    ctx.beginPath(); ctx.arc(128, 62, 13, Math.PI * .85, Math.PI * 2.15); ctx.stroke(); write('a', 122, 40, 16, '#b0262e', 700)
    ctx.beginPath(); ctx.moveTo(204, 114); ctx.quadraticCurveTo(128, 160, 52, 114); ctx.stroke(); write('b', 122, 158, 16, '#b0262e', 700)
  })
  tile('postit', (w, h) => {
    paper(w, h, '#f2dc5d')
    write('não esquecer', 10, 44, 16, '#24304a'); write('o ANALYZE', 10, 74, 17, '#24304a', 700)
    ctx.strokeStyle = '#24304a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(12, 84); ctx.lineTo(110, 82); ctx.stroke()
  })
  tile('ticket', (w, h) => {
    paper(w, h, '#e1cd93')
    ctx.strokeStyle = '#7a6331'; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(96, 0); ctx.lineTo(96, h); ctx.stroke(); ctx.setLineDash([])
    write('THE DARK KNIGHT', 6, 26, 12, '#3d3222', 700, displayFont); write('SALA 3 · 21h00', 6, 48, 12, '#3d3222', 500, bodyFont)
  })
  tile('tape', (w, h) => { paper(w, h, '#d9cba4'); write('SIUUU', 14, 36, 30, '#202020', 700) })
  tile('helmetName', (w) => { ctx.textAlign = 'center'; write('DAVI', w / 2, 74, 72, '#eef0ee', 700, displayFont) })
  tile('helmetNumber', (w) => { ctx.textAlign = 'center'; write('16', w / 2, 70, 62, '#eef0ee', 700, displayFont) })
  tile('bootNumber', (w) => { ctx.textAlign = 'center'; write('7', w / 2, 74, 72, '#c8a24a', 700, displayFont) })
  tile('mug', () => write('SELECT * FROM cafe', 8, 60, 29, '#eceee9', 700, '"Geist Mono", ui-monospace, monospace'))
  tile('pick', (w, h) => {
    ctx.fillStyle = '#a3192f'; ctx.beginPath(); ctx.moveTo(w / 2, h - 6); ctx.bezierCurveTo(8, h * .55, 4, 10, w / 2, 8); ctx.bezierCurveTo(w - 4, 10, w - 8, h * .55, w / 2, h - 6); ctx.fill()
    ctx.textAlign = 'center'; write('DRF', w / 2, 48, 24, '#f1f1ee', 700, displayFont)
  })
  tile('sticker', (w, h) => {
    paper(w, h, '#f0c43a'); ctx.textAlign = 'center'
    write('volume 11', w / 2, 30, 22, '#1b1b1b', 700, displayFont); write('só depois das 18h', w / 2, 56, 17, '#1b1b1b', 600, bodyFont)
  })
}

function mapToRect(geometry: PlaneGeometry | CylinderGeometry, name: Rect) {
  const [x, y, w, h] = rects[name], uv = geometry.getAttribute('uv')
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (x + uv.getX(i) * w) / atlasSize, 1 - (y + (1 - uv.getY(i)) * h) / atlasSize)
  return geometry
}

export function createEasterEggs(r: Resources, dependencies?: Parameters<typeof createPropModelLease>[2]) {
  const root = new Group(); root.name = 'easter-eggs'
  // Built on the first load() (after the first frame, see Garage.loadProps): the atlas, the paper geometry and
  // their shader stay out of the start-up task, which ANGLE/D3D11 already spends ~4 s compiling. Being late, none
  // of it is in the start-up batches; Garage.loadProps batches the `all` tier once it is built.
  type Lease = { spec: EasterEggModel; group: Group; lease: ReturnType<typeof createPropModelLease> }
  const groups = new Map<string, Group>()
  let leases: Lease[] = [], built = false
  function build() {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = atlasSize
    const ctx = canvas.getContext('2d')
    const atlas = r.textTexture(new CanvasTexture(canvas)); atlas.colorSpace = SRGBColorSpace
    // Same program as the floor contact patch (basic, mapped, transparent): no extra shader compile on slow GPUs.
    // Dimmed so paper and prints sit in the room light; the offset beats coplanar flicker on the surfaces.
    const ink = r.material(new MeshBasicMaterial({ map: atlas, color: '#c4c6c4', transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }))
    const redraw = () => { if (ctx) { drawAtlas(ctx); atlas.needsUpdate = true } }
    redraw(); r.onFontsReady?.(redraw)
    const { metal, black, red, white, polymer } = r.palette
    const place = (id: string, tier: Tier, position: Vec3, yaw = 0) => {
      const group = new Group(); group.name = 'easter-egg-' + id; group.userData.tier = tier
      group.position.set(...position); group.rotation.y = yaw; root.add(group); groups.set(id, group); return group
    }
    const decal = (parent: Group, name: Rect, size: readonly [number, number], position: Vec3, rotation: Vec3 = [0, 0, 0]) => {
      const object = r.mesh(parent, mapToRect(r.geometry(new PlaneGeometry(...size)), name), ink, position)
      object.rotation.set(...rotation); object.castShadow = false; object.name = 'easter-egg-mark-' + name; return object
    }

    // Paper and flat details: geometry + atlas, always present (no file to wait for).
    // Post-it hangs from the lower bezel of the pit wall monitor, below the programme text.
    const postit = place('post-it', 'all', [4.62, 1.1, -4.888], 0)
    decal(postit, 'postit', [.13, .13], [0, 0, 0], [0, 0, .07])
    // Watchlist taped to the locker side, facing the telemetry station.
    const watch = place('watchlist', 'all', [-7.355, 1.5, -4.95], Math.PI / 2)
    decal(watch, 'watchlist', [.3, .45], [0, 0, 0], [0, 0, -.03])
    for (const x of [-.11, .11]) r.box(watch, [.07, .02, .002], [x, .22, .002], white)
    // Whiteboard with the hand-drawn automaton on the right wall, between two studs, above the service aisle.
    const board = place('quadro-automato', 'all', [8.1, 2.05, -.95], -Math.PI / 2)
    r.box(board, [1.26, .82, .03], [0, 0, -.016], metal)
    decal(board, 'board', [1.2, .76], [0, 0, .001])
    r.box(board, [.9, .03, .06], [0, -.42, .03], metal)
    // Two setlists side by side, taped to the right wall next to the tool belt.
    const lists = place('setlists', 'full', [8.27, 1.62, -3.38], -Math.PI / 2)
    decal(lists, 'setlist1', [.28, .42], [-.16, 0, 0], [0, 0, .02])
    decal(lists, 'setlist2', [.28, .42], [.16, .01, 0], [0, 0, -.015])
    for (const x of [-.16, .16]) r.box(lists, [.08, .022, .002], [x, .215, .002], white)
    // Full tier stays out of the second static batch so `low` can hide it.
    lists.traverse(object => { object.userData.dynamic = true })
    // Plain tricolour scarf (red, white, black; no crest or name) draped over the facade guard rail.
    const scarf = place('cachecol', 'all', [-1.7, 1.05, -6.28], .04)
    r.box(scarf, [.2, .05, .1], [0, .035, 0], red)
    for (const [z, drop, sway] of [[.06, .58, .05], [-.06, .46, -.04]] as const) {
      const band = new Group(); band.position.set(0, .02, z); band.rotation.x = sway; scarf.add(band)
      const stripe = drop / 6
      for (let i = 0; i < 6; i++) r.box(band, [.2, stripe, .012], [0, -stripe * (i + .5), 0], [red, white, black][i % 3])
    }
    // Helmet stand next to the show car: a satin post on a weighted foot.
    const stand = place('suporte-capacete', 'all', [-2.6, 0, 2.95])
    r.box(stand, [.42, .04, .42], [0, .02, 0], black)
    r.rod(stand, [0, .04, 0], [0, 1.05, 0], .03, metal)
    r.mesh(stand, r.geometry(new CylinderGeometry(.09, .06, .05, 20)), polymer, [0, 1.06, 0])

    leases = easterEggModels.map(spec => {
      const group = place(spec.id, spec.tier, spec.position, spec.yaw)
      if (spec.tilt) { group.rotation.order = 'YXZ'; group.rotation.x = spec.tilt[0]; group.rotation.z = spec.tilt[1] }
      const lease = createPropModelLease(model => {
        const material = r.material(new MeshStandardMaterial({ name: 'easter-egg-' + spec.id, vertexColors: true, roughness: spec.finish.roughness, metalness: spec.finish.metalness ?? 0, envMapIntensity: .6 }))
        // Parse each paint colour once; the loop then only copies three floats per vertex.
        const parsed = new Map<string, Color>()
        model.traverse(object => {
          if (!(object instanceof Mesh)) return
          const position = object.geometry.getAttribute('position'), colors = new Float32Array(position.count * 3)
          for (let i = 0; i < position.count; i++) {
            const key = spec.finish.paint(position.getX(i), position.getY(i), position.getZ(i))
            let color = parsed.get(key); if (!color) { color = new Color(key); parsed.set(key, color) }
            color.toArray(colors, i * 3)
          }
          object.geometry.setAttribute('color', new BufferAttribute(colors, 3))
          // Small props receive the room's shadows but do not cast: ~150k extra triangles stay out of the shadow pass.
          object.material = material; object.castShadow = false; object.receiveShadow = true
        })
        model.name = spec.id + '-model'; model.scale.setScalar(spec.scale); group.add(model)
        marks(spec.id, group)
      }, spec.limits, dependencies)
      return { spec, group, lease }
    })
    // Marks that sit on a generated surface (model-local metres, before the group scale).
    function marks(id: string, group: Group) {
      const s = easterEggModels.find(spec => spec.id === id)?.scale ?? 1
      if (id === 'caneca') {
        // Wrapped on the body (centre x -0.018, radius 0.041), on the side away from the handle.
        const wrap = mapToRect(r.geometry(new CylinderGeometry(.0425, .0425, .026, 24, 1, true, -1.35, 2.7)), 'mug')
        r.mesh(group, wrap, ink, [-.018 * s, .055 * s, 0]).scale.setScalar(s)
      } else if (id === 'capacete') {
        for (const side of [-1, 1]) decal(group, 'helmetName', [.13, .05], [side * .177, .245, -.01], [0, side * Math.PI / 2, 0])
        decal(group, 'helmetNumber', [.035, .035], [0, .27, -.137], [0, Math.PI, 0])
      } else if (id === 'chuteira-em-pe') decal(group, 'bootNumber', [.035, .035], [-.146, .085, 0], [0, -Math.PI / 2, 0])
      else if (id === 'chuteira-caida') decal(group, 'tape', [.11, .04], [.02, .072, .064], [0, 0, .04])
      else if (id === 'amplificador') decal(group, 'sticker', [.08, .036], [.08, .235, .095], [0, 0, -.06])
      else if (id === 'case-guitarra') decal(group, 'pick', [.045, .045], [.02, 1.052, 0], [-Math.PI / 2, 0, .5])
      else if (id === 'cinto-ferramentas') decal(group, 'ticket', [.1, .05], [.005, .25, .052], [0, 0, .28])
      group.traverse(object => { object.userData.dynamic = true })
    }
  }

  // Files are fetched only once loading was requested and the quality is known, so `low` never downloads the
  // full-tier models; moving up to `balanced` later fetches the rest (each lease loads at most once).
  let quality: Quality | null = null, base: string | null = null, queue: Promise<void> = Promise.resolve()
  function applyVisibility() {
    if (quality === null) return
    for (const [, group] of groups) group.visible = quality !== 'low' || group.userData.tier === 'all'
  }
  function sync() {
    if (base === null || quality === null) return Promise.resolve()
    const from = base, wanted = leases.filter(({ spec }) => quality !== 'low' || spec.tier === 'all')
    // One file at a time with a macrotask between them: parsing and painting never stack into one long task.
    const yieldToFrame = () => new Promise<void>(resolve => setTimeout(resolve, 0))
    queue = queue.then(async () => { for (const { spec, lease } of wanted) { await lease.load(new URL(spec.url, from).href); await yieldToFrame() } })
    return queue
  }
  return {
    root,
    setQuality(next: Quality) {
      quality = next
      applyVisibility()
      return sync()
    },
    // Asynchronous and optional: missing files leave only the procedural details.
    load(from = document.baseURI) {
      if (!built) { built = true; build(); applyVisibility() }
      base = from; return sync()
    },
    dispose() { for (const { lease } of leases) lease.dispose() },
    get status() { return Object.fromEntries(leases.map(({ spec, lease }) => [spec.id, lease.status])) },
  }
}
