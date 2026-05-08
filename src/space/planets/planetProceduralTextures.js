import * as THREE from 'three'
import { fbm3 } from '../proceduralNoise'
import { TAU, clamp01, createRng, hexToRgb, lerpRgb } from '../mathUtils'


export function fillSaaSDustRingBuffers(count, seed, positions, colors, sunAzimuth = 1.12) {
  const rng = createRng(seed)
  const r0 = 0.67
  const width = 0.29
  const rJit = 0.0045
  const uBias = 0.59
  const h0 = 0.0006
  const h1 = 0.00155
  const kFine = 21
  const kGap = 5.75
  const kMicro = 47
  const gapW = 0.88

  for (let i = 0; i < count; i += 1) {
    const θ = rng() * TAU
    const u = rng() ** uBias
    const edge =
      THREE.MathUtils.smoothstep(u, 0.028, 0.095) * THREE.MathUtils.smoothstep(1 - u, 0.028, 0.085)
    const r = r0 + u * width + (rng() - 0.5) * rJit

    const stripe = 0.5 + 0.5 * Math.sin(TAU * kFine * u + 0.7)
    const g = Math.sin(TAU * kGap * u - 0.23)
    const gap = 1 - gapW * g * g * g * g
    const micro = 0.8 + 0.2 * (0.5 + 0.5 * Math.sin(TAU * kMicro * u + 2.1))
    const z = (rng() - 0.5) * (h0 + (1 - u) * h1) * gap

    const lit = 0.07 + 0.93 * Math.pow(Math.max(0, Math.cos(θ - sunAzimuth)), 0.5)
    const warm = 0.5 + 0.5 * Math.sin(TAU * 3.5 * u + 1.9)
    const k = THREE.MathUtils.clamp(stripe * (0.5 + 0.5 * warm) * gap * micro * edge * lit, 0, 1)
    const flick = 0.89 + rng() * 0.11

    let R = THREE.MathUtils.lerp(0.035, 0.95, k) * flick
    let Gv = THREE.MathUtils.lerp(0.015, 0.32, k) * flick
    let B = THREE.MathUtils.lerp(0.025, 0.46, k) * flick

    if (rng() > 0.9935 && lit > 0.38) {
      R = Math.min(1, R + 0.24)
      Gv = Math.min(1, Gv + 0.16)
      B = Math.min(1, B + 0.36)
    }

    const j = i * 3
    positions[j] = Math.cos(θ) * r
    positions[j + 1] = Math.sin(θ) * r
    positions[j + 2] = z
    colors[j] = R
    colors[j + 1] = Gv
    colors[j + 2] = B
  }
}

