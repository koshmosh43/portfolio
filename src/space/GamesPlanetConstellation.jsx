import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

const LETTER_HEIGHT = 0.18
const LETTER_SPACING = 0.05
const WORD_SPACING = 0.09
const WORD_SPACE = 0.13
const SAMPLE_STEP = 0.065

const STROKE_FONT = {
  G: {
    width: 0.13,
    strokes: [
      [[0.95, 0.86], [0.6, 0.98], [0.22, 0.82], [0.1, 0.52], [0.22, 0.18], [0.56, 0.04], [0.88, 0.18]],
      [[0.88, 0.18], [0.88, 0.42], [0.62, 0.42]],
    ],
  },
  A: {
    width: 0.125,
    strokes: [
      [[0.1, 0], [0.5, 1], [0.9, 0]],
      [[0.28, 0.44], [0.72, 0.44]],
    ],
  },
  B: {
    width: 0.118,
    strokes: [
      [[0.11, 0.02], [0.11, 0.98]],
      [[0.11, 0.98], [0.5, 0.94], [0.76, 0.8], [0.76, 0.62], [0.5, 0.52], [0.11, 0.5]],
      [[0.11, 0.5], [0.52, 0.46], [0.8, 0.34], [0.82, 0.16], [0.52, 0.04], [0.11, 0.02]],
    ],
  },
  M: {
    width: 0.15,
    strokes: [[[0.08, 0], [0.08, 1], [0.5, 0.45], [0.92, 1], [0.92, 0]]],
  },
  E: {
    width: 0.12,
    strokes: [
      [[0.12, 0], [0.12, 1]],
      [[0.12, 1], [0.92, 1]],
      [[0.12, 0.5], [0.74, 0.5]],
      [[0.12, 0], [0.94, 0]],
    ],
  },
  S: {
    width: 0.12,
    strokes: [[[0.9, 0.9], [0.58, 1], [0.22, 0.83], [0.3, 0.58], [0.76, 0.5], [0.94, 0.26], [0.6, 0.04], [0.18, 0.12]]],
  },
  P: {
    width: 0.122,
    strokes: [
      [[0.14, 0], [0.14, 1]],
      [[0.14, 0.98], [0.78, 0.9], [0.86, 0.64], [0.72, 0.48], [0.14, 0.48]],
    ],
  },
  L: {
    width: 0.11,
    strokes: [[[0.12, 1], [0.12, 0.04], [0.92, 0.04]]],
  },
  N: {
    width: 0.135,
    strokes: [[[0.1, 0], [0.1, 1], [0.9, 0], [0.9, 1]]],
  },
  T: {
    width: 0.126,
    strokes: [
      [[0.08, 1], [0.92, 1]],
      [[0.5, 1], [0.5, 0.02]],
    ],
  },
  F: {
    width: 0.115,
    strokes: [
      [[0.12, 0], [0.12, 1]],
      [[0.12, 1], [0.92, 1]],
      [[0.12, 0.52], [0.76, 0.52]],
    ],
  },
  I: {
    width: 0.085,
    strokes: [
      [[0.5, 0.08], [0.5, 0.92]],
      [[0.28, 0.08], [0.72, 0.08]],
      [[0.28, 0.92], [0.72, 0.92]],
    ],
  },
  C: {
    width: 0.128,
    strokes: [
      [
        [0.86, 0.22],
        [0.62, 0.06],
        [0.34, 0.1],
        [0.14, 0.36],
        [0.1, 0.58],
        [0.18, 0.84],
        [0.44, 0.98],
        [0.78, 0.88],
      ],
    ],
  },
  H: {
    width: 0.128,
    strokes: [
      [[0.1, 0], [0.1, 1]],
      [[0.9, 0], [0.9, 1]],
      [[0.1, 0.5], [0.9, 0.5]],
    ],
  },
  Y: {
    width: 0.128,
    strokes: [
      [[0.08, 0.98], [0.52, 0.5], [0.92, 0.98]],
      [[0.52, 0.5], [0.52, 0.02]],
    ],
  },
  D: {
    width: 0.13,
    strokes: [
      [[0.12, 0.03], [0.12, 0.97]],
      [[0.12, 0.97], [0.58, 0.93], [0.86, 0.72], [0.9, 0.5], [0.86, 0.28], [0.58, 0.07], [0.12, 0.03]],
    ],
  },
  R: {
    width: 0.126,
    strokes: [
      [[0.12, 0], [0.12, 1]],
      [[0.12, 0.98], [0.74, 0.9], [0.82, 0.64], [0.68, 0.48], [0.12, 0.48]],
      [[0.5, 0.48], [0.9, 0.02]],
    ],
  },
  V: {
    width: 0.13,
    strokes: [[[0.1, 1], [0.5, 0], [0.9, 1]]],
  },
  '&': {
    width: 0.136,
    strokes: [
      [[0.82, 0.12], [0.62, 0.02], [0.34, 0.1], [0.22, 0.28], [0.28, 0.44], [0.5, 0.56], [0.74, 0.74], [0.7, 0.92], [0.46, 0.98], [0.24, 0.86], [0.2, 0.66], [0.38, 0.5], [0.64, 0.36], [0.9, 0.18]],
    ],
  },
  '/': {
    width: 0.09,
    strokes: [[[0.12, 0], [0.88, 1]]],
  },
  3: {
    width: 0.124,
    strokes: [[
      [0.16, 0.9], [0.42, 1], [0.76, 0.9], [0.84, 0.68], [0.62, 0.52], [0.84, 0.36], [0.76, 0.1], [0.42, 0], [0.16, 0.1],
    ]],
  },
}

