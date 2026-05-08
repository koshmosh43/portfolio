import * as THREE from 'three'
import { fbm3 } from './proceduralNoise'
import { clamp01 } from './mathUtils'

let dustParticleTexture

export function getDustParticleTexture() {
  if (!dustParticleTexture) dustParticleTexture = createDustParticleTexture()
  return dustParticleTexture
}

const glowTextureByColor = new Map()

/** Wider, softer falloff — shared sprite / points map; cached per hex color */
export function getSoftGlowTexture(color = '#ffffff') {
  let tex = glowTextureByColor.get(color)
  if (!tex) {
    tex = createSoftGlowTexture(color)
    glowTextureByColor.set(color, tex)
  }
  return tex
}

function createSoftGlowTexture(color = '#ffffff') {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')
  const center = canvas.width / 2
  const grad = ctx.createRadialGradient(center, center, 0, center, center, center)
  grad.addColorStop(0, color)
  grad.addColorStop(0.05, color)
  grad.addColorStop(0.2, 'rgba(255,255,255,0.38)')
  grad.addColorStop(0.45, 'rgba(255,255,255,0.12)')
  grad.addColorStop(0.72, 'rgba(255,255,255,0.03)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.needsUpdate = true
  return tex
}

function createDustParticleTexture() {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const image = ctx.createImageData(size, size)
  const cx = size * 0.5
  const cy = size * 0.5

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const idx = (y * size + x) * 4
      const nx = (x - cx) / cx
      const ny = (y - cy) / cy
      const r = Math.sqrt(nx * nx + ny * ny)
      const ang = Math.atan2(ny, nx)
      const streak = 0.5 + 0.5 * Math.cos(ang * 3.0 + r * 8.0)
      const grain = fbm3(nx * 6.2, ny * 6.2, 0.7, 23.1, 3)
      const body = Math.max(0, 1 - Math.pow(r, 1.55))
      const alpha = clamp01((body * 0.78 + body * streak * 0.32 + grain * 0.24 - 0.12) * 1.15)
      const c = Math.round(222 + 24 * body)
      image.data[idx] = c
      image.data[idx + 1] = c
      image.data[idx + 2] = c
      image.data[idx + 3] = Math.round(alpha * 255)
    }
  }

  ctx.putImageData(image, 0, 0)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = THREE.ClampToEdgeWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  tex.needsUpdate = true
  return tex
}