export function createTerrainSurfaceTextures(options) {
  const width = options.terrainW ?? 256
  const height = options.terrainH ?? 128
  const rng = createRng(options.seed)
  const craterCanvas = document.createElement('canvas')
  craterCanvas.width = width
  craterCanvas.height = height
  const craterCtx = craterCanvas.getContext('2d')
  craterCtx.fillStyle = 'black'
  craterCtx.fillRect(0, 0, width, height)

  for (let i = 0; i < 72; i += 1) {
    const cx = rng() * width
    const cy = rng() * height
    const radius = 6 + rng() * 38
    const drawCrater = (xOffset) => {
      const cxx = cx + xOffset
      const gradient = craterCtx.createRadialGradient(cxx, cy, radius * 0.08, cxx, cy, radius)
      gradient.addColorStop(0, 'rgba(255,255,255,0.62)')
      gradient.addColorStop(0.42, 'rgba(255,255,255,0.25)')
      gradient.addColorStop(1, 'rgba(0,0,0,0)')
      craterCtx.fillStyle = gradient
      craterCtx.beginPath()
      craterCtx.arc(cxx, cy, radius, 0, Math.PI * 2)
      craterCtx.fill()
    }

    drawCrater(0)
    if (cx - radius < 0) drawCrater(width)
    if (cx + radius > width) drawCrater(-width)
  }
  const craterData = craterCtx.getImageData(0, 0, width, height).data

  const colorCanvas = document.createElement('canvas')
  colorCanvas.width = width
  colorCanvas.height = height
  const colorCtx = colorCanvas.getContext('2d')
  const colorImg = colorCtx.createImageData(width, height)

  const bumpCanvas = document.createElement('canvas')
  bumpCanvas.width = width
  bumpCanvas.height = height
  const bumpCtx = bumpCanvas.getContext('2d')
  const bumpImg = bumpCtx.createImageData(width, height)

  const roughCanvas = document.createElement('canvas')
  roughCanvas.width = width
  roughCanvas.height = height
  const roughCtx = roughCanvas.getContext('2d')
  const roughImg = roughCtx.createImageData(width, height)

  const deepSea = hexToRgb(options.deepSea)
  const shallowSea = hexToRgb(options.shallowSea)
  const plains = hexToRgb(options.plains)
  const forest = hexToRgb(options.forest)
  const mountain = hexToRgb(options.mountain)
  const snow = hexToRgb(options.snow)

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = (y * width + x) * 4
      const nx = x / (width - 1)
      const ny = y / height
      const lat = Math.abs(ny - 0.5) * 2
      const lon = nx * Math.PI * 2
      const latAngle = (ny - 0.5) * Math.PI
      const cosLat = Math.cos(latAngle)
      const sx = Math.cos(lon) * cosLat
      const sy = Math.sin(latAngle)
      const sz = Math.sin(lon) * cosLat

      const terrain = fbm3(sx * 2.8, sy * 2.8, sz * 2.8, options.seed, 4)
      const detail = fbm3(sx * 8.4, sy * 8.4, sz * 8.4, options.seed + 100, 3)
      const ridgeNoise = fbm3(sx * 4.8, sy * 4.8, sz * 4.8, options.seed + 40, 3)
      const ridges = Math.pow(Math.abs(ridgeNoise - 0.5) * 2, 1.8)
      const biomeNoise = fbm3(sx * 1.9, sy * 1.9, sz * 1.9, options.seed + 300, 3)
      const crater = craterData[idx] / 255
      const craterDepression = crater * 0.28
      const polarCap = clamp01((lat - 0.73) / 0.27) * options.polarStrength

      let elevation = terrain * 0.66 + detail * 0.22 + ridges * 0.2 - craterDepression
      elevation = clamp01(elevation + polarCap * 0.22)
      const biomeShift = (biomeNoise - 0.5) * 0.12

      let color
      let roughness
      if (elevation < options.seaLevel) {
        const t = clamp01(elevation / options.seaLevel)
        color = lerpRgb(deepSea, shallowSea, t)
        roughness = 36 + (1 - t) * 20
      } else if (elevation < options.forestLevel + biomeShift) {
        const t = clamp01((elevation - options.seaLevel) / (options.forestLevel - options.seaLevel + 0.08))
        color = lerpRgb(plains, forest, t)
        roughness = 145 + t * 45
      } else if (elevation < options.mountainLevel + biomeShift * 0.5) {
        const t = clamp01((elevation - options.forestLevel) / (options.mountainLevel - options.forestLevel + 0.05))
        color = lerpRgb(forest, mountain, t)
        roughness = 165 + t * 50
      } else {
        const t = clamp01((elevation - options.mountainLevel) / (1 - options.mountainLevel))
        color = lerpRgb(mountain, snow, t + polarCap * 0.55)
        roughness = 210
      }

      if (crater > 0.14) {
        const craterShade = clamp01((crater - 0.14) * 1.2)
        color = lerpRgb(color, [Math.max(0, color[0] - 24), Math.max(0, color[1] - 24), Math.max(0, color[2] - 24)], craterShade)
      }

      colorImg.data[idx] = color[0]
      colorImg.data[idx + 1] = color[1]
      colorImg.data[idx + 2] = color[2]
      colorImg.data[idx + 3] = 255

      const bump = Math.round(clamp01(elevation) * 255)
      bumpImg.data[idx] = bump
      bumpImg.data[idx + 1] = bump
      bumpImg.data[idx + 2] = bump
      bumpImg.data[idx + 3] = 255

      roughImg.data[idx] = roughness
      roughImg.data[idx + 1] = roughness
      roughImg.data[idx + 2] = roughness
      roughImg.data[idx + 3] = 255
    }
  }

  colorCtx.putImageData(colorImg, 0, 0)
  bumpCtx.putImageData(bumpImg, 0, 0)
  roughCtx.putImageData(roughImg, 0, 0)

  const createTex = (canvas, colorSpace = THREE.SRGBColorSpace) => {
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = colorSpace
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.ClampToEdgeWrapping
    tex.needsUpdate = true
    return tex
  }

  return {
    color: createTex(colorCanvas, THREE.SRGBColorSpace),
    bump: createTex(bumpCanvas, THREE.NoColorSpace),
    roughness: createTex(roughCanvas, THREE.NoColorSpace),
  }
}