function rotate2d(x, y, a) {
  const c = Math.cos(a)
  const s = Math.sin(a)
  return [x * c - y * s, x * s + y * c]
}

function sampleStroke(points, originX, originY, width) {
  const stars = []
  const segments = []
  let prevIndex = -1
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i]
    const b = points[i + 1]
    const ax = originX + a[0] * width
    const ay = originY + a[1] * LETTER_HEIGHT
    const bx = originX + b[0] * width
    const by = originY + b[1] * LETTER_HEIGHT
    const dx = bx - ax
    const dy = by - ay
    const len = Math.hypot(dx, dy)
    const steps = Math.max(2, Math.ceil(len / SAMPLE_STEP))
    for (let s = 0; s <= steps; s += 1) {
      const t = s / steps
      const x = ax + dx * t
      const y = ay + dy * t
      const idx = stars.length
      stars.push(new THREE.Vector3(x, y, 0))
      if (prevIndex >= 0) segments.push([prevIndex, idx])
      prevIndex = idx
    }
  }
  return { stars, segments }
}

/** Lowercase letters use the same glyph as uppercase, scaled for small-caps “SaaS”-style spelling. */
const LOWERCASE_GLYPH_SCALE = 0.74

function buildWordData(word, originX, originY) {
  const stars = []
  const segments = []
  let x = originX
  for (let li = 0; li < word.length; li += 1) {
    const raw = word[li]
    if (raw === ' ') {
      x += WORD_SPACE
      continue
    }
    const upperCh = raw.toUpperCase()
    const glyph = STROKE_FONT[upperCh]
    if (!glyph) {
      x += LETTER_SPACING * 0.8
      continue
    }
    const isLower = raw >= 'a' && raw <= 'z'
    const letterScale = isLower ? LOWERCASE_GLYPH_SCALE : 1
    const letterLift = isLower ? -LETTER_HEIGHT * 0.5 * (1 - letterScale) : 0
    const letterPitch = 0
    const start = stars.length
    for (const stroke of glyph.strokes) {
      const sampled = sampleStroke(stroke, x, originY, glyph.width)
      stars.push(...sampled.stars)
      for (const [a, b] of sampled.segments) segments.push([a + start, b + start])
    }
    for (let k = start; k < stars.length; k += 1) {
      const p = stars[k]
      const lx = p.x - (x + glyph.width * 0.5)
      const ly = p.y - (originY + LETTER_HEIGHT * 0.5)
      const [rx, ry] = rotate2d(lx, ly, letterPitch)
      p.x = x + glyph.width * 0.5 + rx * letterScale
      p.y = originY + LETTER_HEIGHT * 0.5 + ry * letterScale + letterLift
    }
    x += glyph.width * letterScale + LETTER_SPACING
  }
  return { stars, segments, width: Math.max(0, x - originX - LETTER_SPACING) }
}

