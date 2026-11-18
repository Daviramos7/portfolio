import { ACESFilmicToneMapping, Box3, BoxGeometry, CanvasTexture, DirectionalLight, DoubleSide, Group, HemisphereLight, Mesh, MeshBasicMaterial, MeshStandardMaterial, PerspectiveCamera, PlaneGeometry, SRGBColorSpace, Scene, Sphere, WebGLRenderer } from 'three'
import type { BufferGeometry, Material, Texture } from 'three'
import { atlasSize, drawAtlas, easterEggModels, eggMarkGeometry, eggMarks, mapToRect } from '../garage/easterEggs.ts'
import { createPropModelLease } from '../garage/propModel.ts'
import type { ShowcaseItem } from './showcaseCatalog.ts'

export function showcaseModel(item: ShowcaseItem) {
  const source = item.source
  return source.kind === 'model' ? easterEggModels.find(spec => spec.id === source.modelId) ?? null : null
}
export type ShowcaseStatus = 'loading' | 'ready' | 'fallback'
export type ShowcaseOptions = { reducedMotion: boolean; light: boolean; base?: string; onStatus?: (status: ShowcaseStatus) => void }

// Fila 25: a small renderer of its own, alive only while the overlay is open. The room renderer keeps its context,
// scene and loaded files untouched; prop bytes come from the shared cache, so a framed egg is not downloaded twice.
export const showcaseLimits = { minZoom: .55, maxZoom: 1.8, maxPitch: .9, spin: .35 } as const
export const clampZoom = (zoom: number) => Math.min(showcaseLimits.maxZoom, Math.max(showcaseLimits.minZoom, zoom))
export const clampPitch = (pitch: number) => Math.min(showcaseLimits.maxPitch, Math.max(-showcaseLimits.maxPitch, pitch))