export function createCloudAlphaTexture() {
  const size = 192
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const img = ctx.createImageData(size, size)
  const seed = Math.random() * 1000 + 1
  const cx = size * 0.5

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const idx = (y * size + x) * 4
      const nx = (x / size - 0.5) * 2
      const ny = (y / size - 0.5) * 2
      const r = Math.sqrt(nx * nx + ny * ny)
      const angle = Math.atan2(ny, nx)

      const swirlX = nx * 2.15 + Math.cos(angle * 1.4) * 0.5
      const swirlY = ny * 1.62 + Math.sin(angle * 1.2) * 0.35
      const body = fbm3(swirlX, swirlY, 0.25, seed, 5)
      const cellular = fbm3(nx * 7.2 + body * 1.2, ny * 5.8 - body * 0.8, 1.4, seed + 50, 4)
      const wisps = fbm3(nx * 18.0 + ny * 2.4, ny * 11.0, 2.8, seed + 120, 3)
      const erosion = THREE.MathUtils.smoothstep(cellular * 0.7 + wisps * 0.3, 0.18, 0.78)
      const edge = Math.max(0, 1 - Math.pow(r, 1.55))
      const core = THREE.MathUtils.smoothstep(body * 0.82 + cellular * 0.34 - erosion * 0.18, 0.33, 0.86)
      const alpha = clamp01(core * edge * edge * 1.35)

      const lit = clamp01(0.56 + (1 - Math.abs((x - cx) / size)) * 0.3 + (0.5 - ny) * 0.14)
      const c = Math.round(205 + lit * 50)
      img.data[idx] = c
      img.data[idx + 1] = c
      img.data[idx + 2] = c
      img.data[idx + 3] = Math.round(alpha * 255)
    }
  }

  ctx.putImageData(img, 0, 0)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = THREE.ClampToEdgeWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  tex.minFilter = THREE.LinearFilter
  tex.magFilter = THREE.LinearFilter
  tex.needsUpdate = true
  return tex
}

export function createPlanetCloudBandTexture({ seed = 1, width = 768, height = 384, density = 1, tint = [255, 235, 240] } = {}) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  const img = ctx.createImageData(width, height)

  for (let y = 0; y < height; y += 1) {
    const v = y / height
    const lat = Math.abs(v - 0.5) * 2
    for (let x = 0; x < width; x += 1) {
      const u = x / width
      const idx = (y * width + x) * 4
      const jet = Math.sin((v * 6.0 + fbm3(u * 3.5, v * 2.5, 0.4, seed + 11, 3) * 0.55) * TAU)
      const curlU = u * 7.0 + jet * 0.11
      const curlV = v * 4.4 + Math.sin(u * TAU * 2.0) * 0.055
      const belts =
        0.48 * fbm3(curlU, curlV, 0.2, seed, 5) +
        0.34 * fbm3(u * 18.0 + jet * 0.55, v * 8.0, 1.3, seed + 37, 4) +
        0.18 * fbm3(u * 44.0, v * 19.0 + jet * 0.25, 2.7, seed + 91, 3)
      const streak = 0.5 + 0.5 * Math.sin((u * 13.0 + belts * 1.9 + v * 1.1) * TAU)
      const lane = Math.abs(Math.sin((v * 5.2 + belts * 0.8) * TAU))
      const band = THREE.MathUtils.smoothstep(belts * 0.72 + streak * 0.16 + lane * 0.1, 0.46, 0.84)
      const erosion = fbm3(u * 72.0, v * 28.0, 3.8, seed + 211, 2)
      const alpha = clamp01((band - 0.48 - lat * 0.28 - erosion * 0.12) * 1.55 * density)
      const shade = clamp01(0.68 + belts * 0.25 + streak * 0.08 - lat * 0.1)
      img.data[idx] = Math.round(tint[0] * shade)
      img.data[idx + 1] = Math.round(tint[1] * shade)
      img.data[idx + 2] = Math.round(tint[2] * shade)
      img.data[idx + 3] = Math.round(alpha * 255)
    }
  }

  ctx.putImageData(img, 0, 0)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  tex.minFilter = THREE.LinearFilter
  tex.magFilter = THREE.LinearFilter
  tex.needsUpdate = true
  return tex
}

export function createPlanetCloudLayerTextures(seed) {
  return {
    near: createPlanetCloudBandTexture({ seed, density: 1.05, tint: [255, 226, 234] }),
    mid: createPlanetCloudBandTexture({ seed: seed + 37, density: 0.82, tint: [255, 210, 224] }),
    far: createPlanetCloudBandTexture({ seed: seed + 91, density: 0.58, tint: [255, 190, 208] }),
  }
}

