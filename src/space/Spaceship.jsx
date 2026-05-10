import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { WELCOME_TOTAL_CHARS } from '../welcomeConstants'
import pilotSticker from '../assets/sticker.webp'
import { easeOutQuint, HERO_POST_CURTAIN_FLIGHT_S, sampleHeroShipFlight } from './heroFlightPath'
import { heroShipCameraBridge, pushHeroTrail } from './heroShipCameraBridge'

function laserHash01(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/** Rim point light: placed past the camera (behind viewer) so no tight specular dot on the hull; still fills glass. */
const GLASS_RIM_PAST_CAMERA = 2.75
const GLASS_RIM_LIGHT_DISTANCE = 20
const GLASS_RIM_LIGHT_INTENSITY = 6.8

/** Smooth 1D value noise for organic power drift. */
function laserNoise1(tt, seed = 0) {
  const i = Math.floor(tt)
  const f = tt - i
  const a = laserHash01(i + seed * 19.19)
  const b = laserHash01(i + 1 + seed * 19.19)
  const u = f * f * (3 - 2 * f)
  return a * (1 - u) + b * u
}

const GIRL_STICKER_CANVAS = 256

function canvasTextureFromDraw(draw) {
  const c = document.createElement('canvas')
  c.width = GIRL_STICKER_CANVAS
  c.height = GIRL_STICKER_CANVAS
  const ctx = c.getContext('2d')
  draw(ctx, GIRL_STICKER_CANVAS, GIRL_STICKER_CANVAS)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.needsUpdate = true
  return tex
}

function drawGirlStickerHeart(ctx, w, h) {
  ctx.clearRect(0, 0, w, h)
  const cx = w * 0.5
  const cy = h * 0.48
  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(1, 0.92)
  ctx.beginPath()
  ctx.moveTo(0, 46)
  ctx.bezierCurveTo(-58, 8, -58, -48, 0, -58)
  ctx.bezierCurveTo(58, -48, 58, 8, 0, 46)
  ctx.closePath()
  const g = ctx.createRadialGradient(-12, -28, 4, 0, 0, 72)
  g.addColorStop(0, '#fff6fb')
  g.addColorStop(0.28, '#ffb7e0')
  g.addColorStop(0.65, '#ff5cb8')
  g.addColorStop(1, '#e91e8c')
  ctx.fillStyle = g
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.82)'
  ctx.lineWidth = 5
  ctx.stroke()
  ctx.restore()
}

function drawGirlStickerStar(ctx, w, h) {
  ctx.clearRect(0, 0, w, h)
  const cx = w * 0.5
  const cy = h * 0.5
  const spikes = 5
  const outerR = w * 0.38
  const innerR = outerR * 0.42
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(-Math.PI / 2)
  ctx.beginPath()
  for (let i = 0; i < spikes * 2; i += 1) {
    const r = i % 2 === 0 ? outerR : innerR
    const a = (Math.PI / spikes) * i - Math.PI / 2
    const x = Math.cos(a) * r
    const y = Math.sin(a) * r
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  const g = ctx.createLinearGradient(-outerR, -outerR, outerR, outerR)
  g.addColorStop(0, '#fff0ff')
  g.addColorStop(0.45, '#f8b4ff')
  g.addColorStop(1, '#c86bff')
  ctx.fillStyle = g
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.9)'
  ctx.lineWidth = 4
  ctx.stroke()
  ctx.restore()
}

