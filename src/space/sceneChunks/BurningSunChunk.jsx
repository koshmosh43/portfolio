import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

export const SUN_POS = new THREE.Vector3(-3.4, 2.35, -1.4)
export const SUN_LIGHT_TARGET = new THREE.Vector3(0.2, 1.35, -3.85)

const SUN_CORE_RADIUS = 0.76
const SUN_CORE_RENDER_ORDER = 59.45

const SUN_NOISE_GLSL = `
float hash(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.11, 0.17, 0.23));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float noise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float n000 = hash(i + vec3(0.0, 0.0, 0.0));
  float n100 = hash(i + vec3(1.0, 0.0, 0.0));
  float n010 = hash(i + vec3(0.0, 1.0, 0.0));
  float n110 = hash(i + vec3(1.0, 1.0, 0.0));
  float n001 = hash(i + vec3(0.0, 0.0, 1.0));
  float n101 = hash(i + vec3(1.0, 0.0, 1.0));
  float n011 = hash(i + vec3(0.0, 1.0, 1.0));
  float n111 = hash(i + vec3(1.0, 1.0, 1.0));
  float nx00 = mix(n000, n100, f.x);
  float nx10 = mix(n010, n110, f.x);
  float nx01 = mix(n001, n101, f.x);
  float nx11 = mix(n011, n111, f.x);
  float nxy0 = mix(nx00, nx10, f.y);
  float nxy1 = mix(nx01, nx11, f.y);
  return mix(nxy0, nxy1, f.z);
}

float fbm(vec3 p) {
  float a = 0.5;
  float v = 0.0;
  for (int i = 0; i < 5; i++) {
    v += noise(p) * a;
    p *= 2.03;
    a *= 0.52;
  }
  return v;
}
`

const SUN_VERTEX_SHADER = `
varying vec3 vWorldPos;
varying vec3 vNormalW;

void main() {
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPos = worldPos.xyz;
  vNormalW = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`

const SUN_FRAGMENT_SHADER = `
uniform float uTime;
uniform float uBreath;
varying vec3 vWorldPos;
varying vec3 vNormalW;
${SUN_NOISE_GLSL}

void main() {
  vec3 n = normalize(vNormalW);
  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  float fresnel = pow(1.0 - max(dot(n, viewDir), 0.0), 2.8);

  vec3 flow = n * 3.7;
  flow += vec3(0.0, uTime * 0.22, uTime * 0.08);
  float base = fbm(flow);
  float storm = fbm(flow * 2.7 + vec3(uTime * 0.32, -uTime * 0.18, uTime * 0.25));
  float cells = smoothstep(0.45, 0.92, base * 0.7 + storm * 0.5);
  float lava = smoothstep(0.35, 1.0, base + storm * 0.8);

  vec3 dark = vec3(0.02, 0.04, 0.12);
  vec3 mid = vec3(0.08, 0.28, 0.85);
  vec3 hot = vec3(0.35, 0.75, 1.0);
  vec3 coreCol = vec3(0.85, 0.96, 1.0);

  vec3 col = mix(dark, mid, lava);
  col = mix(col, hot, cells);
  col = mix(col, coreCol, pow(cells, 3.0) * 0.72 + fresnel * 0.42);
  float contrast = smoothstep(0.08, 0.95, lava);
  col = mix(col * 0.82, col, contrast * 0.35 + 0.65);
  col *= (1.58 + fresnel * 0.75) * uBreath;

  gl_FragColor = vec4(col, 1.0);
}
`