export function createMoonSurfaceTextures({
  seed = 1,
  moonW: width = 256,
  moonH: height = 128,
  baseColor = '#aeb3bf',
  darkColor = '#787d88',
  lightColor = '#d9dde6',
}) {
  const rng = createRng(seed)
  const colorCanvas = document.createElement('canvas')
  colorCanvas.width = width
  colorCanvas.height = height
  const colorCtx = colorCanvas.getContext('2d')
  const colorImg = colorCtx.createImageData(width, height)

  const bumpCanvas = document.createElement('canvas')
  bumpCanvas.width = width
  bumpCanvas.height = height
  const bumpCtx = bumpCanvas.getContext('2d')
  const bumpImg = bumpCtx.createImageData(width, height)

  const roughCanvas = document.createElement('canvas')
  roughCanvas.width = width
  roughCanvas.height = height
  const roughCtx = roughCanvas.getContext('2d')
  const roughImg = roughCtx.createImageData(width, height)

  const craterCanvas = document.createElement('canvas')
  craterCanvas.width = width
  craterCanvas.height = height
  const craterCtx = craterCanvas.getContext('2d')
  craterCtx.fillStyle = 'black'
  craterCtx.fillRect(0, 0, width, height)
  for (let i = 0; i < 64; i += 1) {
    const cx = rng() * width
    const cy = rng() * height
    const r = 3 + rng() * 22
    const drawCrater = (xOffset) => {
      const cxx = cx + xOffset
      const grad = craterCtx.createRadialGradient(cxx, cy, r * 0.18, cxx, cy, r)
      grad.addColorStop(0, 'rgba(255,255,255,0.85)')
      grad.addColorStop(0.45, 'rgba(255,255,255,0.25)')
      grad.addColorStop(1, 'rgba(0,0,0,0)')
      craterCtx.fillStyle = grad
      craterCtx.beginPath()
      craterCtx.arc(cxx, cy, r, 0, Math.PI * 2)
      craterCtx.fill()
    }
    drawCrater(0)
    if (cx - r < 0) drawCrater(width)
    if (cx + r > width) drawCrater(-width)
  }
  const craterData = craterCtx.getImageData(0, 0, width, height).data

  const base = hexToRgb(baseColor)
  const dark = hexToRgb(darkColor)
  const light = hexToRgb(lightColor)
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = (y * width + x) * 4
      const nx = x / (width - 1)
      const ny = y / height
      const lon = nx * Math.PI * 2
      const lat = (ny - 0.5) * Math.PI
      const cl = Math.cos(lat)
      const sx = Math.cos(lon) * cl
      const sy = Math.sin(lat)
      const sz = Math.sin(lon) * cl

      const macro = fbm3(sx * 3.4, sy * 3.4, sz * 3.4, seed + 40, 4)
      const micro = fbm3(sx * 12, sy * 12, sz * 12, seed + 90, 3)
      const crater = craterData[idx] / 255
      const h = clamp01(macro * 0.65 + micro * 0.25 - crater * 0.32)

      const c1 = lerpRgb(dark, base, h)
      const c2 = lerpRgb(c1, light, clamp01((h - 0.62) * 2.2))
      colorImg.data[idx] = c2[0]
      colorImg.data[idx + 1] = c2[1]
      colorImg.data[idx + 2] = c2[2]
      colorImg.data[idx + 3] = 255

      const bump = Math.round(clamp01(h) * 255)
      bumpImg.data[idx] = bump
      bumpImg.data[idx + 1] = bump
      bumpImg.data[idx + 2] = bump
      bumpImg.data[idx + 3] = 255

      const rough = Math.round(170 + clamp01(1 - h + crater * 0.7) * 70)
      roughImg.data[idx] = rough
      roughImg.data[idx + 1] = rough
      roughImg.data[idx + 2] = rough
      roughImg.data[idx + 3] = 255
    }
  }

  colorCtx.putImageData(colorImg, 0, 0)
  bumpCtx.putImageData(bumpImg, 0, 0)
  roughCtx.putImageData(roughImg, 0, 0)

  const createTex = (canvas, colorSpace = THREE.SRGBColorSpace) => {
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = colorSpace
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.ClampToEdgeWrapping
    tex.needsUpdate = true
    return tex
  }

  return {
    color: createTex(colorCanvas, THREE.SRGBColorSpace),
    bump: createTex(bumpCanvas, THREE.NoColorSpace),
    roughness: createTex(roughCanvas, THREE.NoColorSpace),
  }
}