export function createShowcaseRenderer(canvas: HTMLCanvasElement, options: ShowcaseOptions) {
  const renderer = new WebGLRenderer({ canvas, antialias: !options.light, alpha: true, powerPreference: 'low-power' })
  if (renderer.getContext().isContextLost()) { renderer.dispose(); throw new Error('showcase: WebGL context lost') }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, options.light ? 1.5 : 2))
  renderer.toneMapping = ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05
  const scene = new Scene(), camera = new PerspectiveCamera(30, 1, .01, 60)
  scene.add(new HemisphereLight('#e4edf2', '#1d2329', 1.7))
  const key = new DirectionalLight('#fff4e6', 2.6); key.position.set(1.6, 2.2, 2.6); scene.add(key)
  const rim = new DirectionalLight('#b9d3ff', 1.3); rim.position.set(-2.2, 1.1, -2); scene.add(rim)
  const pivot = new Group(); scene.add(pivot)

  const geometries = new Set<BufferGeometry>(), materials = new Set<Material>(), textures = new Set<Texture>()
  const own = <T extends BufferGeometry>(g: T) => { geometries.add(g); return g }
  const mat = <T extends Material>(m: T) => { materials.add(m); return m }
  // The room's own atlas drawing (setlists, watchlist, marks): words stay in our canvas, never in an image.
  const atlasCanvas = document.createElement('canvas'); atlasCanvas.width = atlasCanvas.height = atlasSize
  const atlasCtx = atlasCanvas.getContext('2d'), atlas = new CanvasTexture(atlasCanvas); textures.add(atlas)
  atlas.colorSpace = SRGBColorSpace; atlas.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy())
  const redraw = () => { if (atlasCtx && !disposed) { drawAtlas(atlasCtx); atlas.needsUpdate = true; invalidate() } }

  let disposed = false, frame = 0, last = 0, distance = 1, needsRender = true
  let yaw = -.35, pitch = .12, zoom = 1, lease: ReturnType<typeof createPropModelLease> | null = null
  const status = (value: ShowcaseStatus) => { canvas.dataset.showcaseStatus = value; options.onStatus?.(value) }
  function invalidate() { needsRender = true; if (!frame && !disposed) frame = requestAnimationFrame(tick) }
  redraw(); void document.fonts?.ready.then(redraw)

  function fit(object: Group) {
    object.updateMatrixWorld(true)
    const box = new Box3().setFromObject(object), sphere = box.getBoundingSphere(new Sphere())
    object.position.sub(sphere.center)
    distance = Math.max(.05, sphere.radius) / Math.sin((camera.fov * Math.PI / 180) / 2) * 1.08
    camera.near = distance / 50; camera.far = distance * 10; camera.updateProjectionMatrix()
  }
  function clear() {
    lease?.dispose(); lease = null
    for (const child of [...pivot.children]) pivot.remove(child)
  }
  function ink(dark = false) {
    return mat(new MeshBasicMaterial({ map: atlas, color: dark ? '#24272b' : '#e6e8e4', transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }))
  }
  function paper(item: ShowcaseItem & { source: { kind: 'paper' } }) {
    const holder = new Group()
    const sheetMaterial = mat(new MeshBasicMaterial({ map: atlas, side: DoubleSide, transparent: true }))
    for (const sheet of item.source.sheets) {
      const g = own(mapToRect(new PlaneGeometry(...sheet.size), sheet.rect))
      const mesh = new Mesh(g, sheetMaterial); mesh.position.x = sheet.offset; mesh.rotation.z = sheet.tilt; holder.add(mesh)
    }
    return holder
  }
  function scarf() {
    const holder = new Group(), box = own(new BoxGeometry(1, 1, 1))
    const colours = ['#7e0d24', '#d3dcde', '#11141a'].map(color => mat(new MeshStandardMaterial({ color, roughness: .85 })))
    const part = (parent: Group, size: [number, number, number], y: number, material: Material) => { const m = new Mesh(box, material); m.scale.set(...size); m.position.y = y; parent.add(m) }
    part(holder, [.2, .05, .1], .035, colours[0])
    for (const [z, drop, sway] of [[.06, .58, .05], [-.06, .46, -.04]] as const) {
      const band = new Group(); band.position.set(0, .02, z); band.rotation.x = sway; holder.add(band)
      const stripe = drop / 6
      for (let i = 0; i < 6; i++) part(band, [.2, stripe, .012], -stripe * (i + .5), colours[i % 3])
    }
    return holder
  }

  function show(item: ShowcaseItem) {
    if (disposed) return
    clear(); yaw = -.35; pitch = .12; zoom = 1
    const source = item.source
    if (source.kind === 'paper') { const object = paper({ ...item, source }); pivot.add(object); fit(object); status('ready'); invalidate(); return }
    if (source.kind === 'scarf') { const object = scarf(); pivot.add(object); fit(object); status('ready'); invalidate(); return }
    const spec = showcaseModel(item)
    if (!spec) { status('fallback'); return }
    status('loading')
    const holder = new Group()
    const current = lease = createPropModelLease(model => {
      if (lease !== current) return
      let map: Texture | null = null, normal: Partial<Pick<MeshStandardMaterial, 'normalMap' | 'normalScale'>> = {}
      model.traverse(object => {
        if (map || !(object instanceof Mesh) || Array.isArray(object.material)) return
        const source = object.material as MeshStandardMaterial; map = source.map ?? null
        if (source.normalMap) normal = { normalMap: source.normalMap, normalScale: source.normalScale.clone() }
      })
      const glow = spec.glow && map ? { emissive: '#ffffff', emissiveMap: map, emissiveIntensity: spec.glow } : {}
      const surface = mat(new MeshStandardMaterial({ map, color: map ? spec.finish.tint ?? '#ffffff' : '#3a3c3f', roughness: spec.finish.roughness, metalness: spec.finish.metalness ?? 0, ...normal, ...glow }))
      model.traverse(object => { if (object instanceof Mesh) object.material = surface })
      model.scale.setScalar(spec.scale); holder.add(model)
      for (const mark of eggMarks(spec.id)) {
        const mesh = new Mesh(own(eggMarkGeometry(mark)), ink(mark.dark))
        if (mark.wrap) { mesh.position.set(...mark.position).multiplyScalar(spec.scale); mesh.scale.setScalar(spec.scale) }
        else { mesh.position.set(...mark.position); if (mark.rotation) mesh.rotation.set(...mark.rotation) }
        holder.add(mesh)
      }
      pivot.add(holder); fit(holder); status('ready'); invalidate()
    }, spec.limits)
    const url = new URL(options.light ? spec.lightUrl ?? spec.url : spec.url, options.base ?? document.baseURI).href
    void current.load(url).then(() => { if (lease === current && current.status !== 'loaded') status('fallback') })
  }

  function resize() {
    const width = canvas.clientWidth, height = canvas.clientHeight
    if (!width || !height) return
    renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix(); invalidate()
  }
  const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null
  observer?.observe(canvas); resize()

  function tick(time: number) {
    frame = 0
    if (disposed) return
    const dt = last ? Math.min(.05, (time - last) / 1000) : 0; last = time
    const spinning = !options.reducedMotion && pointers.size === 0 && pivot.children.length > 0
    if (spinning) yaw += dt * showcaseLimits.spin
    if (spinning || needsRender) {
      pivot.rotation.set(pitch, yaw, 0, 'XYZ')
      camera.position.set(0, 0, distance * zoom); camera.lookAt(0, 0, 0)
      renderer.render(scene, camera); needsRender = false
      canvas.dataset.showcaseYaw = yaw.toFixed(3); canvas.dataset.showcaseZoom = zoom.toFixed(3)
    }
    if (spinning) frame = requestAnimationFrame(tick); else last = 0
  }

  // Drag turns (mouse and touch), wheel and pinch zoom within limits. Pointer capture keeps a drag that leaves the canvas.
  const pointers = new Map<number, { x: number; y: number }>()
  let pinch = 0
  const spread = () => { const [a, b] = [...pointers.values()]; return Math.hypot(a.x - b.x, a.y - b.y) }
  function down(event: PointerEvent) {
    canvas.setPointerCapture?.(event.pointerId); pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
    if (pointers.size === 2) pinch = spread()
  }
  function move(event: PointerEvent) {
    const previous = pointers.get(event.pointerId)
    if (!previous) return
    const next = { x: event.clientX, y: event.clientY }; pointers.set(event.pointerId, next)
    if (pointers.size === 2) { const now = spread(); if (pinch > 0 && now > 0) zoom = clampZoom(zoom * pinch / now); pinch = now }
    else { yaw += (next.x - previous.x) * .01; pitch = clampPitch(pitch + (next.y - previous.y) * .01) }
    invalidate()
  }
  function up(event: PointerEvent) { pointers.delete(event.pointerId); pinch = pointers.size === 2 ? spread() : 0; invalidate() }
  function wheel(event: WheelEvent) { event.preventDefault(); zoom = clampZoom(zoom * Math.exp(event.deltaY * .001)); invalidate() }
  canvas.addEventListener('pointerdown', down); canvas.addEventListener('pointermove', move)
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up)
  canvas.addEventListener('wheel', wheel, { passive: false })

  return {
    show,
    /** Keyboard turn/zoom for the overlay's buttons and arrow keys. */
    nudge(turn: number, zoomBy = 1) { yaw += turn; zoom = clampZoom(zoom * zoomBy); invalidate() },
    get zoom() { return zoom },
    dispose() {
      if (disposed) return
      disposed = true; if (frame) cancelAnimationFrame(frame); frame = 0
      observer?.disconnect(); clear()
      canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointermove', move)
      canvas.removeEventListener('pointerup', up); canvas.removeEventListener('pointercancel', up); canvas.removeEventListener('wheel', wheel)
      for (const item of geometries) item.dispose()
      for (const item of materials) item.dispose()
      for (const item of textures) item.dispose()
      renderer.dispose(); renderer.forceContextLoss()
    },
  }
}
