import { CanvasTexture, CylinderGeometry, ExtrudeGeometry, Group, LatheGeometry, MeshStandardMaterial, RepeatWrapping, RingGeometry, SRGBColorSpace, Shape, SphereGeometry, TorusGeometry, Vector2 } from 'three'
import type { Resources } from '../garage/resources.ts'
import { displayFont } from '../garage/canvasText.ts'

// M16 fila 19 (gate 16/11): the tyres read as tyres. Granular rubber with fine circumferential wear on the tread,
// a coloured band and original markings on the sidewall (no real brand, compound name or size code of a supplier).
export const tyreMarkings = { top: 'DRF ENGINEERING', bottom: 'RACE SLICK · 18' } as const
function tyreSurfaces(r: Resources) {
  const size = 256, seeded = (() => { let n = 19; return () => (n = (n * 16807) % 2147483647) / 2147483647 })()
  const make = () => { const canvas = document.createElement('canvas'); canvas.width = canvas.height = size; return canvas }
  const [normal, rough] = [make(), make()]
  const nctx = normal.getContext('2d'), rctx = rough.getContext('2d')
  if (nctx && rctx) {
    const height = new Float32Array(size * size)
    for (let i = 0; i < height.length; i++) height[i] = seeded()
    // Granules: a little blur of white noise; wear: thin lines that run round the tyre (constant v).
    const at = (x: number, y: number) => height[((y + size) % size) * size + (x + size) % size]
    const grain = (x: number, y: number) => (at(x, y) * 2 + at(x + 1, y) + at(x, y + 1)) / 4 + (y % 23 === 0 ? .35 : 0)
    const nimg = nctx.createImageData(size, size), rimg = rctx.createImageData(size, size)
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const nx = (grain(x - 1, y) - grain(x + 1, y)) * 1.4, ny = (grain(x, y - 1) - grain(x, y + 1)) * 1.4, l = Math.hypot(nx, ny, 1), i = (y * size + x) * 4
      nimg.data[i] = (nx / l * .5 + .5) * 255; nimg.data[i + 1] = (ny / l * .5 + .5) * 255; nimg.data[i + 2] = (1 / l * .5 + .5) * 255; nimg.data[i + 3] = 255
      rimg.data[i] = rimg.data[i + 1] = rimg.data[i + 2] = 205 + grain(x, y) * 50 - (y % 23 === 0 ? 60 : 0); rimg.data[i + 3] = 255
    }
    nctx.putImageData(nimg, 0, 0); rctx.putImageData(rimg, 0, 0)
  }
  const [normalMap, roughnessMap] = [normal, rough].map(canvas => { const map = r.texture(new CanvasTexture(canvas)); map.wrapS = map.wrapT = RepeatWrapping; map.repeat.set(20, 2); return map })
  const rubber = r.material(new MeshStandardMaterial({ name: 'tyre-rubber', color: '#1c1d1f', metalness: 0, roughness: 1, roughnessMap, normalMap, normalScale: new Vector2(.45, .45), envMapIntensity: .3 }))
  // Sidewall marks drawn in polar form: the ring's planar UVs put the canvas centre on the axle.
  const side = document.createElement('canvas'); side.width = side.height = 512
  const sctx = side.getContext('2d')
  const marks = r.textTexture(new CanvasTexture(side)); marks.colorSpace = SRGBColorSpace
  const draw = () => {
    if (!sctx) return
    const c = 256, scale = 256 / .585
    sctx.clearRect(0, 0, 512, 512)
    sctx.strokeStyle = '#b8203a'; sctx.lineWidth = .02 * scale; sctx.beginPath(); sctx.arc(c, c, .5 * scale, 0, Math.PI * 2); sctx.stroke()
    sctx.fillStyle = '#e9ebe8'; sctx.font = `700 ${Math.round(.045 * scale)}px ${displayFont}`; sctx.textAlign = 'center'; sctx.textBaseline = 'middle'
    const arc = (text: string, middle: number, flip: boolean) => {
      const radius = .44 * scale, step = .085
      Array.from(text).forEach((letter, i) => {
        const angle = middle + (i - (text.length - 1) / 2) * step * (flip ? -1 : 1)
        sctx.save(); sctx.translate(c + Math.cos(angle) * radius, c + Math.sin(angle) * radius); sctx.rotate(angle + (flip ? -Math.PI / 2 : Math.PI / 2)); sctx.fillText(letter, 0, 0); sctx.restore()
      })
    }
    arc(tyreMarkings.top, -Math.PI / 2, false); arc(tyreMarkings.bottom, Math.PI / 2, true)
    marks.needsUpdate = true
  }
  draw(); r.onFontsReady?.(draw)
  const ink = r.material(new MeshStandardMaterial({ name: 'tyre-sidewall-marks', map: marks, alphaTest: .5, roughness: .9, metalness: 0, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }))
  return { rubber, ink }
}

