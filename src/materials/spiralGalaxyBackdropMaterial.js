import { extend } from '@react-three/fiber'
import * as THREE from 'three'
import { shaderMaterial } from './shaderMaterial'

/**
 * Soft barred/spiral disc for deep background — pairs with nebulaHaze (additive, toneMapped off).
 * uSquash < 1 pulls the disc into an edge-on sliver.
 */
const SpiralGalaxyBackdropMaterial = shaderMaterial(
  {
    uTime: 0,
    uIntensity: 1,
    uPhase: 0,
    uBlob: new THREE.Vector2(0, 0),
    uSquash: 1,
    uEllipse: new THREE.Vector2(1, 1),
    uColorCore: new THREE.Color(1.0, 0.96, 0.9),
    uColorArm: new THREE.Color(0.32, 0.12, 0.38),
    uColorRim: new THREE.Color(0.15, 0.42, 0.88),
    uArmCount: 2.25,
    uTwist: 10.5,
    uArmSharp: 1.55,
  },
  /* glsl */ `varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`,
  /* glsl */ `
  varying vec2 vUv;
  uniform float uTime;
  uniform float uIntensity;
  uniform float uPhase;
  uniform vec2 uBlob;
  uniform float uSquash;
  uniform vec2 uEllipse;
  uniform vec3 uColorCore;
  uniform vec3 uColorArm;
  uniform vec3 uColorRim;
  uniform float uArmCount;
  uniform float uTwist;
  uniform float uArmSharp;

  float hash21(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise2(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
               mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm4(vec2 p) {
    float v = 0.0;
    v += 0.5000 * noise2(p); p = p * 2.07 + vec2(0.51, 0.83);
    v += 0.2500 * noise2(p); p = p * 2.07 + vec2(0.81, 0.54);
    v += 0.1250 * noise2(p); p = p * 2.07 + vec2(0.24, 1.14);
    v += 0.0625 * noise2(p);
    return v;
  }

  void main() {
    vec2 uv = (vUv - 0.5) * uEllipse;
    uv.y /= max(0.08, uSquash);
    float t = uTime * 0.035 + uPhase * 0.2;
    float r = length(uv);
    float ang = atan(uv.y, uv.x);

    float discOut = 1.0 - smoothstep(0.38, 0.58, r);
    float discIn = smoothstep(0.018, 0.072, r);
    float disc = discOut * discIn;

    float bulge = exp(-r * 18.0);

    float spiralWave = sin(uArmCount * ang + log(max(r, 0.035)) * uTwist + t * 1.1);
    spiralWave = spiralWave * 0.5 + 0.5;
    float arms = pow(spiralWave, uArmSharp) * disc;

    vec2 warp = vec2(
      fbm4(uv * 5.5 + vec2(t * 0.15, uPhase)),
      fbm4(uv * 5.5 + vec2(4.2, -t * 0.12))
    ) - 0.5;
    arms *= 0.62 + 0.58 * fbm4(uv * 8.2 + warp * 1.8 + vec2(t * 0.08, -t * 0.06));

    float lane = smoothstep(0.15, 0.55, noise2(uv * 4.2 + vec2(t * 0.04, uPhase * 0.3)));
    arms *= mix(0.45, 1.0, lane);

    vec2 blobC = uBlob * 0.42;
    float hole = 1.0 - smoothstep(0.08, 0.42, length(uv - blobC));
    float edgeVignette = 1.0 - smoothstep(0.35, 0.55, r);

    vec3 col = mix(uColorArm, uColorRim, smoothstep(0.05, 0.38, r) * (0.35 + arms * 0.85));
    col = mix(col, uColorCore, bulge);
    col += uColorCore * bulge * 0.55;
    col += uColorRim * pow(max(0.0, arms - 0.28), 1.4) * 0.35;

    float alpha = (arms * 0.52 + bulge * 1.05) * uIntensity * hole * edgeVignette * disc;
    alpha = clamp(alpha, 0.0, 1.0);
    gl_FragColor = vec4(col * alpha, alpha * 0.82);
  }
  `,
)

extend({ SpiralGalaxyBackdropMaterial })
export { SpiralGalaxyBackdropMaterial }