function drawGirlStickerSparkle(ctx, w, h) {
  ctx.clearRect(0, 0, w, h)
  const cx = w * 0.5
  const cy = h * 0.5
  const drawRay = (len, wid, rot) => {
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(rot)
    const g = ctx.createLinearGradient(0, -len, 0, len)
    g.addColorStop(0, 'rgba(255,255,255,0)')
    g.addColorStop(0.35, 'rgba(255,220,255,0.95)')
    g.addColorStop(0.5, '#ffffff')
    g.addColorStop(0.65, 'rgba(200,255,255,0.9)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.moveTo(-wid, -len)
    ctx.lineTo(wid, -len)
    ctx.lineTo(wid * 0.35, len)
    ctx.lineTo(-wid * 0.35, len)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }
  drawRay(w * 0.42, w * 0.07, 0)
  drawRay(w * 0.36, w * 0.06, Math.PI / 2)
  drawRay(w * 0.28, w * 0.05, Math.PI / 4)
  drawRay(w * 0.28, w * 0.05, -Math.PI / 4)
  const rg = ctx.createRadialGradient(cx - 6, cy - 6, 0, cx, cy, w * 0.12)
  rg.addColorStop(0, '#ffffff')
  rg.addColorStop(0.5, 'rgba(255,182,255,0.85)')
  rg.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = rg
  ctx.beginPath()
  ctx.arc(cx, cy, w * 0.11, 0, Math.PI * 2)
  ctx.fill()
}

function drawGirlStickerBow(ctx, w, h) {
  ctx.clearRect(0, 0, w, h)
  const cx = w * 0.5
  const cy = h * 0.5
  const g1 = ctx.createRadialGradient(cx - 42, cy - 8, 0, cx - 38, cy, 38)
  g1.addColorStop(0, '#fff5fc')
  g1.addColorStop(0.4, '#ffa8d8')
  g1.addColorStop(1, '#ff4db2')
  ctx.fillStyle = g1
  ctx.beginPath()
  ctx.ellipse(cx - 38, cy, 36, 32, -0.15, 0, Math.PI * 2)
  ctx.fill()
  const g2 = ctx.createRadialGradient(cx + 42, cy - 8, 0, cx + 38, cy, 38)
  g2.addColorStop(0, '#fff5fc')
  g2.addColorStop(0.4, '#ffa8d8')
  g2.addColorStop(1, '#ff4db2')
  ctx.fillStyle = g2
  ctx.beginPath()
  ctx.ellipse(cx + 38, cy, 36, 32, 0.15, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#ff7eb3'
  ctx.fillRect(cx - 10, cy - 8, 20, 40)
  ctx.fillStyle = '#ffb8dc'
  ctx.beginPath()
  ctx.ellipse(cx, cy + 28, 14, 10, 0, 0, Math.PI * 2)
  ctx.fill()
}

function drawGirlStickerPaw(ctx, w, h) {
  ctx.clearRect(0, 0, w, h)
  const pad = (x, y, rx, ry) => {
    ctx.beginPath()
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  const g = ctx.createRadialGradient(w * 0.35, h * 0.35, 0, w * 0.5, h * 0.5, w * 0.45)
  g.addColorStop(0, '#ffe8f8')
  g.addColorStop(0.55, '#ffc2ec')
  g.addColorStop(1, '#e86fd4')
  ctx.fillStyle = g
  pad(w * 0.5, h * 0.58, w * 0.16, h * 0.14)
  ctx.fillStyle = '#ffb8ea'
  pad(w * 0.28, h * 0.38, w * 0.07, h * 0.085)
  pad(w * 0.42, h * 0.3, w * 0.065, h * 0.08)
  pad(w * 0.58, h * 0.3, w * 0.065, h * 0.08)
  pad(w * 0.72, h * 0.38, w * 0.07, h * 0.085)
  ctx.beginPath()
  ctx.ellipse(w * 0.5, h * 0.58, w * 0.16, h * 0.14, 0, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'
  ctx.lineWidth = 3
  ctx.stroke()
}

/** Local pos / rot (rad) on hull — slight Z offset baked in draw order, not pos. */
const HULL_GIRL_STICKER_LAYOUT = [
  { texKey: 'star', position: [0.508, 0.03, -0.078], rotation: [0.2, -Math.PI / 2 + 0.04, 0.1], scale: 0.092 },
  { texKey: 'bow', position: [-0.512, 0.04, -0.062], rotation: [0.16, Math.PI / 2 - 0.04, 0.07], scale: 0.088 },
  { texKey: 'paw', position: [0.398, -0.095, 0.128], rotation: [0.52, -0.42, 0.22], scale: 0.072 },
]

/** Three turquoise “laser” lamps on the upper hull ring — one per panel, front arc. */
const HULL_MAGIC_LAMP_LAYOUT = [
  { position: [-0.388, 0.052, 0.178], seed: 2.1 },
  { position: [0, 0.07, 0.445], seed: 7.7 },
  { position: [0.388, 0.052, 0.178], seed: 12.4 },
]
/** Three additional lamps on the rim near laser emitters (left / center / right). */
const HULL_EDGE_LAMP_LAYOUT = [
  { position: [-0.47, 0.024, 0.452], seed: 31.1 },
  { position: [0, 0.024, 0.52], seed: 36.4 },
  { position: [0.47, 0.024, 0.452], seed: 41.7 },
  { position: [0, -0.09, 0.34], seed: 10 },
]
const CAT_EAR_LAYOUT = [
  { side: -1, seed: 51.2 },
  { side: 1, seed: 59.6 },
]

/** Vertical carbon seams between the three hull panels (bisectors in XZ, deg from +Z). */
const HULL_PANEL_SEAM_DEG = [-31, 31]

/** Philips-style ambient: slow hue sweep + spread left↔center↔right. */
const HULL_LAMP_RAINBOW_SPEED = 0.048
const HULL_LAMP_HUE_SPAN = 0.28

/** Animated film on cockpit glass: flowing noise + fresnel + chroma (thin outer shell). */
const GLASS_LIQUID_VERTEX_SHADER = `
varying vec2 vUv;
varying vec3 vViewNormal;
void main() {
  vUv = uv;
  vViewNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`
const GLASS_LIQUID_FRAGMENT_SHADER = `
uniform float uTime;
uniform float uIntensity;
varying vec2 vUv;
varying vec3 vViewNormal;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.52;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = m * p;
    a *= 0.52;
  }
  return v;
}
void main() {
  vec3 vn = normalize(vViewNormal);
  float fresnel = pow(clamp(1.0 - abs(vn.z), 0.0, 1.0), 2.65);
  vec2 drift = vec2(uTime * 0.055, uTime * 0.038) + 0.07 * vec2(sin(uTime * 0.29), cos(uTime * 0.26));
  vec2 p = vUv * 7.2 + drift;
  float flow = fbm(p + fbm(p * 1.28 + uTime * 0.035));
  float streaks = smoothstep(0.22, 0.8, flow);
  float thin = smoothstep(0.35, 0.96,
    abs(sin(vUv.x * 46.0 + flow * 8.4 + uTime * 1.18)) * flow);
  float w = (streaks * 0.72 + fresnel * 1.08 + thin * 0.52) * uIntensity;
  float hue = flow * 4.1 + fresnel * 2.0 + uTime * 0.2;
  vec3 colA = vec3(0.22, 0.96, 0.92);
  vec3 colB = vec3(1.0, 0.38, 0.88);
  vec3 colC = vec3(0.52, 0.42, 1.0);
  vec3 rgb = mix(colA, colB, 0.5 + 0.5 * sin(hue));
  rgb = mix(rgb, colC, 0.32 + 0.34 * sin(hue * 1.65 + 0.75));
  float alpha = clamp(w * 0.7, 0.0, 0.96);
  gl_FragColor = vec4(rgb * (0.42 + w * 1.25), alpha);
}
`

const STICKER_Z = 0.35
const STICKER_BASE_SCALE = 0.6
const STICKER_BASE_Y = 0.18
const LASER_SIDES = ['right', 'left']
/** Crossed planes through the beam axis — volumetric streak instead of one sharp cone silhouette. */
const LASER_PLANE_TURNS = [0, Math.PI / 3, (2 * Math.PI) / 3]
/** Draw beams before cockpit/hull transparent pass; depthTest occludes behind ship. */
const LASER_RENDER_ORDER = 1
const createLaserSideRefs = () => ({
  outer: null,
  inner: null,
  core: null,
  pink: null,
  cyan: null,
  planes: [null, null, null],
  emitter: null,
})
const SHIP_LIFT_DESKTOP = 0.34
const SHIP_LIFT_PORTRAIT = 0.34

function LaserEmitter({ side, texture, refs, baseY }) {
  const dir = side === 'right' ? 1 : -1
  const sideRotation = dir === 1 ? Math.PI / 2 : -Math.PI / 2
  const sideX = 0.61 * dir

  return (
    <group position={[sideX, baseY, 0.015]}>
      <mesh position={[0, 0, 0]} renderOrder={LASER_RENDER_ORDER}>
        <sphereGeometry args={[0.018, 18, 18]} />
        <meshBasicMaterial
          ref={(el) => {
            refs.current[side].emitter = el
          }}
          color="#ff72d2"
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthTest
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Wide diffuse halo — alpha in texture hides the cone outline. */}
      <mesh rotation={[0, 0, sideRotation]} position={[0.58 * dir, 0, 0]} renderOrder={LASER_RENDER_ORDER}>
        <coneGeometry args={[0.2, 1.16, 48, 1, true]} />
        <meshBasicMaterial
          ref={(el) => {
            refs.current[side].outer = el
          }}
          map={texture}
          transparent
          opacity={0.22}
          blending={THREE.AdditiveBlending}
          depthTest
          depthWrite={false}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>

      {/* Mid body — softer than the old tight cone. */}
      <mesh rotation={[0, 0, sideRotation]} position={[0.51 * dir, 0, 0]} renderOrder={LASER_RENDER_ORDER}>
        <coneGeometry args={[0.1, 1.02, 40, 1, true]} />
        <meshBasicMaterial
          ref={(el) => {
            refs.current[side].inner = el
          }}
          map={texture}
          transparent
          opacity={0.34}
          blending={THREE.AdditiveBlending}
          depthTest
          depthWrite={false}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>

      <group rotation={[0, 0, sideRotation]} position={[0.56 * dir, 0, 0]}>
        {LASER_PLANE_TURNS.map((ry, i) => (
          <mesh key={i} rotation={[0, ry, 0]} renderOrder={LASER_RENDER_ORDER}>
            <planeGeometry args={[0.36, 1.12]} />
            <meshBasicMaterial
              ref={(el) => {
                refs.current[side].planes[i] = el
              }}
              map={texture}
              transparent
              opacity={i === 0 ? 0.14 : 0.11}
              blending={THREE.AdditiveBlending}
              depthTest
              depthWrite={false}
              side={THREE.DoubleSide}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>

      <mesh rotation={[0, 0, sideRotation]} position={[0.48 * dir, 0, 0]} renderOrder={LASER_RENDER_ORDER}>
        <cylinderGeometry args={[0.014, 0.002, 0.96, 16, 1, false]} />
        <meshBasicMaterial
          ref={(el) => {
            refs.current[side].core = el
          }}
          color="#e8fffc"
          transparent
          opacity={0.05}
          blending={THREE.AdditiveBlending}
          depthTest
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      <pointLight
        ref={(el) => {
          refs.current[side].pink = el
        }}
        color="#ff61c8"
        intensity={0.72}
        distance={1.85}
        decay={2}
        position={[0, 0, 0]}
      />
      <pointLight
        ref={(el) => {
          refs.current[side].cyan = el
        }}
        color="#62f5ea"
        intensity={0.62}
        distance={2.9}
        decay={2}
        position={[0.48 * dir, 0, 0]}
      />
    </group>
  )
}

export function Spaceship({
  focus,
  isFocused = false,
  welcomeVisibleCount = WELCOME_TOTAL_CHARS,
  curtainDismissed = false,
  prefersReducedMotion = false,
}) {
  const { gl, camera, size } = useThree()
  const isPortrait = size.height > size.width
  const shipLift = isPortrait ? SHIP_LIFT_PORTRAIT : SHIP_LIFT_DESKTOP
  const group = useRef()
  const heroFlightClock0 = useRef(null)
  const heroIntroPlayed = useRef(false)
  const heroFlightSample = useRef(new THREE.Vector3())
  const shipTarget = useRef(new THREE.Vector3())
  const shipScaleTarget = useRef(new THREE.Vector3(1, 1, 1))
  const wasFocused = useRef(false)
  const isReturning = useRef(false)
  const idleTime = useRef(0)
  const savedState = useRef({
    position: new THREE.Vector3(),
    rotationY: 0,
    rotationZ: 0,
    scale: new THREE.Vector3(1, 1, 1),
  })

  const shipSpawn = useMemo(() => {
    const v = new THREE.Vector3()
    sampleHeroShipFlight(v, 0, shipLift)
    return [v.x, v.y, v.z]
  }, [shipLift])

  useLayoutEffect(() => {
    sampleHeroShipFlight(shipTarget.current, 0, shipLift)
    sampleHeroShipFlight(savedState.current.position, 0, shipLift)
    if (group.current) group.current.position.set(shipTarget.current.x, shipTarget.current.y, shipTarget.current.z)
  }, [shipLift])
  const laserRefs = useRef({
    right: createLaserSideRefs(),
    left: createLaserSideRefs(),
  })
  const glassRimLight = useRef()
  const hullLampRefs = useRef(
    HULL_MAGIC_LAMP_LAYOUT.map(() => ({
      light: null,
      lens: null,
    })),
  )
  const hullEdgeLampRefs = useRef(
    HULL_EDGE_LAMP_LAYOUT.map(() => ({
      light: null,
      lens: null,
    })),
  )
  const catEarRefs = useRef(
    CAT_EAR_LAYOUT.map(() => ({
      light: null,
    })),
  )
  const glassRimWorldScratch = useMemo(
    () => ({
      shipWorld: new THREE.Vector3(),
      camWorld: new THREE.Vector3(),
      toCam: new THREE.Vector3(),
      worldPos: new THREE.Vector3(),
    }),
    [],
  )
  const stickerWorldScratch = useMemo(
    () => ({
      shipWorld: new THREE.Vector3(),
      camRightWorld: new THREE.Vector3(),
      camUpWorld: new THREE.Vector3(),
      rightPointWorld: new THREE.Vector3(),
      upPointWorld: new THREE.Vector3(),
      rightLocal: new THREE.Vector3(),
      upLocal: new THREE.Vector3(),
      targetPos: new THREE.Vector3(),
      targetScale: new THREE.Vector3(),
    }),
    [],
  )
  const shipPathScratch = useMemo(
    () => ({ final: new THREE.Vector3(), waypoint: new THREE.Vector3() }),
    [],
  )
  const stickerRef = useRef()
  const pilotTexRef = useRef(null)
  const [pilotTexture, setPilotTexture] = useState(null)

  useEffect(() => {
    let cancelled = false
    const loader = new THREE.TextureLoader()
    loader.load(
      pilotSticker,
      (tex) => {
        if (cancelled) {
          tex.dispose()
          return
        }
        tex.colorSpace = THREE.SRGBColorSpace
        tex.wrapS = THREE.ClampToEdgeWrapping
        tex.wrapT = THREE.ClampToEdgeWrapping
        tex.center.set(0.5, 0.5)
        tex.repeat.set(1, 1)
        tex.offset.set(0, 0)
        tex.needsUpdate = true
        pilotTexRef.current = tex
        setPilotTexture(tex)
      },
      undefined,
      () => {
        if (!cancelled) setPilotTexture(null)
      },
    )
    return () => {
      cancelled = true
      pilotTexRef.current?.dispose()
      pilotTexRef.current = null
    }
  }, [])

  const hullProfile = useMemo(() => {
    const control = [
      new THREE.Vector2(0.002, -0.162),
      new THREE.Vector2(0.12, -0.156),
      new THREE.Vector2(0.28, -0.128),
      new THREE.Vector2(0.42, -0.082),
      new THREE.Vector2(0.54, -0.028),
      new THREE.Vector2(0.62, 0.028),
      new THREE.Vector2(0.648, 0.078),
      new THREE.Vector2(0.58, 0.118),
      new THREE.Vector2(0.42, 0.148),
      new THREE.Vector2(0.24, 0.162),
      new THREE.Vector2(0.1, 0.168),
      new THREE.Vector2(0.028, 0.17),
    ]
    return new THREE.SplineCurve(control).getPoints(64)
  }, [])

  const stickerAlphaMask = useMemo(() => {
    const w = 256
    const h = 256
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    const g = ctx.createLinearGradient(0, h, 0, 0)
    g.addColorStop(0, '#000000')
    g.addColorStop(0.12, '#000000')
    g.addColorStop(0.22, '#ffffff')
    g.addColorStop(1, '#ffffff')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.NoColorSpace
    tex.needsUpdate = true
    return tex
  }, [])

  const girlHullStickerTextures = useMemo(
    () => ({
      heart: canvasTextureFromDraw(drawGirlStickerHeart),
      star: canvasTextureFromDraw(drawGirlStickerStar),
      sparkle: canvasTextureFromDraw(drawGirlStickerSparkle),
      bow: canvasTextureFromDraw(drawGirlStickerBow),
      paw: canvasTextureFromDraw(drawGirlStickerPaw),
    }),
    [],
  )

  useEffect(() => {
    return () => {
      Object.values(girlHullStickerTextures).forEach((tex) => tex.dispose())
    }
  }, [girlHullStickerTextures])

  /** Inner neon wash — cyan ↔ lime, reads through transmission like tinted art glass. */
  const cockpitNeonTex = useMemo(() => {
    const w = 512
    const h = 512
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#020810'
    ctx.fillRect(0, 0, w, h)

    const sweep = ctx.createLinearGradient(0, h * 0.92, w * 1.05, h * 0.08)
    sweep.addColorStop(0, '#00d4ff')
    sweep.addColorStop(0.28, '#22e8ff')
    sweep.addColorStop(0.52, '#5dffc8')
    sweep.addColorStop(0.72, '#9fff6a')
    sweep.addColorStop(1, '#c8ff3d')
    ctx.fillStyle = sweep
    ctx.fillRect(0, 0, w, h)

    const hot = ctx.createRadialGradient(w * 0.38, h * 0.32, 0, w * 0.42, h * 0.38, w * 0.55)
    hot.addColorStop(0, 'rgba(180, 255, 255, 0.55)')
    hot.addColorStop(0.45, 'rgba(120, 255, 200, 0.22)')
    hot.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.globalCompositeOperation = 'screen'
    ctx.fillStyle = hot
    ctx.fillRect(0, 0, w, h)

    const cool = ctx.createRadialGradient(w * 0.72, h * 0.58, 0, w * 0.65, h * 0.52, w * 0.48)
    cool.addColorStop(0, 'rgba(0, 240, 255, 0.45)')
    cool.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = cool
    ctx.fillRect(0, 0, w, h)
    ctx.globalCompositeOperation = 'source-over'

    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.wrapS = THREE.ClampToEdgeWrapping
    tex.wrapT = THREE.ClampToEdgeWrapping
    tex.needsUpdate = true
    return tex
  }, [])

  useEffect(() => {
    return () => cockpitNeonTex.dispose()
  }, [cockpitNeonTex])

  const glassLiquidUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntensity: { value: 1 },
    }),
    [],
  )

  const laserBeamTex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 256
    c.height = 512
    const ctx = c.getContext('2d')
    const w = c.width
    const h = c.height

    const colorGrad = ctx.createLinearGradient(0, h, 0, 0)
    colorGrad.addColorStop(0, 'rgba(255, 47, 163, 0.92)')
    colorGrad.addColorStop(0.22, 'rgba(224, 96, 213, 0.85)')
    colorGrad.addColorStop(0.48, 'rgba(154, 156, 255, 0.78)')
    colorGrad.addColorStop(0.72, 'rgba(74, 240, 220, 0.72)')
    colorGrad.addColorStop(1, 'rgba(184, 255, 251, 0.65)')
    ctx.fillStyle = colorGrad
    ctx.fillRect(0, 0, w, h)

    // Wide horizontal feather — cone UV wraps in U; soft cross-section, no hard edge.
    ctx.globalCompositeOperation = 'destination-in'
    const sideSoft = ctx.createLinearGradient(0, 0, w, 0)
    sideSoft.addColorStop(0, 'rgba(255,255,255,0)')
    sideSoft.addColorStop(0.1, 'rgba(255,255,255,0.12)')
    sideSoft.addColorStop(0.28, 'rgba(255,255,255,0.5)')
    sideSoft.addColorStop(0.5, 'rgba(255,255,255,1)')
    sideSoft.addColorStop(0.72, 'rgba(255,255,255,0.5)')
    sideSoft.addColorStop(0.9, 'rgba(255,255,255,0.12)')
    sideSoft.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = sideSoft
    ctx.fillRect(0, 0, w, h)

    const lengthSoft = ctx.createLinearGradient(0, h, 0, 0)
    lengthSoft.addColorStop(0, 'rgba(255,255,255,0.04)')
    lengthSoft.addColorStop(0.12, 'rgba(255,255,255,0.45)')
    lengthSoft.addColorStop(0.45, 'rgba(255,255,255,0.92)')
    lengthSoft.addColorStop(0.7, 'rgba(255,255,255,0.75)')
    lengthSoft.addColorStop(1, 'rgba(255,255,255,0.02)')
    ctx.fillStyle = lengthSoft
    ctx.fillRect(0, 0, w, h)
    ctx.globalCompositeOperation = 'source-over'

    // Wispy streaks along the beam (light scatter).
    ctx.globalCompositeOperation = 'lighter'
    const hash = (n) => {
      let x = Math.sin(n * 127.1 + 311.7) * 43758.5453
      return x - Math.floor(x)
    }
    for (let i = 0; i < 55; i += 1) {
      const t = i / 55
      const px = w * (0.35 + hash(i * 3.1) * 0.3)
      const py = h * (0.04 + t * 0.92)
      const rx = w * (0.04 + hash(i * 7.2) * 0.11)
      const ry = h * (0.03 + hash(i * 5.9) * 0.07)
      const g = ctx.createRadialGradient(px, py, 0, px, py, Math.max(rx, ry) * 1.4)
      const a = 0.04 + hash(i * 2.7) * 0.07
      g.addColorStop(0, `rgba(255, 230, 255, ${a})`)
      g.addColorStop(0.5, `rgba(120, 255, 240, ${a * 0.45})`)
      g.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.ellipse(px, py, rx, ry, hash(i) * Math.PI, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalCompositeOperation = 'source-over'

    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    t.wrapS = THREE.ClampToEdgeWrapping
    t.wrapT = THREE.ClampToEdgeWrapping
    t.needsUpdate = true
    return t
  }, [])

  /** Procedural 2×2 twill-style carbon: contrasty tows + epoxy gloss variation + normal map. */
  const hullCarbonMaps = useMemo(() => {
    const size = 512
    const height = new Float32Array(size * size)

    const hash01 = (ix, iy) => {
      let n = ix * 374761393 + iy * 668265263
      n = (n ^ (n >>> 13)) * 1274126177
      return ((n ^ (n >>> 16)) >>> 0) / 4294967296
    }

    const scale = 0.42
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const ux = x * scale
        const uy = y * scale
        /* Continuous phase only — discrete row shifts caused visible horizontal stripes on the hull. */
        const phase =
          0.26 * Math.sin(ux * 0.17 + uy * 0.13) + 0.18 * Math.cos(ux * 0.09 - uy * 0.21)
        const s1 = Math.sin((ux + uy + phase) * 1.08)
        const s2 = Math.sin((ux - uy - phase * 0.72) * 1.08)
        const cross = Math.abs(s1 * s2)
        const rib = Math.pow(Math.max(Math.abs(s1), Math.abs(s2)), 2.2)
        let h = rib * 0.36 + Math.pow(cross, 0.5) * 0.7
        h = Math.pow(Math.min(1, Math.max(0, h)), 0.62)
        /* Small grain only — large amplitude becomes sparkly white micro-spec in normals + bloom. */
        h += (hash01(x, y) - 0.5) * 0.032
        height[y * size + x] = h
      }
    }

    let hMin = 1
    let hMax = 0
    for (let i = 0; i < height.length; i += 1) {
      hMin = Math.min(hMin, height[i])
      hMax = Math.max(hMax, height[i])
    }
    const hSpan = hMax - hMin || 1
    for (let i = 0; i < height.length; i += 1) {
      height[i] = (height[i] - hMin) / hSpan
    }

    const contrast = (t) => {
      const x = Math.min(1, Math.max(0, t))
      return x < 0.5 ? 2 * x * x : 1 - 2 * (1 - x) * (1 - x)
    }

    const colorCanvas = document.createElement('canvas')
    colorCanvas.width = size
    colorCanvas.height = size
    const roughCanvas = document.createElement('canvas')
    roughCanvas.width = size
    roughCanvas.height = size
    const normCanvas = document.createElement('canvas')
    normCanvas.width = size
    normCanvas.height = size

    const cctx = colorCanvas.getContext('2d')
    const rctx = roughCanvas.getContext('2d')
    const nctx = normCanvas.getContext('2d')
    const colorImg = cctx.createImageData(size, size)
    const roughImg = rctx.createImageData(size, size)
    const normImg = nctx.createImageData(size, size)

    const dark = { r: 42, g: 34, b: 58 }
    const mid = { r: 118, g: 96, b: 148 }
    /* Cap albedo well below white — prevents blown-out rim highlights on the hull. */
    const hi = { r: 162, g: 132, b: 198 }

    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const raw = height[y * size + x]
        const hc = contrast(raw)
        const i = (y * size + x) * 4

        let r
        let g
        let b
        if (hc < 0.5) {
          const t = hc * 2
          r = Math.round(dark.r + (mid.r - dark.r) * t)
          g = Math.round(dark.g + (mid.g - dark.g) * t)
          b = Math.round(dark.b + (mid.b - dark.b) * t)
        } else {
          const t = (hc - 0.5) * 2
          r = Math.round(mid.r + (hi.r - mid.r) * t)
          g = Math.round(mid.g + (hi.g - mid.g) * t)
          b = Math.round(mid.b + (hi.b - mid.b) * t)
        }

        colorImg.data[i] = r
        colorImg.data[i + 1] = g
        colorImg.data[i + 2] = b
        colorImg.data[i + 3] = 255

        const gloss = Math.pow(hc, 1.45)
        /* Higher floor roughness = softer specular, no mirror-like white spots. */
        const roughLin = 0.52 + (1 - gloss) * 0.34
        const rv = Math.round(roughLin * 255)
        roughImg.data[i] = rv
        roughImg.data[i + 1] = rv
        roughImg.data[i + 2] = rv
        roughImg.data[i + 3] = 255
      }
    }

    const nStrength = 3.05
    const at = (ix, iy) => {
      const cx = (ix + size) % size
      const cy = (iy + size) % size
      return height[cy * size + cx]
    }

    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const i = (y * size + x) * 4
        const hL = at(x - 1, y)
        const hR = at(x + 1, y)
        const hD = at(x, y - 1)
        const hU = at(x, y + 1)
        let nx = (hL - hR) * nStrength
        let ny = (hD - hU) * nStrength
        let nz = 1
        const len = Math.hypot(nx, ny, nz) || 1
        nx /= len
        ny /= len
        nz /= len
        normImg.data[i] = Math.round(nx * 0.5 * 255 + 127.5)
        normImg.data[i + 1] = Math.round(ny * 0.5 * 255 + 127.5)
        normImg.data[i + 2] = Math.round(nz * 0.5 * 255 + 127.5)
        normImg.data[i + 3] = 255
      }
    }

    cctx.putImageData(colorImg, 0, 0)
    rctx.putImageData(roughImg, 0, 0)
    nctx.putImageData(normImg, 0, 0)

    const repeatU = 3.35
    const repeatV = 3.85
    const rot = THREE.MathUtils.degToRad(38)

    const map = new THREE.CanvasTexture(colorCanvas)
    map.colorSpace = THREE.SRGBColorSpace
    map.wrapS = THREE.RepeatWrapping
    map.wrapT = THREE.RepeatWrapping
    map.repeat.set(repeatU, repeatV)
    map.center.set(0.5, 0.5)
    map.rotation = rot
    map.anisotropy = 8
    map.needsUpdate = true

    const roughnessMap = new THREE.CanvasTexture(roughCanvas)
    roughnessMap.colorSpace = THREE.NoColorSpace
    roughnessMap.wrapS = THREE.RepeatWrapping
    roughnessMap.wrapT = THREE.RepeatWrapping
    roughnessMap.repeat.set(repeatU, repeatV)
    roughnessMap.center.set(0.5, 0.5)
    roughnessMap.rotation = rot
    roughnessMap.anisotropy = 8
    roughnessMap.needsUpdate = true

    const normalMap = new THREE.CanvasTexture(normCanvas)
    normalMap.colorSpace = THREE.NoColorSpace
    normalMap.wrapS = THREE.RepeatWrapping
    normalMap.wrapT = THREE.RepeatWrapping
    normalMap.repeat.set(repeatU, repeatV)
    normalMap.center.set(0.5, 0.5)
    normalMap.rotation = rot
    normalMap.anisotropy = 8
    normalMap.needsUpdate = true

    return { map, roughnessMap, normalMap }
  }, [])

  const shipLdrEnvMap = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 256
    const ctx = canvas.getContext('2d')

    const sky = ctx.createLinearGradient(0, 0, 0, canvas.height)
    sky.addColorStop(0, '#bfd6ff')
    sky.addColorStop(0.42, '#7d95bf')
    sky.addColorStop(0.72, '#374563')
    sky.addColorStop(1, '#11131d')
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const horizon = ctx.createLinearGradient(0, canvas.height * 0.42, 0, canvas.height)
    horizon.addColorStop(0, 'rgba(255,255,255,0.26)')
    horizon.addColorStop(0.5, 'rgba(176,202,255,0.16)')
    horizon.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = horizon
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const ldrEquirect = new THREE.CanvasTexture(canvas)
    ldrEquirect.colorSpace = THREE.SRGBColorSpace
    ldrEquirect.mapping = THREE.EquirectangularReflectionMapping
    ldrEquirect.needsUpdate = true

    const pmrem = new THREE.PMREMGenerator(gl)
    const rt = pmrem.fromEquirectangular(ldrEquirect)
    ldrEquirect.dispose()
    pmrem.dispose()
    return rt
  }, [gl])

  useEffect(() => {
    return () => {
      hullCarbonMaps.map.dispose()
      hullCarbonMaps.roughnessMap.dispose()
      hullCarbonMaps.normalMap.dispose()
    }
  }, [hullCarbonMaps])

  useEffect(() => {
    return () => {
      shipLdrEnvMap.dispose()
    }
  }, [shipLdrEnvMap])

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime
    if (!group.current) return

    if (isFocused) {
      heroFlightClock0.current = null
      heroShipCameraBridge.heroFlightLinear01 = 1
      heroShipCameraBridge.heroFlightEase01 = 1
    }

    if (!wasFocused.current && isFocused) {
      savedState.current.position.copy(group.current.position)
      savedState.current.rotationY = group.current.rotation.y
      savedState.current.rotationZ = group.current.rotation.z
      savedState.current.scale.copy(group.current.scale)
      isReturning.current = false
    } else if (wasFocused.current && !isFocused) {
      isReturning.current = true
      /* Avoid replaying post-curtain Bézier from off-screen if the planet was opened mid-intro. */
      heroIntroPlayed.current = true
      heroFlightClock0.current = null
    }

    if (isFocused && focus?.shipPos) {
      const liftY = 0.24 + shipLift
      const { final, waypoint } = shipPathScratch
      final.set(focus.shipPos.x, focus.shipPos.y + liftY, focus.shipPos.z)
      let aim = final
      if (focus.shipWaypoint) {
        waypoint.copy(focus.shipWaypoint)
        waypoint.y += liftY
        if (shipTarget.current.distanceTo(waypoint) > 0.28) aim = waypoint
      }
      shipTarget.current.lerp(aim, 0.052)
      group.current.position.copy(shipTarget.current)
      const rollWiggle = focus?.shipRollWiggleScale ?? 1
      const rollBias = focus?.shipRollBias ?? 0
      group.current.rotation.z = rollBias + Math.sin(t * 1.6) * 0.025 * rollWiggle
      const focusedYaw =
        focus.shipYaw !== undefined && focus.shipYaw !== null
          ? focus.shipYaw
          : focus.shipPos.x < 0
            ? 0.17
            : 0
      group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, focusedYaw, 0.08)
      shipScaleTarget.current.setScalar(0.67)
    } else if (isReturning.current) {
      heroShipCameraBridge.heroFlightLinear01 = 1
      heroShipCameraBridge.heroFlightEase01 = 1
      shipTarget.current.lerp(savedState.current.position, 0.08)
      group.current.position.copy(shipTarget.current)
      group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, savedState.current.rotationZ, 0.08)
      group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, savedState.current.rotationY, 0.08)
      shipScaleTarget.current.lerp(savedState.current.scale, 0.08)

      const posDone = group.current.position.distanceToSquared(savedState.current.position) < 0.00008
      const rotDone =
        Math.abs(group.current.rotation.z - savedState.current.rotationZ) < 0.003 &&
        Math.abs(group.current.rotation.y - savedState.current.rotationY) < 0.003
      const scaleDone = group.current.scale.distanceToSquared(savedState.current.scale) < 0.00008
      if (posDone && rotDone && scaleDone) {
        group.current.position.copy(savedState.current.position)
        group.current.rotation.z = savedState.current.rotationZ
        group.current.rotation.y = savedState.current.rotationY
        group.current.scale.copy(savedState.current.scale)
        shipTarget.current.copy(savedState.current.position)
        shipScaleTarget.current.copy(savedState.current.scale)
        isReturning.current = false
      }
    } else {
      const snapHero = heroShipCameraBridge.skipHeroCinematicOnce
      if (snapHero) heroShipCameraBridge.skipHeroCinematicOnce = false

      if (!curtainDismissed) {
        heroFlightClock0.current = null
        heroShipCameraBridge.heroFlightLinear01 = 0
        heroShipCameraBridge.heroFlightEase01 = 0
        sampleHeroShipFlight(heroFlightSample.current, 0, shipLift)
        group.current.position.copy(heroFlightSample.current)
        shipTarget.current.copy(heroFlightSample.current)
        group.current.rotation.y = -0.44
        group.current.rotation.z = 0
        idleTime.current = 0
      } else if (prefersReducedMotion || snapHero || heroIntroPlayed.current) {
        heroFlightClock0.current = null
        idleTime.current += delta
        const idleT = idleTime.current
        const idleRest = new THREE.Vector3(
          0.7 + Math.sin(idleT * 0.35) * 0.22,
          -0.25 + shipLift + Math.sin(idleT * 1.5) * 0.08,
          -2,
        )
        shipTarget.current.lerp(idleRest, 0.08)
        group.current.position.copy(shipTarget.current)
        group.current.rotation.z = Math.sin(idleT * 0.9) * 0.05
        group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, 0, 0.08)
        heroShipCameraBridge.heroFlightLinear01 = 1
        heroShipCameraBridge.heroFlightEase01 = 1
      } else {
        if (heroFlightClock0.current == null) heroFlightClock0.current = clock.elapsedTime
        const raw = Math.min(1, (clock.elapsedTime - heroFlightClock0.current) / HERO_POST_CURTAIN_FLIGHT_S)
        const ease = easeOutQuint(raw)
        heroShipCameraBridge.heroFlightLinear01 = raw
        heroShipCameraBridge.heroFlightEase01 = ease

        if (ease < 0.999) {
          sampleHeroShipFlight(heroFlightSample.current, ease, shipLift)
          group.current.position.copy(heroFlightSample.current)
          shipTarget.current.copy(heroFlightSample.current)
          const turn = easeOutQuint(ease)
          group.current.rotation.y = THREE.MathUtils.lerp(-0.44, 0, turn)
          group.current.rotation.z = Math.sin(Math.PI * ease) * 0.11
        } else {
          heroIntroPlayed.current = true
          idleTime.current += delta
          const idleT = idleTime.current
          const idleRest = new THREE.Vector3(
            0.7 + Math.sin(idleT * 0.35) * 0.22,
            -0.25 + shipLift + Math.sin(idleT * 1.5) * 0.08,
            -2,
          )
          shipTarget.current.lerp(idleRest, 0.08)
          group.current.position.copy(shipTarget.current)
          group.current.rotation.z = Math.sin(idleT * 0.9) * 0.05
          group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, 0, 0.08)
          heroShipCameraBridge.heroFlightLinear01 = 1
          heroShipCameraBridge.heroFlightEase01 = 1
        }
      }
      shipScaleTarget.current.setScalar(1)
    }
    group.current.scale.lerp(shipScaleTarget.current, 0.08)
    wasFocused.current = isFocused

    if (!isFocused && group.current) {
      group.current.getWorldPosition(heroShipCameraBridge.shipWorld)
      heroShipCameraBridge.emerge01 = Math.min(1, welcomeVisibleCount / WELCOME_TOTAL_CHARS)

      let wake = 0
      if (curtainDismissed && !prefersReducedMotion && heroShipCameraBridge.heroFlightEase01 < 0.992) {
        wake = (1 - heroShipCameraBridge.heroFlightEase01) * 0.95
      } else if (isReturning.current) {
        const d = group.current.position.distanceTo(savedState.current.position)
        wake = Math.min(0.84, d * 3.5)
      }
      heroShipCameraBridge.wakeStrength = wake
      if (wake > 0.035) pushHeroTrail(heroShipCameraBridge.shipWorld)

      heroShipCameraBridge.valid = true
    } else {
      heroShipCameraBridge.valid = false
      heroShipCameraBridge.wakeStrength = 0
    }

    if (stickerRef.current) {
      const mul = isFocused && focus?.pilotStickerScaleMul !== undefined ? focus.pilotStickerScaleMul : 1
      const ox = isFocused && focus?.pilotStickerOffsetX !== undefined ? focus.pilotStickerOffsetX : 0
      const oy = isFocused && focus?.pilotStickerOffsetY !== undefined ? focus.pilotStickerOffsetY : 0
      const oz = isFocused && focus?.pilotStickerOffsetZ !== undefined ? focus.pilotStickerOffsetZ : 0
      const s = STICKER_BASE_SCALE * mul
      stickerRef.current.scale.lerp(stickerWorldScratch.targetScale.set(s, s, 1), 0.1)

      stickerWorldScratch.targetPos.set(0, STICKER_BASE_Y, STICKER_Z + oz)
      if (isFocused && group.current && (ox !== 0 || oy !== 0)) {
        group.current.getWorldPosition(stickerWorldScratch.shipWorld)

        stickerWorldScratch.camRightWorld.set(1, 0, 0).applyQuaternion(camera.quaternion)
        stickerWorldScratch.camUpWorld.set(0, 1, 0).applyQuaternion(camera.quaternion)

        stickerWorldScratch.rightPointWorld
          .copy(stickerWorldScratch.shipWorld)
          .add(stickerWorldScratch.camRightWorld)
        stickerWorldScratch.upPointWorld.copy(stickerWorldScratch.shipWorld).add(stickerWorldScratch.camUpWorld)

        stickerWorldScratch.rightLocal.copy(stickerWorldScratch.rightPointWorld)
        group.current.worldToLocal(stickerWorldScratch.rightLocal).normalize()
        stickerWorldScratch.upLocal.copy(stickerWorldScratch.upPointWorld)
        group.current.worldToLocal(stickerWorldScratch.upLocal).normalize()

        stickerWorldScratch.targetPos
          .addScaledVector(stickerWorldScratch.rightLocal, ox)
          .addScaledVector(stickerWorldScratch.upLocal, oy)
      } else {
        stickerWorldScratch.targetPos.x += ox
        stickerWorldScratch.targetPos.y += oy
      }

      stickerRef.current.position.lerp(stickerWorldScratch.targetPos, 0.1)
    }

    const phases = { right: 0, left: Math.PI * 0.62 }
    const slowPhaseShift = Math.PI * 0.58

    const glowAtten = focus?.shipGlowAttenuation ?? 1
    const neonLightMul = focus?.shipNeonLightMul ?? 1
    const glassLightMul = focus?.shipGlassLightMul ?? 1
    glassLiquidUniforms.uTime.value = t
    glassLiquidUniforms.uIntensity.value = THREE.MathUtils.clamp(
      0.8 * glassLightMul * (0.9 + 0.22 * neonLightMul),
      0.04,
      1.45,
    )
    /*
      Keep hull/laser glow reactive, but decouple dome lights from rapid modulation:
      - tiny attenuation range
      - temporal smoothing to avoid visible shimmer on glass
    */
    const glassGlowAttenTarget = THREE.MathUtils.lerp(0.9, 1.03, THREE.MathUtils.clamp(glowAtten, 0, 0.4) / 0.4)

    /*
      Laser flicker: left = dense unstable beam; right = calmer, and strong flicker on the two sides
      never peaks in the same time slice (alternating windows).
    */
    const flickerCycle = (t * 0.58) % 1
    const leftOwnsDrama = flickerCycle < 0.62

    let leftMul = 1
    leftMul *= 0.9 + 0.2 * Math.sin(t * 41.3 + Math.sin(t * 3.15) * 3.2)
    leftMul *= 0.93 + 0.15 * Math.sin(t * 18.9) * Math.sin(t * 6.95)
    leftMul *= 0.86 + 0.32 * laserNoise1(t * 5.6, 11)
    leftMul *= 0.92 + 0.14 * Math.sin(t * 63.2) * Math.sin(t * 29.1)
    if (leftOwnsDrama) {
      leftMul *= 0.74 + 0.32 * laserNoise1(t * 11.4, 7)
      if (laserHash01(Math.floor(t * 3.45) + 2) > 0.86) {
        const w = (t * 3.45) % 1
        const dip = Math.max(0, Math.sin(w * Math.PI))
        leftMul *= 0.06 + 0.94 * dip
      }
      if (laserHash01(Math.floor(t * 2.8) + 5) > 0.93) {
        const w = (t * 2.8) % 1
        if (w < 0.11) leftMul *= 1.05 + 0.22 * Math.sin((w / 0.11) * Math.PI)
      }
    } else {
      leftMul *= 0.96 + 0.08 * laserNoise1(t * 3.2, 21)
    }

    let rightMul = 1
    if (leftOwnsDrama) {
      const sp = 0.5 + 0.5 * Math.sin(t * 1.25 + 0.75 + slowPhaseShift)
      rightMul *= 0.97 + 0.05 * sp
      rightMul *= 0.985 + 0.015 * Math.sin(t * 8.2)
    } else {
      rightMul *= 0.92 + 0.16 * Math.sin(t * 36.8 + 1.1)
      rightMul *= 0.88 + 0.28 * laserNoise1(t * 4.35, 13)
      rightMul *= 0.94 + 0.12 * Math.sin(t * 22.4) * Math.sin(t * 9.1)
      if (laserHash01(Math.floor(t * 2.05) + 99) > 0.9) {
        const w = (t * 2.05) % 1
        const dip = Math.max(0, Math.sin(w * Math.PI))
        rightMul *= 0.12 + 0.88 * dip
      }
      if (laserHash01(Math.floor(t * 1.55) + 40) > 0.94) {
        const w = (t * 1.55) % 1
        if (w < 0.09) rightMul *= 1.04 + 0.14 * Math.sin((w / 0.09) * Math.PI)
      }
    }

    leftMul = THREE.MathUtils.clamp(leftMul, 0.05, 1.34)
    rightMul = THREE.MathUtils.clamp(rightMul, 0.1, 1.26)

    const planeBase = [0.14, 0.11, 0.11]

    for (const side of LASER_SIDES) {
      const pulse = 0.5 + 0.5 * Math.sin(t * 2.2 + phases[side])
      const slowPulse = 0.5 + 0.5 * Math.sin(t * 1.25 + 0.75 + (side === 'left' ? slowPhaseShift : 0))
      const sideScale = side === 'right' ? 1 : 0.94
      const sideRefs = laserRefs.current[side]
      if (!sideRefs) continue

      const mul = side === 'left' ? leftMul : rightMul
      const beam = mul * (0.92 + 0.08 * pulse) * neonLightMul

      if (sideRefs.outer) sideRefs.outer.opacity = (0.2 + pulse * (0.24 * sideScale)) * beam
      if (sideRefs.inner) sideRefs.inner.opacity = (0.28 + pulse * (0.26 * sideScale)) * beam
      if (sideRefs.core) sideRefs.core.opacity = (0.03 + slowPulse * (0.05 * sideScale)) * mul * neonLightMul
      if (sideRefs.pink)
        sideRefs.pink.intensity =
          (0.55 + pulse * (0.45 * sideScale)) * glowAtten * neonLightMul * Math.pow(mul, 0.92)
      if (sideRefs.cyan)
        sideRefs.cyan.intensity =
          (0.45 + slowPulse * (0.4 * sideScale)) * glowAtten * neonLightMul * (0.88 + 0.12 * mul)
      if (sideRefs.emitter)
        sideRefs.emitter.opacity = Math.min(
          1,
          (0.74 + pulse * 0.2) * (0.82 + 0.18 * mul) * neonLightMul,
        )
      if (sideRefs.planes) {
        sideRefs.planes.forEach((mat, i) => {
          if (mat) mat.opacity = planeBase[i] * (0.88 + 0.32 * pulse) * beam
        })
      }
    }

    const rainbowBase = (t * HULL_LAMP_RAINBOW_SPEED) % 1
    HULL_MAGIC_LAMP_LAYOUT.forEach((lamp, i) => {
      const refs = hullLampRefs.current[i]
      const shimmer =
        0.62 +
        0.18 * Math.sin(t * 4.4 + lamp.seed) +
        0.14 * Math.sin(t * 9.7 + lamp.seed * 1.8) +
        0.12 * laserNoise1(t * 3.2, lamp.seed)
      const spark = Math.max(0, Math.sin(t * 17.5 + lamp.seed * 2.4)) ** 6
      const power = THREE.MathUtils.clamp(shimmer + spark * 0.42, 0.35, 1.24) * neonLightMul
      const lane = (i - (HULL_MAGIC_LAMP_LAYOUT.length - 1) / 2) / Math.max(1, (HULL_MAGIC_LAMP_LAYOUT.length - 1) / 2)
      const gradientHue = rainbowBase + lane * (HULL_LAMP_HUE_SPAN * 0.5)
      const hueWobble = 0.018 * Math.sin(t * 2.1 + lamp.seed) + 0.01 * laserNoise1(t * 1.6, lamp.seed + 1)
      const hue = (gradientHue + hueWobble + 1) % 1
      const sat = THREE.MathUtils.clamp(0.82 + 0.12 * Math.sin(t * 0.9 + lamp.seed * 0.7), 0.72, 0.98)
      const lit = THREE.MathUtils.clamp(0.48 + 0.12 * power, 0.42, 0.62)
      if (refs?.light) {
        refs.light.intensity = (0.52 + power * 0.72 + spark * 0.42) * neonLightMul
        refs.light.color.setHSL(hue, sat, lit)
      }
      if (refs?.lens) {
        refs.lens.color.setHSL(hue, Math.min(1, sat + 0.06), Math.min(0.72, lit + 0.1))
        refs.lens.opacity = THREE.MathUtils.clamp(0.55 + power * 0.28 + spark * 0.35, 0.35, 1)
      }
    })
    HULL_EDGE_LAMP_LAYOUT.forEach((lamp, i) => {
      const refs = hullEdgeLampRefs.current[i]
      const shimmer =
        0.58 +
        0.2 * Math.sin(t * 4 + lamp.seed) +
        0.12 * Math.sin(t * 8.2 + lamp.seed * 1.7) +
        0.14 * laserNoise1(t * 2.8, lamp.seed)
      const spark = Math.max(0, Math.sin(t * 16.2 + lamp.seed * 2.2)) ** 6
      const power = THREE.MathUtils.clamp(shimmer + spark * 0.44, 0.32, 1.25) * neonLightMul
      const lane = (i - (HULL_EDGE_LAMP_LAYOUT.length - 1) / 2) / Math.max(1, (HULL_EDGE_LAMP_LAYOUT.length - 1) / 2)
      const gradientHue = rainbowBase + 0.17 + lane * (HULL_LAMP_HUE_SPAN * 0.5)
      const hueWobble = 0.018 * Math.sin(t * 1.9 + lamp.seed) + 0.012 * laserNoise1(t * 1.4, lamp.seed + 2)
      const hue = (gradientHue + hueWobble + 1) % 1
      const sat = THREE.MathUtils.clamp(0.84 + 0.1 * Math.sin(t * 0.82 + lamp.seed * 0.63), 0.74, 0.98)
      const lit = THREE.MathUtils.clamp(0.46 + 0.13 * power, 0.4, 0.64)
      if (refs?.light) {
        refs.light.intensity = (0.48 + power * 0.76 + spark * 0.38) * neonLightMul
        refs.light.color.setHSL(hue, sat, lit)
      }
      if (refs?.lens) {
        refs.lens.color.setHSL(hue, Math.min(1, sat + 0.08), Math.min(0.74, lit + 0.11))
        refs.lens.opacity = THREE.MathUtils.clamp(0.5 + power * 0.3 + spark * 0.32, 0.34, 1)
      }
    })
    CAT_EAR_LAYOUT.forEach((ear, i) => {
      const refs = catEarRefs.current[i]
      const pulse =
        0.58 +
        0.2 * Math.sin(t * 2.35 + ear.seed) +
        0.14 * Math.sin(t * 4.8 + ear.seed * 1.4) +
        0.1 * laserNoise1(t * 1.6, ear.seed)
      const hue = (rainbowBase + 0.08 + ear.side * 0.09 + 0.02 * Math.sin(t * 1.3 + ear.seed) + 1) % 1
      const sat = 0.9
      const lit = THREE.MathUtils.clamp(0.52 + pulse * 0.12, 0.48, 0.67)
      if (refs?.light) {
        refs.light.color.setHSL(hue, sat, Math.min(0.72, lit + 0.08))
        refs.light.intensity = THREE.MathUtils.clamp(0.22 + pulse * 0.34, 0.14, 0.58)
      }
    })

    const rimScratch = glassRimWorldScratch
    if (glassRimLight.current && group.current) {
      group.current.getWorldPosition(rimScratch.shipWorld)
      camera.getWorldPosition(rimScratch.camWorld)
      rimScratch.toCam.subVectors(rimScratch.camWorld, rimScratch.shipWorld)
      const camDist = rimScratch.toCam.length()
      if (camDist > 1e-5) {
        rimScratch.toCam.multiplyScalar(1 / camDist)
        rimScratch.worldPos.copy(rimScratch.camWorld).addScaledVector(rimScratch.toCam, GLASS_RIM_PAST_CAMERA)
      } else {
        rimScratch.worldPos.copy(rimScratch.camWorld).addScaledVector(rimScratch.toCam.set(0, 0, 1), GLASS_RIM_PAST_CAMERA)
      }
      group.current.worldToLocal(rimScratch.worldPos)
      glassRimLight.current.position.copy(rimScratch.worldPos)
    }

    if (glassRimLight.current) {
      const base = glassRimLight.current.userData.baseIntensity ?? glassRimLight.current.intensity
      glassRimLight.current.userData.baseIntensity = base
      const target = base * glassGlowAttenTarget * neonLightMul * glassLightMul
      glassRimLight.current.intensity = THREE.MathUtils.lerp(glassRimLight.current.intensity, target, 0.075)
    }
  })

  return (
    <group ref={group} position={shipSpawn}>
      <LaserEmitter side="right" texture={laserBeamTex} refs={laserRefs} baseY={0.035} />
      <LaserEmitter side="left" texture={laserBeamTex} refs={laserRefs} baseY={0.035} />
      {/*
        Single-shell glass only. A second inner sphere + extreme transmission caused moiré/concentric banding.
        Specular highlights: neutral key + rim point lights (see below). Subtle emissiveMap = inner tint only.
      */}
      <mesh castShadow={false} receiveShadow renderOrder={4}>
        <sphereGeometry args={[0.34, 96, 96, 0, Math.PI * 2, 0, Math.PI * 0.4]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={1}
          transmission={0.82}
          thickness={0.62}
          ior={1.6}
          roughness={20.007}
          metalness={0}
          clearcoat={1}
          clearcoatRoughness={0.006}
          envMap={shipLdrEnvMap.texture}
          envMapIntensity={0.42}
          specularIntensity={1.08}
          specularColor="#ffffff"
          attenuationColor="#f2f0eb"
          attenuationDistance={1.35}
          emissiveMap={cockpitNeonTex}
          emissive="#ffffff"
          emissiveIntensity={0.035}
          iridescence={0}
          side={THREE.FrontSide}
          depthWrite
        />
      </mesh>
      {/* Chromatic flowing film on outer glass — additive “liquid / holo” read without second transmission shell */}
      <mesh castShadow={false} receiveShadow={false} scale={1.0028} renderOrder={5}>
        <sphereGeometry args={[0.34, 96, 96, 0, Math.PI * 2, 0, Math.PI * 0.4]} />
        <shaderMaterial
          uniforms={glassLiquidUniforms}
          vertexShader={GLASS_LIQUID_VERTEX_SHADER}
          fragmentShader={GLASS_LIQUID_FRAGMENT_SHADER}
          transparent
          depthWrite={false}
          depthTest
          toneMapped={false}
          blending={THREE.AdditiveBlending}
          polygonOffset
          polygonOffsetFactor={-0.5}
          polygonOffsetUnits={-0.5}
          side={THREE.FrontSide}
        />
      </mesh>
      {CAT_EAR_LAYOUT.map((ear) => (
        <group
          key={`cat-ear-${ear.side > 0 ? 'right' : 'left'}`}
          position={[0.138 * ear.side, 0.332, -0.03]}
          rotation={[0.22, 0.15 * ear.side, -0.22 * ear.side]}
          scale={[1.2, 1.34, 1.2]}
        >
          <mesh castShadow={false} receiveShadow={false} renderOrder={10}>
            <coneGeometry args={[0.092, 0.19, 24]} />
            <meshPhysicalMaterial
              map={hullCarbonMaps.map}
              roughnessMap={hullCarbonMaps.roughnessMap}
              normalMap={hullCarbonMaps.normalMap}
              normalScale={[0.22, 0.22]}
              color="#8f78ad"
              emissive="#4a3568"
              emissiveIntensity={0.18}
              metalness={0.1}
              roughness={0.52}
              clearcoat={0.12}
              clearcoatRoughness={0.22}
              specularIntensity={0.12}
              specularColor="#9e8ab8"
            />
          </mesh>
          <mesh position={[0, -0.004, 0.038]} rotation={[-0.035, 0, 0]} scale={[0.68, 0.78, 0.4]} renderOrder={12}>
            <cylinderGeometry args={[0.001, 0.09, 0.16, 3, 1, false, Math.PI / 3]} />
            <meshPhysicalMaterial
              color="#f2bce9"
              emissive="#b863ad"
              emissiveIntensity={0.24}
              roughness={0.34}
              metalness={0.05}
              clearcoat={0.22}
              clearcoatRoughness={0.2}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh position={[0, -0.074, 0.002]} scale={[0.9, 1, 0.92]} renderOrder={11}>
            <cylinderGeometry args={[0.084, 0.074, 0.022, 24]} />
            <meshPhysicalMaterial
              map={hullCarbonMaps.map}
              roughnessMap={hullCarbonMaps.roughnessMap}
              normalMap={hullCarbonMaps.normalMap}
              normalScale={[0.2, 0.2]}
              color="#8f78ad"
              emissive="#4a3568"
              emissiveIntensity={0.14}
              metalness={0.1}
              roughness={0.54}
              clearcoat={0.1}
              clearcoatRoughness={0.24}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      ))}
      <mesh
        ref={stickerRef}
        position={[0, STICKER_BASE_Y, STICKER_Z]}
        rotation={[0.08, 0, 0]}
        scale={[STICKER_BASE_SCALE, STICKER_BASE_SCALE, 1]}
        renderOrder={11}
      >
        <planeGeometry args={[0.35, 0.35]} />
        <meshBasicMaterial
          map={pilotTexture ?? undefined}
          alphaMap={stickerAlphaMask}
          transparent
          opacity={1}
          alphaTest={0.02}
          depthTest
          depthWrite={false}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, -0.028, 0]} castShadow={false} receiveShadow renderOrder={4}>
        <latheGeometry args={[hullProfile, 90]} />
        <meshPhysicalMaterial
          map={hullCarbonMaps.map}
          roughnessMap={hullCarbonMaps.roughnessMap}
          normalMap={hullCarbonMaps.normalMap}
          normalScale={[0.2, 0.2]}
          color="#8f78ad"
          emissive="#4a3568"
          emissiveIntensity={0.2}
          metalness={0.08}
          roughness={0.55}
          clearcoat={0}
          specularIntensity={0.12}
          specularColor="#9e8ab8"
        />
      </mesh>
      <group position={[0, 0.018, 0.12]}>
        {HULL_PANEL_SEAM_DEG.map((deg, i) => (
          <mesh
            key={`hull-carbon-seam-${i}`}
            rotation={[0, THREE.MathUtils.degToRad(deg), 0]}
            castShadow={false}
            receiveShadow
            renderOrder={5}
          >
            <boxGeometry args={[0.014, 0.098, 0.62]} />
            <meshPhysicalMaterial
              map={hullCarbonMaps.map}
              roughnessMap={hullCarbonMaps.roughnessMap}
              normalMap={hullCarbonMaps.normalMap}
              normalScale={[0.35, 0.35]}
              color="#151018"
              emissive="#08060c"
              emissiveIntensity={0.04}
              metalness={0.22}
              roughness={0.42}
              clearcoat={0.12}
              clearcoatRoughness={0.35}
            />
          </mesh>
        ))}
      </group>
      {HULL_MAGIC_LAMP_LAYOUT.map((lamp, i) => (
        <group key={`hull-magic-lamp-${i}`} position={lamp.position}>
          <pointLight
            ref={(el) => {
              hullLampRefs.current[i].light = el
            }}
            color="#2af0dc"
            intensity={0.95}
            distance={1.45}
            decay={2}
            position={[0, 0.028, 0.01]}
          />
          <mesh rotation={[-0.42, 0, 0]} renderOrder={9}>
            <circleGeometry args={[0.024, 28]} />
            <meshBasicMaterial
              ref={(el) => {
                hullLampRefs.current[i].lens = el
              }}
              color="#4dffe8"
              transparent
              opacity={0.78}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      ))}
      {HULL_EDGE_LAMP_LAYOUT.map((lamp, i) => (
        <group key={`hull-edge-lamp-${i}`} position={lamp.position}>
          <pointLight
            ref={(el) => {
              hullEdgeLampRefs.current[i].light = el
            }}
            color="#2af0dc"
            intensity={0.92}
            distance={1.35}
            decay={2}
            position={[0, 0.006, 0.004]}
          />
          {(i === 0 || i === 2) ? (
            <group rotation={[-0.34, 0, 0]} renderOrder={9}>
              <mesh position={[0, -0.016, -0.007]}>
                <cylinderGeometry args={[0.012, 0.016, 0.02, 16]} />
                <meshStandardMaterial color="#2b2240" roughness={0.52} metalness={0.18} />
              </mesh>
              <mesh position={[0, -0.002, 0.004]}>
                <sphereGeometry args={[0.012, 20, 16]} />
                <meshBasicMaterial
                  ref={(el) => {
                    hullEdgeLampRefs.current[i].lens = el
                  }}
                  color="#48ffe6"
                  transparent
                  opacity={0.82}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                  toneMapped={false}
                />
              </mesh>
            </group>
          ) : (
            <mesh rotation={i === 1 ? [-0.5, 0, 0] : [0, 0, 0]} renderOrder={9}>
              {i === 1 ? <circleGeometry args={[0.02, 24]} /> : <sphereGeometry args={[0.015, 18, 14]} />}
              <meshBasicMaterial
                ref={(el) => {
                  hullEdgeLampRefs.current[i].lens = el
                }}
                color="#48ffe6"
                transparent
                opacity={0.76}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
                toneMapped={false}
                side={THREE.DoubleSide}
              />
            </mesh>
          )}
        </group>
      ))}
      {HULL_GIRL_STICKER_LAYOUT.map((st, i) => (
        <mesh
          key={`${st.texKey}-${i}`}
          position={st.position}
          rotation={st.rotation}
          scale={[st.scale, st.scale, 1]}
          renderOrder={11}
        >
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            map={girlHullStickerTextures[st.texKey]}
            transparent
            opacity={1}
            depthTest
            depthWrite={false}
            toneMapped={false}
            polygonOffset
            polygonOffsetFactor={-3}
            polygonOffsetUnits={-3}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
      <pointLight
        ref={glassRimLight}
        color="#f2f8ff"
        intensity={GLASS_RIM_LIGHT_INTENSITY}
        distance={GLASS_RIM_LIGHT_DISTANCE}
        decay={2}
        position={[0, 0.38, 2.4]}
      />
    </group>
  )
}
