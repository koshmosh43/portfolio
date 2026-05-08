import * as THREE from 'three'

function createRng(seed) {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let x = Math.imul(t ^ (t >>> 15), t | 1)
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61)
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Tiny in-memory equirectangular “deep space” map for IBL (no network, ~instant).
 * Tuned for dark cosmic scenes + readable speculars on metal/glass.
 */
export function createNightGalaxyEquirectTexture() {
  const w = 512
  const h = 256
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  const rng = createRng(0x2a71c9)

  const skyG = ctx.createLinearGradient(0, 0, 0, h)
  skyG.addColorStop(0, '#02040d')
  skyG.addColorStop(0.32, '#060d22')
  skyG.addColorStop(0.5, '#0a1430')
  skyG.addColorStop(0.68, '#060818')
  skyG.addColorStop(1, '#010206')
  ctx.fillStyle = skyG
  ctx.fillRect(0, 0, w, h)

  for (let i = 0; i < 9; i += 1) {
    const nx = rng() * w
    const ny = rng() * h * 0.72
    const r = 70 + rng() * 130
    const g = ctx.createRadialGradient(nx, ny, 0, nx, ny, r)
    const a = 0.035 + rng() * 0.055
    if (rng() > 0.48) {
      g.addColorStop(0, `rgba(55, 140, 255, ${a})`)
      g.addColorStop(0.55, `rgba(20, 40, 90, ${a * 0.35})`)
      g.addColorStop(1, 'rgba(0,0,0,0)')
    } else {
      g.addColorStop(0, `rgba(255, 70, 170, ${a * 0.75})`)
      g.addColorStop(0.5, `rgba(80, 20, 60, ${a * 0.3})`)
      g.addColorStop(1, 'rgba(0,0,0,0)')
    }
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
  }

  ctx.save()
  ctx.translate(w * 0.5, h * 0.4)
  ctx.rotate(-0.38)
  const band = ctx.createLinearGradient(-w, 0, w, 0)
  band.addColorStop(0, 'rgba(255,255,255,0)')
  band.addColorStop(0.42, 'rgba(190, 210, 255, 0.065)')
  band.addColorStop(0.5, 'rgba(255, 245, 255, 0.085)')
  band.addColorStop(0.58, 'rgba(160, 190, 255, 0.055)')
  band.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = band
  ctx.fillRect(-w, -48, w * 2, 96)
  ctx.restore()

  for (let i = 0; i < 1200; i += 1) {
    const x = rng() * w
    const y = rng() * h
    const big = rng() < 0.028
    const sz = big ? 1.4 + rng() * 1.1 : 0.5 + rng() * 0.55
    const br = 0.18 + rng() * 0.82
    ctx.fillStyle = `rgba(248, 252, 255, ${br * (0.22 + rng() * 0.55)})`
    ctx.fillRect(x, y, sz, sz)
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.mapping = THREE.EquirectangularReflectionMapping
  tex.colorSpace = THREE.SRGBColorSpace
  tex.generateMipmaps = false
  tex.minFilter = THREE.LinearFilter
  tex.magFilter = THREE.LinearFilter
  tex.needsUpdate = true
  return tex
}