/** Hyper-realistic moon: ridged highlands, bowl-and-rim craters, micro-craters, and gradient bump. */
export function createPlayableMoonPlanetSurfaceTextures({ seed = 407, moonW: W = 256, moonH: H = 128 } = {}) {
  const rng = createRng(seed)

  const wrappedDx = (x, cx) => {
    let dx = x - cx
    while (dx > W / 2) dx -= W
    while (dx < -W / 2) dx += W
    return dx
  }

  const ridged = (sx, sy, sz, s, o) => {
    const v = fbm3(sx, sy, sz, seed + s, o)
    return 1 - Math.abs(v * 2 - 1)
  }

  const splatCrater = (elev, cx, cy, R, bowlD, rimH) => {
    if (R < 0.8) return
    const y0 = Math.max(0, Math.floor(cy - R - 2))
    const y1 = Math.min(H - 1, Math.ceil(cy + R + 2))
    const xBase = Math.floor(cx)
    const rCeil = Math.ceil(R) + 2
    for (let y = y0; y <= y1; y += 1) {
      const dy = y - cy
      for (let dx = -rCeil; dx <= rCeil; dx += 1) {
        const xw = (xBase + dx + W * 100) % W
        const dxw = wrappedDx(xw, cx)
        const dist = Math.hypot(dxw, dy)
        if (dist > R) continue
        const t = dist / R
        const bowl = -bowlD * (1 - t * t) * (1 - t * 0.35) * 1.08
        const rim = rimH * Math.exp(-Math.pow((t - 0.88) / 0.14, 2))
        const idx = y * W + xw
        elev[idx] += bowl + rim
      }
    }
  }

  const elev = new Float32Array(W * H)
  for (let y = 0; y < H; y += 1) {
    const ny = y / H
    const lat = (ny - 0.5) * Math.PI
    const cl = Math.cos(lat)
    for (let x = 0; x < W; x += 1) {
      const nx = x / (W - 1)
      const lon = nx * Math.PI * 2
      const sx = Math.cos(lon) * cl
      const sy = Math.sin(lat)
      const sz = Math.sin(lon) * cl
      const macro = fbm3(sx * 2.8, sy * 2.8, sz * 2.8, seed + 44, 4)
      const meso = fbm3(sx * 7, sy * 7, sz * 7, seed + 71, 4)
      const micro = fbm3(sx * 22, sy * 22, sz * 22, seed + 91, 3)
      const r1 = ridged(sx * 4.2, sy * 4.2, sz * 4.2, 120, 4)
      const r2 = ridged(sx * 9, sy * 9, sz * 9, 180, 3) * 0.55
      const mareBasin = clamp01(0.52 - macro) * 0.14
      let h =
        macro * 0.28 +
        meso * 0.14 +
        micro * 0.065 +
        r1 * 0.2 +
        r2 * 0.12 -
        mareBasin
      elev[y * W + x] = h
    }
  }

  for (let i = 0; i < 42; i += 1) {
    splatCrater(elev, rng() * W, rng() * H, 22 + rng() * 22, 0.38 + rng() * 0.18, 0.06 + rng() * 0.05)
  }
  for (let i = 0; i < 95; i += 1) {
    splatCrater(elev, rng() * W, rng() * H, 12 + rng() * 14, 0.22 + rng() * 0.16, 0.045 + rng() * 0.04)
  }
  for (let i = 0; i < 220; i += 1) {
    splatCrater(elev, rng() * W, rng() * H, 4 + rng() * 9, 0.12 + rng() * 0.12, 0.028 + rng() * 0.028)
  }
  for (let i = 0; i < 950; i += 1) {
    splatCrater(elev, rng() * W, rng() * H, 1.2 + rng() * 4.2, 0.045 + rng() * 0.07, 0.008 + rng() * 0.018)
  }

  let emin = Infinity
  let emax = -Infinity
  for (let i = 0; i < elev.length; i += 1) {
    emin = Math.min(emin, elev[i])
    emax = Math.max(emax, elev[i])
  }
  const eSpan = Math.max(0.0001, emax - emin)
  const norm = new Float32Array(W * H)
  for (let i = 0; i < elev.length; i += 1) {
    norm[i] = (elev[i] - emin) / eSpan
  }

  const slope = new Float32Array(W * H)
  for (let y = 0; y < H; y += 1) {
    const ym = y === 0 ? 0 : y - 1
    const yp = y === H - 1 ? H - 1 : y + 1
    for (let x = 0; x < W; x += 1) {
      const xm = (x - 1 + W) % W
      const xp = (x + 1) % W
      const gx = (norm[y * W + xp] - norm[y * W + xm]) * 0.5
      const gy = (norm[yp * W + x] - norm[ym * W + x]) * 0.5
      slope[y * W + x] = Math.hypot(gx, gy)
    }
  }

  const colorCanvas = document.createElement('canvas')
  colorCanvas.width = W
  colorCanvas.height = H
  const colorCtx = colorCanvas.getContext('2d')
  const colorImg = colorCtx.createImageData(W, H)

  const bumpCanvas = document.createElement('canvas')
  bumpCanvas.width = W
  bumpCanvas.height = H
  const bumpCtx = bumpCanvas.getContext('2d')
  const bumpImg = bumpCtx.createImageData(W, H)

  const roughCanvas = document.createElement('canvas')
  roughCanvas.width = W
  roughCanvas.height = H
  const roughCtx = roughCanvas.getContext('2d')
  const roughImg = roughCtx.createImageData(W, H)

  const mareRgb = hexToRgb('#252a48')
  const midRgb = hexToRgb('#6d6a7a')
  const highRgb = hexToRgb('#efe6dc')
  const peachRgb = hexToRgb('#e4a068')
  const tealRgb = hexToRgb('#3d9da4')
  const goldRgb = hexToRgb('#e8d9a8')
  const shadowRgb = hexToRgb('#1f1c22')
  const pitRgb = hexToRgb('#121014')

  for (let y = 0; y < H; y += 1) {
    const ny = y / H
    const lat = (ny - 0.5) * Math.PI
    const cl = Math.cos(lat)
    for (let x = 0; x < W; x += 1) {
      const idx = (y * W + x) * 4
      const i = y * W + x
      const nx = x / (W - 1)
      const lon = nx * Math.PI * 2
      const sx = Math.cos(lon) * cl
      const sy = Math.sin(lat)
      const sz = Math.sin(lon) * cl
      const mineral = fbm3(sx * 15, sy * 15, sz * 15, seed + 410, 2)
      const n = norm[i]
      const sl = slope[i]
      const hVis = n - sl * 0.42

      const tMare = clamp01((0.4 - hVis) * 3.45 + sl * 0.45)
      const tHigh = clamp01((hVis - 0.48) * 3.15)
      let c2 = lerpRgb(midRgb, mareRgb, Math.min(1, tMare))
      c2 = lerpRgb(c2, highRgb, tHigh)
      if (mineral > 0.58 && hVis < 0.5) {
        c2 = lerpRgb(c2, tealRgb, (mineral - 0.58) * 2.05)
      }
      if (mineral > 0.54 && hVis > 0.55) {
        c2 = lerpRgb(c2, peachRgb, (mineral - 0.54) * 1.45)
      }
      if (hVis > 0.7 && sl < 0.11) {
        c2 = lerpRgb(c2, goldRgb, 0.22 + (hVis - 0.7) * 0.45)
      }
      if (sl > 0.18) {
        c2 = lerpRgb(c2, shadowRgb, Math.min(1, (sl - 0.18) * 2.55))
      }
      if (sl > 0.34) {
        c2 = lerpRgb(c2, pitRgb, (sl - 0.34) * 1.35)
      }
      const ao = clamp01(1 - sl * 1.52 - (1 - n) * 0.26)
      const capLift = hVis > 0.64 && sl < 0.09 ? 1 + (hVis - 0.64) * 0.35 : 1
      c2 = [
        Math.round(Math.min(255, c2[0] * ao * capLift)),
        Math.round(Math.min(255, c2[1] * ao * capLift)),
        Math.round(Math.min(255, c2[2] * ao * capLift)),
      ]

      colorImg.data[idx] = c2[0]
      colorImg.data[idx + 1] = c2[1]
      colorImg.data[idx + 2] = c2[2]
      colorImg.data[idx + 3] = 255

      const bumpMix = clamp01(0.32 * n + 0.68 * Math.min(1, sl * 3.45))
      const bumpPow = Math.pow(bumpMix, 0.68)
      const bump = Math.round(clamp01(0.1 + bumpPow * 0.9) * 255)
      bumpImg.data[idx] = bump
      bumpImg.data[idx + 1] = bump
      bumpImg.data[idx + 2] = bump
      bumpImg.data[idx + 3] = 255

      const rough = Math.round(158 + clamp01(1 - n * 0.92 + sl * 1.18) * 97)
      roughImg.data[idx] = rough
      roughImg.data[idx + 1] = rough
      roughImg.data[idx + 2] = rough
      roughImg.data[idx + 3] = 255
    }
  }

  colorCtx.putImageData(colorImg, 0, 0)
  bumpCtx.putImageData(bumpImg, 0, 0)
  roughCtx.putImageData(roughImg, 0, 0)

  const dispCanvas = document.createElement('canvas')
  dispCanvas.width = W
  dispCanvas.height = H
  const dispCtx = dispCanvas.getContext('2d')
  const dispImg = dispCtx.createImageData(W, H)
  for (let i = 0; i < W * H; i += 1) {
    const ex = clamp01(0.5 + (norm[i] - 0.5) * 1.92)
    const v = Math.round(ex * 255)
    const o = i * 4
    dispImg.data[o] = v
    dispImg.data[o + 1] = v
    dispImg.data[o + 2] = v
    dispImg.data[o + 3] = 255
  }
  dispCtx.putImageData(dispImg, 0, 0)

  const createTex = (canvas, colorSpace = THREE.SRGBColorSpace) => {
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = colorSpace
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.ClampToEdgeWrapping
    tex.needsUpdate = true
    return tex
  }

  return {
    color: createTex(colorCanvas, THREE.SRGBColorSpace),
    bump: createTex(bumpCanvas, THREE.NoColorSpace),
    roughness: createTex(roughCanvas, THREE.NoColorSpace),
    displacement: createTex(dispCanvas, THREE.NoColorSpace),
  }
}

