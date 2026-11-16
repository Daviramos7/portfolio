import { Color, Vector4 } from 'three'
import type { MeshPhysicalMaterial, MeshStandardMaterial } from 'three'

// M16 fila 11: the workshop is built from one unit cube and one unit cylinder scaled per part, so their 0..1 UVs
// stretch every weave, brush line and paint texture to the size of the part. This patch maps the material maps in
// object space, in metres (texture `repeat` = tiles per metre), and adds two cheap procedural terms:
// a low-frequency variation of roughness/colour and a narrow worn band along the edges of the unit cube.
// Object space (not world space) keeps the pattern fixed to parts that move or turn (show car, track car, fan).

export type Wear = {
  /** 0..1 blend towards `color` on cube edges. */ edge?: number
  /** Band width in metres; never wider than a quarter of the part's thinnest side. */ width?: number
  /** Roughness added on the worn band (negative = polished). */ roughness?: number
  /** Relative low-frequency variation of roughness (half of it on colour). */ macro?: number
  color?: string
}

const vertexPars = /* glsl */`
attribute float drfCube;
varying vec3 vDrfLocal;
varying vec4 vDrfHalf;
`
const vertexMain = /* glsl */`
mat4 drfMatrix = modelMatrix;
#ifdef USE_INSTANCING
  drfMatrix = modelMatrix * instanceMatrix;
#endif
vec3 drfSize = vec3( length( drfMatrix[ 0 ].xyz ), length( drfMatrix[ 1 ].xyz ), length( drfMatrix[ 2 ].xyz ) );
vec3 drfPoint = position * drfSize;
vec3 drfFacing = abs( normal ) / drfSize;
// U follows the longer side of the face: brush lines and tows run along the part, like extruded stock.
vec2 drfUv = drfFacing.x > drfFacing.y && drfFacing.x > drfFacing.z ? ( drfSize.z >= drfSize.y ? drfPoint.zy : drfPoint.yz )
  : drfFacing.y > drfFacing.z ? ( drfSize.x >= drfSize.z ? drfPoint.xz : drfPoint.zx )
  : ( drfSize.x >= drfSize.y ? drfPoint.xy : drfPoint.yx );
#ifdef USE_MAP
  vMapUv = ( mapTransform * vec3( drfUv, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
  vNormalMapUv = ( normalMapTransform * vec3( drfUv, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
  vRoughnessMapUv = ( roughnessMapTransform * vec3( drfUv, 1 ) ).xy;
#endif
vDrfLocal = drfPoint;
vDrfHalf = vec4( drfSize * .5, drfCube );
`
const fragmentPars = /* glsl */`
varying vec3 vDrfLocal;
varying vec4 vDrfHalf;
uniform vec4 drfWear;
uniform vec3 drfWearColor;
float drfHash( vec3 p ) { p = fract( p * .3183099 + .1 ); p *= 17.; return fract( p.x * p.y * p.z * ( p.x + p.y + p.z ) ); }
float drfNoise( vec3 x ) {
  vec3 i = floor( x ), f = fract( x ); f = f * f * ( 3. - 2. * f );
  return mix( mix( mix( drfHash( i ), drfHash( i + vec3( 1, 0, 0 ) ), f.x ), mix( drfHash( i + vec3( 0, 1, 0 ) ), drfHash( i + vec3( 1, 1, 0 ) ), f.x ), f.y ),
    mix( mix( drfHash( i + vec3( 0, 0, 1 ) ), drfHash( i + vec3( 1, 0, 1 ) ), f.x ), mix( drfHash( i + vec3( 0, 1, 1 ) ), drfHash( i + vec3( 1, 1, 1 ) ), f.x ), f.y ), f.z );
}
`
const fragmentMain = /* glsl */`
{
  float drfMacro = drfNoise( vDrfLocal * 1.9 + 7. ) * .65 + drfNoise( vDrfLocal * 6.3 ) * .35;
  roughnessFactor *= 1. + ( drfMacro - .5 ) * drfWear.w;
  diffuseColor.rgb *= 1. + ( drfMacro - .5 ) * drfWear.w * .5;
  // Distance to the nearest edge of the unit cube, in metres: the face's own axis is ~0, so take the median.
  vec3 drfInset = vDrfHalf.xyz - abs( vDrfLocal );
  float drfEdge = max( min( drfInset.x, drfInset.y ), min( max( drfInset.x, drfInset.y ), drfInset.z ) );
  float drfBand = min( drfWear.y, min( min( vDrfHalf.x, vDrfHalf.y ), vDrfHalf.z ) * .5 ) * ( .3 + 1.2 * drfNoise( vDrfLocal * 31. ) );
  float drfWorn = ( 1. - smoothstep( 0., max( drfBand, 1e-5 ), drfEdge ) ) * drfWear.x * vDrfHalf.w * ( .35 + .65 * drfMacro );
  // Sub-pixel bands fade out instead of sparkling.
  drfWorn *= clamp( drfBand / ( fwidth( drfEdge ) + 1e-6 ), 0., 1. );
  diffuseColor.rgb = mix( diffuseColor.rgb, drfWearColor, drfWorn );
  roughnessFactor = clamp( roughnessFactor + drfWear.z * drfWorn, .04, 1. );
}
`

/** Patches a standard/physical material in place; returns it for chaining inside the palette. */
export function objectSpaceFinish<T extends MeshStandardMaterial>(material: T, wear: Wear = {}): T {
  const uniforms = {
    drfWear: { value: new Vector4(wear.edge ?? 0, wear.width ?? .006, wear.roughness ?? 0, wear.macro ?? 0) },
    drfWearColor: { value: new Color(wear.color ?? '#808080') },
  }
  material.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, uniforms)
    shader.vertexShader = shader.vertexShader.replace('void main() {', vertexPars + 'void main() {')
      .replace('#include <project_vertex>', '#include <project_vertex>\n' + vertexMain)
    shader.fragmentShader = shader.fragmentShader.replace('void main() {', fragmentPars + 'void main() {')
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n' + fragmentMain)
  }
  return material
}

/** Brushed-metal highlight stretch costs an extra BRDF branch: `balanced` only, off on `low`. */
export function setBrushedAnisotropy(material: MeshPhysicalMaterial, enabled: boolean, strength = .55) {
  const next = enabled ? strength : 0
  if (material.anisotropy === next) return
  material.anisotropy = next; material.needsUpdate = true
}