function BurningSun({ position = SUN_POS, scale = 1, onInteract, interactive }) {
  const { gl } = useThree()
  const coreRef = useRef()
  const hotLightRef = useRef()
  const warmLightRef = useRef()
  const coreUniforms = useMemo(() => ({ uTime: { value: 0 }, uBreath: { value: 1 } }), [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const triBreath =
      0.5 * Math.sin(t * 1.14 + 0.35) +
      0.33 * Math.sin(t * 1.89 - 0.52) +
      0.17 * Math.sin(t * 0.48 + 1.05)
    const breath01 = 0.5 + 0.5 * triBreath

    coreUniforms.uTime.value = t * 2.35
    coreUniforms.uBreath.value = 0.9 + 0.14 * breath01

    if (coreRef.current) {
      const pulse = 1.0 + triBreath * 0.028 + Math.sin(t * 2.33 + 0.7) * 0.012
      coreRef.current.scale.setScalar(pulse)
      coreRef.current.rotation.y += 0.0026
      coreRef.current.rotation.z = Math.sin(t * 0.7) * 0.06
    }
    if (hotLightRef.current) {
      hotLightRef.current.intensity =
        0.94 + breath01 * 0.38 + (0.5 + 0.5 * Math.sin(t * 3.8 + 0.4)) * 0.32 + Math.sin(t * 5.1) * 0.12
    }
    if (warmLightRef.current) {
      warmLightRef.current.intensity =
        0.66 + breath01 * 0.32 + (0.5 + 0.5 * Math.sin(t * 2.6 + 1.3)) * 0.28 + Math.sin(t * 4.2 + 0.6) * 0.16
      const ao = 0.5 + 0.5 * Math.sin(t * 1.9 + 0.4)
      warmLightRef.current.color.setRGB(0.58 + ao * 0.22, 0.82 + ao * 0.14, 1.0)
    }

  })

  const tap = (e) => {
    e.stopPropagation()
    if (!interactive || !onInteract) return
    if (e.pointerType === 'mouse' && e.button !== 0) return
    onInteract()
  }

  const sunPointer = interactive
    ? {
        onPointerUp: tap,
        onPointerOver: () => {
          gl.domElement.style.cursor = 'pointer'
        },
        onPointerOut: () => {
          gl.domElement.style.cursor = 'auto'
        },
      }
    : {}

  return (
    <group position={position.toArray()} scale={[scale, scale, scale]}>
      <mesh
        ref={coreRef}
        userData={{ sunPointerHit: true }}
        castShadow={false}
        receiveShadow={false}
        renderOrder={SUN_CORE_RENDER_ORDER}
        {...sunPointer}
      >
        <sphereGeometry args={[SUN_CORE_RADIUS, 48, 48]} />
        <shaderMaterial
          vertexShader={SUN_VERTEX_SHADER}
          fragmentShader={SUN_FRAGMENT_SHADER}
          uniforms={coreUniforms}
          toneMapped={false}
        />
      </mesh>

      <pointLight ref={hotLightRef} color="#e6fbff" intensity={1.1} distance={5.4} decay={2.0} />
      <pointLight ref={warmLightRef} color="#7ad7ff" intensity={0.88} distance={4.4} decay={1.95} />
    </group>
  )
}

export function SoftSunKeyLight({
  shadowMapSize = 1024,
  sunPosition = SUN_POS,
  targetPosition = SUN_LIGHT_TARGET,
}) {
  const targetRef = useRef()
  const sunLightRef = useRef()
  const sunFillLightRef = useRef()

  useEffect(() => {
    const T = targetRef.current
    const L = sunLightRef.current
    const F = sunFillLightRef.current
    if (!T || !L || !F) return

    T.position.copy(targetPosition)
    L.target = T
    F.target = T

    L.castShadow = true
    L.shadow.mapSize.set(shadowMapSize, shadowMapSize)
    L.shadow.bias = -0.00014
    L.shadow.normalBias = 0.065
    const cam = L.shadow.camera
    cam.near = 0.35
    cam.far = 26
    cam.left = -10
    cam.right = 10
    cam.top = 9
    cam.bottom = -9
    cam.updateProjectionMatrix()
    L.shadow.radius = 4.8
  }, [shadowMapSize, targetPosition])

  const distanceBoost = useMemo(() => {
    const d = sunPosition.distanceTo(targetPosition)
    const k = THREE.MathUtils.clamp((d - 3.8) / 4.2, 0, 1)
    return 1 + k * 0.38
  }, [sunPosition, targetPosition])

  return (
    <>
      <object3D ref={targetRef} />
      <directionalLight
        ref={sunLightRef}
        position={[sunPosition.x, sunPosition.y, sunPosition.z]}
        intensity={5.1 * distanceBoost}
        color="#d8eeff"
        castShadow
      />
      <directionalLight
        ref={sunFillLightRef}
        position={[sunPosition.x + 1.25, sunPosition.y - 0.55, sunPosition.z + 0.75]}
        intensity={0.34 * distanceBoost}
        color="#8eb4d4"
      />
    </>
  )
}

export function SunCluster({ sunPosition, sunScale, shadowMap, sunLightTarget, onSunInteract, sunInteractive }) {
  return (
    <>
      <BurningSun
        position={sunPosition}
        scale={sunScale}
        onInteract={onSunInteract}
        interactive={sunInteractive}
      />
      <SoftSunKeyLight shadowMapSize={shadowMap} sunPosition={sunPosition} targetPosition={sunLightTarget} />
    </>
  )
}