function mergeWords(lines, seedOffset = 0) {
  const stars = []
  const segments = []
  let starOffset = 0
  const lineHeight = LETTER_HEIGHT + WORD_SPACING
  const lineWidths = lines.map((line, i) =>
    buildWordData(line, 0, 0, seedOffset + 1301 + i * 211).width,
  )
  const maxWidth = Math.max(...lineWidths, 1)

  for (let i = 0; i < lines.length; i += 1) {
    const xOffset = (maxWidth - lineWidths[i]) / 2
    const { stars: s, segments: seg } = buildWordData(
      lines[i],
      xOffset,
      -i * lineHeight,
      seedOffset + 7001 + i * 983,
    )
    stars.push(...s)
    for (const [a, b] of seg) {
      segments.push([a + starOffset, b + starOffset])
    }
    starOffset += s.length
  }

  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const p of stars) {
    minX = Math.min(minX, p.x)
    maxX = Math.max(maxX, p.x)
    minY = Math.min(minY, p.y)
    maxY = Math.max(maxY, p.y)
  }
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  for (const p of stars) {
    p.x -= cx
    p.y -= cy
  }

  return { stars, segments }
}

function createStarHaloTexture(mode = 'cool') {
  const s = 128
  const canvas = document.createElement('canvas')
  canvas.width = s
  canvas.height = s
  const ctx = canvas.getContext('2d')
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
  if (mode === 'warm') {
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.12, 'rgba(255,230,200,0.9)')
    g.addColorStop(0.38, 'rgba(255,180,120,0.34)')
    g.addColorStop(0.72, 'rgba(200,120,60,0.07)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
  } else if (mode === 'lilac') {
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.11, 'rgba(228,224,255,0.92)')
    g.addColorStop(0.34, 'rgba(168,158,238,0.38)')
    g.addColorStop(0.68, 'rgba(110,105,210,0.12)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
  } else if (mode === 'saas') {
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.12, 'rgba(210,255,220,0.88)')
    g.addColorStop(0.36, 'rgba(120,210,140,0.34)')
    g.addColorStop(0.7, 'rgba(40,120,70,0.09)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
  } else if (mode === 'saasCrimson') {
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.11, 'rgba(255,210,215,0.92)')
    g.addColorStop(0.34, 'rgba(248,113,113,0.4)')
    g.addColorStop(0.68, 'rgba(185,28,28,0.14)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
  } else {
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.12, 'rgba(210,235,255,0.88)')
    g.addColorStop(0.38, 'rgba(130,190,255,0.32)')
    g.addColorStop(0.72, 'rgba(60,120,200,0.06)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
  }
  ctx.fillStyle = g
  ctx.fillRect(0, 0, s, s)
  ctx.globalCompositeOperation = 'lighter'
  const spike =
    mode === 'warm'
      ? 'rgba(255,220,180,0.48)'
      : mode === 'lilac'
        ? 'rgba(195,190,255,0.5)'
        : mode === 'saas'
          ? 'rgba(160,235,180,0.48)'
          : mode === 'saasCrimson'
            ? 'rgba(255,100,110,0.52)'
            : 'rgba(210,235,255,0.45)'
  ctx.strokeStyle = spike
  ctx.lineWidth = 1.1
  for (let i = 0; i < 4; i += 1) {
    const a = (i * Math.PI) / 2
    ctx.beginPath()
    ctx.moveTo(s / 2 + Math.cos(a) * 5, s / 2 + Math.sin(a) * 5)
    ctx.lineTo(s / 2 + Math.cos(a) * (s * 0.44), s / 2 + Math.sin(a) * (s * 0.44))
    ctx.stroke()
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.needsUpdate = true
  return tex
}

function buildLineGeometry(stars, segments) {
  const pos = new Float32Array(segments.length * 6)
  let o = 0
  for (const [a, b] of segments) {
    pos[o++] = stars[a].x
    pos[o++] = stars[a].y
    pos[o++] = stars[a].z
    pos[o++] = stars[b].x
    pos[o++] = stars[b].y
    pos[o++] = stars[b].z
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  return g
}

const PALETTES = {
  cool: {
    bgStarColor: '#d2eaff',
    lineOuter: '#b0dcff',
    lineInner: '#e8f6ff',
    starColor: '#ffffff',
    warmHalo: false,
    haloMode: 'cool',
    bgSeed: 90210,
  },
  warm: {
    bgStarColor: '#ffe8d4',
    lineOuter: '#ffc9a0',
    lineInner: '#fff4e8',
    starColor: '#fffaf2',
    warmHalo: true,
    haloMode: 'warm',
    bgSeed: 44107,
  },
  lunar: {
    bgStarColor: '#dde2ff',
    lineOuter: '#b8aee6',
    lineInner: '#f2efff',
    starColor: '#fffefc',
    warmHalo: false,
    haloMode: 'cool',
    bgSeed: 77331,
  },
  lilac: {
    bgStarColor: '#dce4ff',
    lineOuter: '#7d6ec4',
    lineInner: '#e2dcff',
    starColor: '#f6f4ff',
    warmHalo: false,
    haloMode: 'lilac',
    bgSeed: 88402,
  },
  saas: {
    bgStarColor: '#c8f0d4',
    lineOuter: '#3d8f55',
    lineInner: '#e8ffe8',
    starColor: '#f4fff6',
    warmHalo: false,
    haloMode: 'saas',
    bgSeed: 95117,
  },
  saasCrimson: {
    bgStarColor: '#fecaca',
    lineOuter: '#dc2626',
    lineInner: '#ffe4e6',
    starColor: '#fff1f2',
    warmHalo: true,
    haloMode: 'saasCrimson',
    bgSeed: 95118,
  },
}

export function ConstellationText({
  lines,
  seedOffset = 0,
  position = [0, 1.02, 0],
  palette = 'cool',
  scale = 1,
  /** <1 dims additive label / star decoration (not a real Light — reads as extra glow on distant planets). */
  decorativeDim = 1,
  showBgStars = true,
}) {
  const root = useRef()
  const haloRefs = useRef([])
  const coreRefs = useRef([])
  const starGroupRefs = useRef([])
  const lineMatOuter = useRef()
  const lineMatInner = useRef()

  const colors = PALETTES[palette] ?? PALETTES.cool

  const { stars, segments } = useMemo(() => mergeWords(lines, seedOffset), [lines, seedOffset])
  const haloMode = colors.haloMode ?? (colors.warmHalo ? 'warm' : 'cool')
  const haloTex = useMemo(() => createStarHaloTexture(haloMode), [haloMode])

  const lineGeomOuter = useMemo(() => buildLineGeometry(stars, segments), [stars, segments])
  const lineGeomInner = useMemo(() => lineGeomOuter.clone(), [lineGeomOuter])
  const twinkleData = useMemo(
    () =>
      stars.map((_, i) => ({
        phase: i * 0.47 + (i % 7) * 0.12,
        speed: 1.55 + (i % 9) * 0.12,
        amp: 0.28 + (i % 5) * 0.055,
        scale: 0.9 + (i % 4) * 0.08,
        flarePhase: i * 1.17,
      })),
    [stars],
  )

  const bgStars = useMemo(() => {
    const rng = (s) => {
      let x = s
      return () => {
        x = (x * 16807) % 2147483647
        return (x - 1) / 2147483646
      }
    }
    const rand = rng(colors.bgSeed + seedOffset)
    const n = 72
    const arr = new Float32Array(n * 3)
    for (let i = 0; i < n; i += 1) {
      arr[i * 3] = (rand() - 0.5) * 1.45
      arr[i * 3 + 1] = (rand() - 0.5) * 0.62
      arr[i * 3 + 2] = (rand() - 0.5) * 0.14
    }
    return arr
  }, [colors.bgSeed, seedOffset])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const dim = decorativeDim
    if (root.current) {
      root.current.rotation.z = 0
      root.current.position.set(position[0], position[1], position[2])
    }
    const pulseA = 0.5 + 0.5 * Math.sin(t * 0.95)
    const pulseB = 0.5 + 0.5 * Math.sin(t * 1.72 + 0.8)
    if (lineMatOuter.current) lineMatOuter.current.opacity = (0.28 + pulseA * 0.13 + pulseB * 0.08) * dim
    if (lineMatInner.current) lineMatInner.current.opacity = (0.09 + pulseA * 0.08 + pulseB * 0.06) * dim
    for (let i = 0; i < haloRefs.current.length; i += 1) {
      const haloMat = haloRefs.current[i]
      const coreMat = coreRefs.current[i]
      const starGroup = starGroupRefs.current[i]
      const cfg = twinkleData[i]
      if (!haloMat || !cfg) continue

      const wave1 = 0.5 + 0.5 * Math.sin(t * cfg.speed + cfg.phase)
      const wave2 = 0.5 + 0.5 * Math.sin(t * (cfg.speed * 2.25) + cfg.phase * 1.8)
      const flareCarrier = Math.sin(t * 0.62 + cfg.flarePhase)
      const microFlash = Math.max(0, Math.sin(t * 9.5 + cfg.phase * 3.2)) ** 4
      const flare = Math.max(0, flareCarrier) ** 6

      const glow = 0.18 + wave1 * cfg.amp + wave2 * 0.12 + flare * 0.66 + microFlash * 0.34
      haloMat.opacity = Math.min(1, glow * dim)

      if (coreMat) {
        coreMat.opacity = Math.min(1, (0.56 + wave1 * 0.34 + flare * 0.26 + microFlash * 0.18) * dim)
      }

      if (starGroup) {
        const s = cfg.scale + wave1 * 0.05 + flare * 0.2 + microFlash * 0.08
        starGroup.scale.setScalar(s)
      }
    }
  })

  return (
    <group ref={root} position={position}>
      <group scale={[scale, scale, 1]}>
          {showBgStars && (
            <points frustumCulled={false}>
              <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[bgStars, 3]} />
              </bufferGeometry>
              <pointsMaterial
                color={colors.bgStarColor}
                transparent
                opacity={0.28 * decorativeDim}
                size={0.012}
                sizeAttenuation
                depthWrite={false}
                depthTest
                blending={THREE.AdditiveBlending}
                toneMapped={false}
              />
            </points>
          )}

          <lineSegments geometry={lineGeomOuter}>
            <lineBasicMaterial
              ref={lineMatOuter}
              color={colors.lineOuter}
              transparent
              opacity={0.4 * decorativeDim}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </lineSegments>
          <lineSegments geometry={lineGeomInner} scale={[1.018, 1.018, 1]}>
            <lineBasicMaterial
              ref={lineMatInner}
              color={colors.lineInner}
              transparent
              opacity={0.14 * decorativeDim}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </lineSegments>

          {stars.map((p, i) => (
            <group
              key={`ct-${seedOffset}-${i}`}
              ref={(el) => {
                starGroupRefs.current[i] = el
              }}
              position={[p.x, p.y, p.z]}
            >
              <sprite scale={[0.09 + (i % 4) * 0.006, 0.09 + (i % 4) * 0.006, 1]}>
                <spriteMaterial
                  ref={(el) => {
                    haloRefs.current[i] = el
                  }}
                  map={haloTex}
                  color={colors.starColor}
                  transparent
                  opacity={0.55 * decorativeDim}
                  depthWrite={false}
                  depthTest
                  blending={THREE.AdditiveBlending}
                  toneMapped={false}
                />
              </sprite>
              <mesh>
                <sphereGeometry args={[0.0055 + (i % 3) * 0.001, 10, 10]} />
                <meshBasicMaterial
                  ref={(el) => {
                    coreRefs.current[i] = el
                  }}
                  color={colors.starColor}
                  transparent
                  opacity={0.92 * decorativeDim}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                  toneMapped={false}
                />
              </mesh>
            </group>
          ))}
      </group>
    </group>
  )
}