/** Moon-like (craters + displacement), but with ~1/3 relief; grassy green palette. */
export function createSassGrassPlanetSurfaceTextures({ seed = 521, moonW: W = 256, moonH: H = 128 } = {}) {
  const REL = 0.38
  const rng = createRng(seed)

  const wrappedDx = (x, cx) => {
    let dx = x - cx
    while (dx > W / 2) dx -= W
    while (dx < -W / 2) dx += W
    return dx
  }

  const ridged = (sx, sy, sz, s, o) => {
    const v = fbm3(sx, sy, sz, seed + s, o)
    return 1 - Math.abs(v * 2 - 1)
  }

  const splatCrater = (elev, cx, cy, R, bowlD, rimH) => {
    if (R < 0.8) return
    const y0 = Math.max(0, Math.floor(cy - R - 2))
    const y1 = Math.min(H - 1, Math.ceil(cy + R + 2))
    const xBase = Math.floor(cx)
    const rCeil = Math.ceil(R) + 2
    for (let y = y0; y <= y1; y += 1) {
      const dy = y - cy
      for (let dx = -rCeil; dx <= rCeil; dx += 1) {
        const xw = (xBase + dx + W * 100) % W
        const dxw = wrappedDx(xw, cx)
        const dist = Math.hypot(dxw, dy)
        if (dist > R) continue
        const t = dist / R
        const bowl = -bowlD * (1 - t * t) * (1 - t * 0.35) * 1.08
        const rim = rimH * Math.exp(-Math.pow((t - 0.88) / 0.14, 2))
        elev[y * W + xw] += bowl + rim
      }
    }
  }

  const elev = new Float32Array(W * H)
  for (let y = 0; y < H; y += 1) {
    const ny = y / H
    const lat = (ny - 0.5) * Math.PI
    const cl = Math.cos(lat)
    for (let x = 0; x < W; x += 1) {
      const nx = x / (W - 1)
      const lon = nx * Math.PI * 2
      const sx = Math.cos(lon) * cl
      const sy = Math.sin(lat)
      const sz = Math.sin(lon) * cl
      const macro = fbm3(sx * 2.8, sy * 2.8, sz * 2.8, seed + 44, 4)
      const meso = fbm3(sx * 7, sy * 7, sz * 7, seed + 71, 4)
      const micro = fbm3(sx * 22, sy * 22, sz * 22, seed + 91, 3)
      const r1 = ridged(sx * 4.2, sy * 4.2, sz * 4.2, 120, 4)
      const r2 = ridged(sx * 9, sy * 9, sz * 9, 180, 3) * 0.55
      const mareBasin = clamp01(0.52 - macro) * 0.14
      const h =
        REL *
        (macro * 0.3 + meso * 0.155 + micro * 0.078 + r1 * 0.24 + r2 * 0.13 - mareBasin)
      elev[y * W + x] = h
    }
  }

  for (let i = 0; i < 14; i += 1) {
    splatCrater(
      elev,
      rng() * W,
      rng() * H,
      22 + rng() * 22,
      REL * (0.38 + rng() * 0.18),
      REL * (0.06 + rng() * 0.05),
    )
  }
  for (let i = 0; i < 32; i += 1) {
    splatCrater(
      elev,
      rng() * W,
      rng() * H,
      12 + rng() * 14,
      REL * (0.22 + rng() * 0.16),
      REL * (0.045 + rng() * 0.04),
    )
  }
  for (let i = 0; i < 73; i += 1) {
    splatCrater(
      elev,
      rng() * W,
      rng() * H,
      4 + rng() * 9,
      REL * (0.12 + rng() * 0.12),
      REL * (0.028 + rng() * 0.028),
    )
  }
  for (let i = 0; i < 317; i += 1) {
    splatCrater(
      elev,
      rng() * W,
      rng() * H,
      1.2 + rng() * 4.2,
      REL * (0.045 + rng() * 0.07),
      REL * (0.008 + rng() * 0.018),
    )
  }

  let emin = Infinity
  let emax = -Infinity
  for (let i = 0; i < elev.length; i += 1) {
    emin = Math.min(emin, elev[i])
    emax = Math.max(emax, elev[i])
  }
  const eSpan = Math.max(0.0001, emax - emin)
  const norm = new Float32Array(W * H)
  for (let i = 0; i < elev.length; i += 1) {
    norm[i] = (elev[i] - emin) / eSpan
  }

  const slope = new Float32Array(W * H)
  for (let y = 0; y < H; y += 1) {
    const ym = (y - 1 + H) % H
    const yp = (y + 1) % H
    for (let x = 0; x < W; x += 1) {
      const xm = (x - 1 + W) % W
      const xp = (x + 1) % W
      const gx = (norm[y * W + xp] - norm[y * W + xm]) * 0.5
      const gy = (norm[yp * W + x] - norm[ym * W + x]) * 0.5
      slope[y * W + x] = Math.hypot(gx, gy)
    }
  }

  const colorCanvas = document.createElement('canvas')
  colorCanvas.width = W
  colorCanvas.height = H
  const colorCtx = colorCanvas.getContext('2d')
  const colorImg = colorCtx.createImageData(W, H)

  const bumpCanvas = document.createElement('canvas')
  bumpCanvas.width = W
  bumpCanvas.height = H
  const bumpCtx = bumpCanvas.getContext('2d')
  const bumpImg = bumpCtx.createImageData(W, H)

  const roughCanvas = document.createElement('canvas')
  roughCanvas.width = W
  roughCanvas.height = H
  const roughCtx = roughCanvas.getContext('2d')
  const roughImg = roughCtx.createImageData(W, H)

  /* FinTech: richer valleys/ridges, with more readable relief under lighting. */
  const valleyRgb = hexToRgb('#0f241c')
  const midRgb = hexToRgb('#264a3a')
  const hillRgb = hexToRgb('#4a9a72')
  const brightRgb = hexToRgb('#9ad4b4')
  const mossRgb = hexToRgb('#2d5c48')
  const shadowRgb = hexToRgb('#0a1812')
  const pitRgb = hexToRgb('#050f0c')

  for (let y = 0; y < H; y += 1) {
    const ny = y / H
    const lat = (ny - 0.5) * Math.PI
    const cl = Math.cos(lat)
    for (let x = 0; x < W; x += 1) {
      const idx = (y * W + x) * 4
      const i = y * W + x
      const nx = x / (W - 1)
      const lon = nx * Math.PI * 2
      const sx = Math.cos(lon) * cl
      const sy = Math.sin(lat)
      const sz = Math.sin(lon) * cl
      const mineral = fbm3(sx * 15, sy * 15, sz * 15, seed + 410, 2)
      const n = norm[i]
      const sl = slope[i]
      const hVis = n - sl * 0.4

      const tLow = clamp01((0.4 - hVis) * 3.35 + sl * 0.42)
      const tHigh = clamp01((hVis - 0.48) * 3.05)
      let c2 = lerpRgb(midRgb, valleyRgb, Math.min(1, tLow))
      c2 = lerpRgb(c2, hillRgb, tHigh)
      if (mineral > 0.56 && hVis < 0.52) {
        c2 = lerpRgb(c2, mossRgb, (mineral - 0.56) * 1.75)
      }
      if (hVis > 0.66 && sl < 0.12) {
        c2 = lerpRgb(c2, brightRgb, 0.18 + (hVis - 0.66) * 0.55)
      }
      if (sl > 0.17) {
        c2 = lerpRgb(c2, shadowRgb, Math.min(1, (sl - 0.17) * 2.35))
      }
      if (sl > 0.32) {
        c2 = lerpRgb(c2, pitRgb, (sl - 0.32) * 1.12)
      }
      const ao = clamp01(1 - sl * 1.48 - (1 - n) * 0.2)
      const capLift = hVis > 0.6 && sl < 0.095 ? 1 + (hVis - 0.6) * 0.38 : 1
      c2 = [
        Math.round(Math.min(255, c2[0] * ao * capLift)),
        Math.round(Math.min(255, c2[1] * ao * capLift)),
        Math.round(Math.min(255, c2[2] * ao * capLift)),
      ]

      colorImg.data[idx] = c2[0]
      colorImg.data[idx + 1] = c2[1]
      colorImg.data[idx + 2] = c2[2]
      colorImg.data[idx + 3] = 255

      const bumpMix = clamp01(0.32 * n + 0.68 * Math.min(1, sl * 3.35))
      const bumpPow = Math.pow(bumpMix, 0.7)
      const bump = Math.round(clamp01(0.1 + bumpPow * 0.9) * 255)
      bumpImg.data[idx] = bump
      bumpImg.data[idx + 1] = bump
      bumpImg.data[idx + 2] = bump
      bumpImg.data[idx + 3] = 255

      const rough = Math.round(160 + clamp01(1 - n * 0.9 + sl * 1.12) * 95)
      roughImg.data[idx] = rough
      roughImg.data[idx + 1] = rough
      roughImg.data[idx + 2] = rough
      roughImg.data[idx + 3] = 255
    }
  }

  colorCtx.putImageData(colorImg, 0, 0)
  bumpCtx.putImageData(bumpImg, 0, 0)
  roughCtx.putImageData(roughImg, 0, 0)

  const dispCanvas = document.createElement('canvas')
  dispCanvas.width = W
  dispCanvas.height = H
  const dispCtx = dispCanvas.getContext('2d')
  const dispImg = dispCtx.createImageData(W, H)
  const dispK = 2.08 * REL
  for (let i = 0; i < W * H; i += 1) {
    const ex = clamp01(0.5 + (norm[i] - 0.5) * dispK)
    const v = Math.round(ex * 255)
    const o = i * 4
    dispImg.data[o] = v
    dispImg.data[o + 1] = v
    dispImg.data[o + 2] = v
    dispImg.data[o + 3] = 255
  }
  dispCtx.putImageData(dispImg, 0, 0)

  const createTex = (canvas, colorSpace = THREE.SRGBColorSpace) => {
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = colorSpace
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.ClampToEdgeWrapping
    tex.needsUpdate = true
    return tex
  }

  return {
    color: createTex(colorCanvas, THREE.SRGBColorSpace),
    bump: createTex(bumpCanvas, THREE.NoColorSpace),
    roughness: createTex(roughCanvas, THREE.NoColorSpace),
    displacement: createTex(dispCanvas, THREE.NoColorSpace),
  }
}