// Original machined wheel layout. Local X is the axle; Y/Z form both wheel faces.
export function createWheelAssemblies(r: Resources, parent: Group) {
  const tireShape = r.geometry(new LatheGeometry([[.36,-.22],[.53,-.22],[.58,-.17],[.6,-.1],[.6,.1],[.58,.17],[.53,.22],[.36,.22],[.36,-.22]].map(([x,y])=>new Vector2(x,y)),48))
  const rimShape = r.geometry(new LatheGeometry([[.315,-.2],[.36,-.2],[.36,.2],[.315,.2],[.315,-.2]].map(([x,y])=>new Vector2(x,y)),48))
  const discShape = r.geometry(new LatheGeometry([[.075,-.012],[.285,-.012],[.285,.012],[.075,.012],[.075,-.012]].map(([x,y])=>new Vector2(x,y)),40))
  const hubShape = r.geometry(new CylinderGeometry(.083,.083,.065,24))
  const nutShape = r.geometry(new CylinderGeometry(.043,.043,.04,6))
  const spoke = new Shape();spoke.moveTo(-.025,.075);spoke.quadraticCurveTo(-.01,.2,.018,.32);spoke.lineTo(.06,.32);spoke.quadraticCurveTo(.045,.19,.025,.075);spoke.closePath()
  const spokeShape = r.geometry(new ExtrudeGeometry(spoke,{depth:.05,bevelEnabled:true,bevelSize:.007,bevelThickness:.007,bevelSegments:2,steps:1,curveSegments:6}))
  spokeShape.translate(0,0,-.025);spokeShape.rotateY(Math.PI/2)
  const beadShape = r.geometry(new TorusGeometry(.35,.012,8,48));beadShape.rotateY(Math.PI/2)
  const alloy = r.material(new MeshStandardMaterial({color:'#85919b',metalness:.85,roughness:.32}))
  const brake = r.material(new MeshStandardMaterial({color:'#4e4b45',metalness:.65,roughness:.72}))
  const mountShape=r.geometry(new CylinderGeometry(.045,.045,.1,8))
  const { rubber, ink } = tyreSurfaces(r)
  const sidewallShape = r.geometry(new RingGeometry(.365,.585,64,1))
  const pinstripeShape = r.geometry(new TorusGeometry(.33,.005,5,48));pinstripeShape.rotateY(Math.PI/2)
  const valveShape = r.geometry(new CylinderGeometry(.007,.007,.035,6))
  const jointShape=r.geometry(new SphereGeometry(.026,8,6))
  const wheels: Group[]=[]
  for(const z of [-1.6,1.55])for(const side of [-1,1]) {
    const wheel = new Group();wheel.name=`wheel-${z<0?'rear':'front'}-${side<0?'left':'right'}`;wheel.position.set(side*1.3,.605,z);parent.add(wheel);wheels.push(wheel)
    const tire=r.mesh(wheel,tireShape,rubber);tire.rotation.z=Math.PI/2;tire.name='tire'
    const rim=r.mesh(wheel,rimShape,alloy);rim.rotation.z=Math.PI/2;rim.name='closed-rim'
    const disc=r.mesh(wheel,discShape,brake,[side*-.12,0,0]);disc.rotation.z=Math.PI/2;disc.name='brake-disc'
    const axle=r.rod(wheel,[-.2,0,0],[.2,0,0],.055,r.palette.black);axle.name='axle'
    for(const face of [-1,1]) {
      const bead=r.mesh(wheel,beadShape,alloy,[face*.205,0,0]);bead.name='machined-rim-lip-'+face
      const hub=r.mesh(wheel,hubShape,alloy,[face*.185,0,0]);hub.rotation.z=Math.PI/2;hub.name='hub-'+face
      for(let n=0;n<8;n++){const arm=r.mesh(wheel,spokeShape,alloy,[face*.17,0,0]);arm.rotation.x=n*Math.PI/4;arm.name='spoke-'+face+'-'+n}
      // Sidewall band and markings sit just proud of the flat sidewall (|x| = .22); pinstripe on the rim face.
      const marks=r.mesh(wheel,sidewallShape,ink,[face*.2215,0,0]);marks.rotation.y=face*Math.PI/2;marks.castShadow=false;marks.name='tyre-sidewall-'+face
      r.mesh(wheel,pinstripeShape,r.palette.paint,[face*.207,0,0]).name='rim-pinstripe-'+face
    }
    const nut=r.mesh(wheel,nutShape,r.palette.metal,[side*.24,0,0]);nut.rotation.z=Math.PI/2;nut.name='retaining-nut'
    const valve=r.mesh(wheel,valveShape,r.palette.metal,[side*.19,.3,0]);valve.rotation.z=side*.5;valve.name='valve-stem'
    // Wishbones stop at the upright, outside the tire envelope, rather than piercing the rim.
    const upright=r.rod(parent,[side*1.04,.43,z],[side*1.04,.76,z],.028,alloy);upright.name=wheel.name+'-upright'
    const spindle=r.rod(parent,[side*1.04,.605,z],[side*1.14,.605,z],.045,alloy);spindle.name=wheel.name+'-spindle'
    for(const offset of [-.38,.38]) {
      const front=z>0, aft=offset<0
      const lowerPoint: readonly [number,number,number]=front?[side*(aft?.245:.18),aft?.35:.34,aft?.95:1.65]:[side*.32,.36,z+offset]
      const upperPoint: readonly [number,number,number]=front?[side*(aft?.245:.18),aft?.5:.44,aft?.95:1.65]:[side*.36,.72,z+offset]
      const lower=r.rod(parent,lowerPoint,[side*1.04,.46,z],.021,r.palette.carbon);lower.name=wheel.name+'-lower-arm'
      const upper=r.rod(parent,upperPoint,[side*1.04,.72,z],.016,r.palette.carbon);upper.name=wheel.name+'-upper-arm'
      if(front)for(const [kind,point] of [['lower',lowerPoint],['upper',upperPoint]] as const){
        const mount=r.mesh(parent,mountShape,alloy,point);mount.rotation.z=Math.PI/2;mount.name=wheel.name+'-'+kind+'-mount'
      }
    }
    if(z>0) {
      for(const y of [.46,.72])r.mesh(parent,jointShape,alloy,[side*1.04,y,z]).name=wheel.name+'-upright-joint'
      const mount=r.mesh(parent,mountShape,alloy,[side*.28,.6,.5]);mount.rotation.z=Math.PI/2;mount.name=wheel.name+'-pushrod-mount'
      r.rod(parent,[side*.28,.6,.5],[side*1.04,.5,z],.018,alloy).name=wheel.name+'-pushrod'
    }else r.rod(parent,[side*.48,.84,z-.18],[side*1.04,.5,z],.018,alloy)
  }
  return wheels
}
