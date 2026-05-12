import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { heroShipCameraBridge, HERO_TRAIL_LEN } from './heroShipCameraBridge'

function makeWakeDotTexture() {
  const s = 96
  const c = document.createElement('canvas')
  c.width = s
  c.height = s
  const ctx = c.getContext('2d')

  const bg = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s * 0.66)
  bg.addColorStop(0, 'rgba(255,255,255,1)')
  bg.addColorStop(0.28, 'rgba(210,244,255,0.7)')
  bg.addColorStop(0.52, 'rgba(142,214,255,0.34)')
  bg.addColorStop(0.82, 'rgba(80,150,255,0.12)')
  bg.addColorStop(1, 'rgba(40,90,190,0)')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, s, s)

  const burst = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s * 0.35)
  burst.addColorStop(0, 'rgba(255,255,255,0.96)')
  burst.addColorStop(0.42, 'rgba(190,230,255,0.7)')
  burst.addColorStop(0.75, 'rgba(126,210,255,0.22)')
  burst.addColorStop(1, 'rgba(80,156,255,0)')
  ctx.fillStyle = burst
  ctx.fillRect(0, 0, s, s)

  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

const WAKE_VS = `
  attribute vec3 color;
  attribute float size;
  attribute float age;
  varying vec3 vColor;
  varying float vAge;
  void main() {
    vColor = color;
    vAge = age;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);

    float wave = sin(age * 19.0 + position.x * 3.5 + position.y * 2.9) * 0.7;
    float jitter = cos(age * 23.0 + position.z * 3.2) * 0.9;
    mv.xy += vec2(wave, jitter) * (1.0 - age) * 0.018 * size;

    gl_Position = projectionMatrix * mv;
    float d = max(4.5, -mv.z);
    gl_PointSize = max(18.0, size / d) * (1.0 + 0.16 * sin(age * 14.0 + position.x * 6.0));
  }
`

const WAKE_FS = `
  uniform sampler2D uMap;
  uniform float uTime;
  varying vec3 vColor;
  varying float vAge;
  void main() {
    vec4 t = texture2D(uMap, gl_PointCoord);
    if (t.a < 0.01) discard;
    float shimmer = 0.72 + 0.42 * sin(uTime * 26.0 + vAge * 12.0 + gl_PointCoord.x * 26.0 + gl_PointCoord.y * 18.0);
    shimmer = clamp(shimmer, 0.6, 1.26);
    vec3 lilac = vec3(0.82, 0.44, 0.98);
    vec3 aqua = vec3(0.32, 1.0, 0.95);
    vec3 hue = mix(aqua, lilac, vAge);
    float tailFade = pow(vAge, 1.8);
    float alpha = t.a * mix(0.12, 1.0, tailFade) * (0.52 + 0.44 * shimmer) * tailFade;
    vec3 glow = hue * t.rgb * (0.96 + 0.56 * shimmer) * mix(0.72, 1.0, tailFade);
    glow += 0.38 * pow(t.a, 1.7) * vec3(1.0, 1.08, 1.16) * (1.0 - tailFade);
    gl_FragColor = vec4(glow, alpha);
  }
`

/**
 * Additive ion / soft smoke streak during hero fly-in and return-to-galaxy.
 */
export function HeroShipWake() {
  const geomRef = useRef()
  const matRef = useRef()
  const tex = useMemo(() => makeWakeDotTexture(), [])

  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const pos = new Float32Array(HERO_TRAIL_LEN * 3)
    const col = new Float32Array(HERO_TRAIL_LEN * 3)
    const size = new Float32Array(HERO_TRAIL_LEN)
    const age = new Float32Array(HERO_TRAIL_LEN)
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage))
    g.setAttribute('color', new THREE.BufferAttribute(col, 3).setUsage(THREE.DynamicDrawUsage))
    g.setAttribute('size', new THREE.BufferAttribute(size, 1).setUsage(THREE.DynamicDrawUsage))
    g.setAttribute('age', new THREE.BufferAttribute(age, 1).setUsage(THREE.DynamicDrawUsage))
    g.setDrawRange(0, 0)
    return g
  }, [])

  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uMap: { value: tex }, uTime: { value: 0 } },
        vertexShader: WAKE_VS,
        fragmentShader: WAKE_FS,
        transparent: true,
        depthWrite: false,
        depthTest: true,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    [tex],
  )

  useEffect(() => {
    geomRef.current = geom
    matRef.current = mat
    return () => {
      tex.dispose()
      geom.dispose()
      mat.dispose()
    }
  }, [geom, mat, tex])

  useFrame(({ clock }) => {
    const g = geomRef.current
    const m = matRef.current
    if (!g || !m) return
    m.uniforms.uTime.value = clock.elapsedTime
    const w = heroShipCameraBridge.wakeStrength
    if (w < 0.02 || heroShipCameraBridge.trailFilled < 2) {
      g.setDrawRange(0, 0)
      return
    }

    const N = HERO_TRAIL_LEN
    const head = heroShipCameraBridge.trailHead
    const n = heroShipCameraBridge.trailFilled
    const posAttr = g.attributes.position
    const colAttr = g.attributes.color
    const sizeAttr = g.attributes.size
    const ageA = g.attributes.age
    const posArr = posAttr.array
    const colArr = colAttr.array
    const sizeArr = sizeAttr.array
    const ageArr = ageA.array

    for (let k = 0; k < n; k += 1) {
      const ti = (head - n + k + N) % N
      const p = heroShipCameraBridge.trail[ti]
      const i3 = k * 3
      posArr[i3] = p.x
      posArr[i3 + 1] = p.y
      posArr[i3 + 2] = p.z

      const age = k / Math.max(1, n - 1)
      const tw = (0.24 + 0.76 * age) * w
      colArr[i3] = (0.68 + 0.24 * age) * tw
      colArr[i3 + 1] = (0.72 + 0.18 * age) * tw
      colArr[i3 + 2] = (0.94 - 0.34 * age) * tw

      sizeArr[k] = THREE.MathUtils.lerp(148, 22, age) * w
      ageArr[k] = age
    }

    posAttr.needsUpdate = true
    colAttr.needsUpdate = true
    sizeAttr.needsUpdate = true
    ageA.needsUpdate = true
    g.setDrawRange(0, n)
  })

  return <points geometry={geom} material={mat} frustumCulled={false} renderOrder={62} />
}