const LINES_GAMES_PLANET = ['GAMES']
const LINES_FINTECH_PLANET = ['FINTECH']
const LINES_PLAYABLE_ADS_PLANET = ['PLAYABLE ADS']
const LINES_SAAS_PLANET = ['SaaS']
const LINES_3D_DESIGN_PLANET = ['AR / VR']
const PLANET_LABEL_Y = 0.62

export function GamesPlanetConstellation() {
  return (
    <ConstellationText
      lines={LINES_GAMES_PLANET}
      seedOffset={0}
      position={[0, PLANET_LABEL_Y + 0.16, 0]}
      palette="cool"
      scale={0.75}
      decorativeDim={0.38}
      showBgStars={false}
    />
  )
}

export function FinTechPlanetConstellation() {
  return (
    <ConstellationText
      lines={LINES_FINTECH_PLANET}
      seedOffset={50_000}
      position={[0, PLANET_LABEL_Y, 0]}
      palette="saas"
      scale={0.6}
      showBgStars={false}
    />
  )
}

export function PlayableAdsPlanetConstellation() {
  return (
    <ConstellationText
      lines={LINES_PLAYABLE_ADS_PLANET}
      seedOffset={90_000}
      position={[0, PLANET_LABEL_Y, 0]}
      palette="lilac"
      scale={0.6}
      decorativeDim={0.38}
      showBgStars={false}
    />
  )
}

export function SaasPlanetConstellation() {
  return (
    <ConstellationText
      lines={LINES_SAAS_PLANET}
      seedOffset={130_000}
      position={[0, PLANET_LABEL_Y, 0]}
      palette="saasCrimson"
      scale={0.75}
      showBgStars={false}
    />
  )
}

export function Design3DPlanetConstellation() {
  return (
    <ConstellationText
      lines={LINES_3D_DESIGN_PLANET}
      seedOffset={170_000}
      position={[0, PLANET_LABEL_Y - 0.2, 0]}
      palette="warm"
      scale={0.62}
      decorativeDim={0.38}
      showBgStars={false}
    />
  )
}
