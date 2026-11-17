import type { Material, Object3D, Texture } from 'three'

/**
 * Evidence only (DEV): estimated GPU bytes of the textures bound to materials in `root` that `uploaded` accepts.
 * Assumes RGBA8 texels plus a full mip chain (x4/3) when the texture generates mipmaps. Render targets
 * (environment, shadow map) are not material maps and are not counted.
 */
export function estimateTextureBytes(root: Object3D, uploaded: (map: Texture) => boolean) {
  const seen = new Set<Texture>(); let bytes = 0
  root.traverse(object => {
    const slot = (object as Object3D & { material?: Material | Material[] }).material
    for (const material of Array.isArray(slot) ? slot : slot ? [slot] : []) {
      for (const value of Object.values(material)) {
        const map = value as Texture | null
        if (!map?.isTexture || seen.has(map)) continue
        seen.add(map)
        const image = map.image as { width?: number, height?: number } | null
        if (image?.width && image.height && uploaded(map)) bytes += image.width * image.height * 4 * (map.generateMipmaps ? 4 / 3 : 1)
      }
    }
  })
  return { bytes: Math.round(bytes), textures: seen.size }
}
