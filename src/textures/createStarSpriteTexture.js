import * as THREE from 'three'

const SPRITE_SIZE = 64

/** Tight core + fast alpha falloff — reads as a point under bloom, not a huge bokeh disc. */
export function createStarSpriteTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = SPRITE_SIZE
  canvas.height = SPRITE_SIZE
  const ctx = canvas.getContext('2d')
  const half = SPRITE_SIZE / 2
  const r = half * 0.36
  const gradient = ctx.createRadialGradient(half, half, 0, half, half, r)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.22, 'rgba(255,255,255,0.92)')
  gradient.addColorStop(0.45, 'rgba(255,255,255,0.22)')
  gradient.addColorStop(0.72, 'rgba(255,255,255,0.04)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
  return texture
}
