import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { createStarSpriteTexture } from '../textures/createStarSpriteTexture'
import { useAdaptiveSceneQualityContext } from './adaptiveSceneQuality'

const FALLBACK_STAR_LAYERS = Object.freeze({ far: 26000, near: 16000, hero: 6000 })
const LAYERS = Object.freeze(['far', 'near', 'hero'])

const GEOMETRY = Object.freeze({
  /** Slightly tighter shell so points stay larger on screen (still behind planets). */
  far: { radius: [14, 48], z: [14, 34], speed: 0.74 },
  near: { radius: [8, 38], z: [5, 22], speed: 0.98 },
  hero: { radius: [7, 32], z: [6, 18], speed: 1.14 },
})

const STYLE = Object.freeze({
  far: { color: '#cfe6ff', size: 1.22, max: 9.5, order: 70 },
  near: { color: '#f0f8ff', size: 1.48, max: 12, order: 71 },
  hero: { color: '#ffffff', size: 2.05, max: 17, order: 72 },
})

const MOTION = Object.freeze({
  far: { z: -0.0052, y: [0.078, 0, 0.011], p: [0.045, 0.026, 0.02], breathe: [0.064, 0, 0.008] },
  near: { z: 0.0072, y: [0.098, 0.4, 0.016], p: [0.068, 0.038, 0.03], breathe: [0.078, 1.1, 0.01] },
  hero: { z: 0.009, y: [0.118, 0.9, 0.02], p: [0.092, 0.052, 0.042], breathe: [0.098, 2, 0.013] },
})

const rand = (min, span) => min + Math.random() * span
const oscillate = (t, [speed, phase, amplitude]) => Math.sin(t * speed + phase) * amplitude

const STAR_VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uBaseSize;
  uniform float uMaxPx;
  attribute float aPhase;
  attribute float aSpeed;
  varying float vBright;

  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    float w = uTime * aSpeed * 0.38 + aPhase;
    vBright = 0.9 + 0.1 * sin(w);
    float dist = max(9.0, -mvPosition.z);
    float px = uBaseSize * uPixelRatio * vBright * (56.0 / dist);
    gl_PointSize = min(px, uMaxPx);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const STAR_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform sampler2D uMap;
  varying float vBright;

  void main() {
    vec4 tex = texture2D(uMap, gl_PointCoord);
    float a = tex.a * vBright;
    if (a < 0.002) discard;
    gl_FragColor = vec4(uColor * a, a);
  }
`

function makeStarMaterial(colorHex, baseSize, maxPx, map) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: 1 },
      uBaseSize: { value: baseSize },
      uMaxPx: { value: maxPx },
      uColor: { value: new THREE.Color(colorHex) },
      uMap: { value: map },
    },
    vertexShader: STAR_VERTEX,
    fragmentShader: STAR_FRAGMENT,
    transparent: true,
    depthTest: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  })
}

function buildStarLayer(count, { radius: [rMin, rMax], z: [zMin, zSpread], speed }) {
  const positions = new Float32Array(count * 3)
  const aPhase = new Float32Array(count)
  const aSpeed = new Float32Array(count)
  const rSpread = rMax - rMin

  for (let i = 0; i < count; i += 1) {
    const radius = rand(rMin, rSpread)
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(Math.random() * 2 - 1)
    const p = i * 3
    positions[p] = radius * Math.sin(phi) * Math.cos(theta)
    positions[p + 1] = radius * Math.sin(phi) * Math.sin(theta)
    positions[p + 2] = zMin - Math.random() * zSpread
    aPhase[i] = Math.random() * Math.PI * 2
    aSpeed[i] = rand(0.35, 1.2) * speed
  }

  return { positions, aPhase, aSpeed }
}

function useStarGeometry(count, config) {
  return useMemo(() => {
    const { positions, aPhase, aSpeed } = buildStarLayer(count, config)
    const geom = new THREE.BufferGeometry()
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geom.setAttribute('aPhase', new THREE.BufferAttribute(aPhase, 1))
    geom.setAttribute('aSpeed', new THREE.BufferAttribute(aSpeed, 1))
    return geom
  }, [count, config])
}

function moveLayer(points, t, px, py, { z, y, p, breathe }) {
  if (!points) return
  points.rotation.z = t * z + px * p[0]
  points.rotation.y = oscillate(t, y) + py * p[1]
  points.rotation.x = py * p[2]
  points.scale.setScalar(1 + oscillate(t, breathe))
}

function updateUniforms(mat, t, dpr) {
  mat.uniforms.uTime.value = t
  mat.uniforms.uPixelRatio.value = dpr
}

export function Stars() {
  const quality = useAdaptiveSceneQualityContext()
  const { far, near, hero } = quality?.starLayers ?? FALLBACK_STAR_LAYERS

  const refs = useRef({})
  const pointerSm = useRef({ x: 0, y: 0 })

  const { gl } = useThree()
  const starTexture = useMemo(() => createStarSpriteTexture(), [])

  const farGeo = useStarGeometry(far, GEOMETRY.far)
  const nearGeo = useStarGeometry(near, GEOMETRY.near)
  const heroGeo = useStarGeometry(hero, GEOMETRY.hero)
  const geometries = { far: farGeo, near: nearGeo, hero: heroGeo }

  const farMat = useMemo(() => makeStarMaterial(STYLE.far.color, STYLE.far.size, STYLE.far.max, starTexture), [starTexture])
  const nearMat = useMemo(() => makeStarMaterial(STYLE.near.color, STYLE.near.size, STYLE.near.max, starTexture), [starTexture])
  const heroMat = useMemo(() => makeStarMaterial(STYLE.hero.color, STYLE.hero.size, STYLE.hero.max, starTexture), [starTexture])
  const materials = { far: farMat, near: nearMat, hero: heroMat }

  useFrame(({ clock, pointer }) => {
    const t = clock.elapsedTime
    const dpr = gl.getPixelRatio()

    const s = 0.065
    pointerSm.current.x += (pointer.x - pointerSm.current.x) * s
    pointerSm.current.y += (pointer.y - pointerSm.current.y) * s
    const px = pointerSm.current.x
    const py = pointerSm.current.y

    updateUniforms(farMat, t, dpr)
    updateUniforms(nearMat, t, dpr)
    updateUniforms(heroMat, t, dpr)
    moveLayer(refs.current.far, t, px, py, MOTION.far)
    moveLayer(refs.current.near, t, px, py, MOTION.near)
    moveLayer(refs.current.hero, t, px, py, MOTION.hero)
  })

  return (
    <>
      {LAYERS.map((key) => (
        <points
          key={key}
          ref={(el) => {
            refs.current[key] = el
          }}
          geometry={geometries[key]}
          material={materials[key]}
          renderOrder={STYLE[key].order}
        />
      ))}
    </>
  )
}
