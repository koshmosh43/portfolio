import { extend } from '@react-three/fiber'
import * as THREE from 'three'
import { shaderMaterial } from './shaderMaterial'

/**
 * Cheap background wash — one 3-octave fBm, no domain warp / ridged / stars.
 * ~6× fewer ALU ops than the main nebula pass.
 */
const NebulaHazeBgMaterial = shaderMaterial(
  {
    uTime: 0,
    uIntensity: 1,
    uAlpha: 1,
    uPhase: 0,
    uBlob: new THREE.Vector2(0, 0),
    uColorA: new THREE.Color(0.06, 0.08, 0.18),
    uColorB: new THREE.Color(0.12, 0.14, 0.26),
    uDustColor: new THREE.Color(0.003, 0.004, 0.012),
    uBlobRadius: 0.85,
    /** >1 = finer/smaller cloud features on the same fullscreen quad. */
    uPatternScale: 1.26,
  },
  `varying vec2 vUv;
   void main() {
     vUv = uv;
     gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
   }`,
  `
  varying vec2 vUv;
  uniform float uTime;
  uniform float uIntensity;
  uniform float uAlpha;
  uniform float uPhase;
  uniform vec2 uBlob;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uDustColor;
  uniform float uBlobRadius;
  uniform float uPatternScale;

  float hash21(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise2(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
               mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm4bg(vec2 p) {
    float v = 0.0;
    v += 0.50 * noise2(p); p = p * 2.06 + vec2(0.5, 0.83);
    v += 0.25 * noise2(p); p = p * 2.06 + vec2(0.81, 0.53);
    v += 0.125 * noise2(p); p = p * 2.06 + vec2(0.24, 1.14);
    v += 0.0625 * noise2(p);
    return v;
  }

  void main() {
    vec2 uv = vUv;
    float t = uTime * 0.052;
    vec2 drift = vec2(sin(t * 0.38 + uPhase) * 0.06 + t * 0.008,
                      cos(t * 0.33 + uPhase) * 0.05 - t * 0.006);
    vec2 q = uv - 0.5;
    float arm = q.y + q.x * 0.18 + sin(q.x * 5.4 + uPhase) * 0.035;
    vec2 p = (q * vec2(2.45, 2.0) + drift) * uPatternScale;
    float g = fbm4bg(p * 0.95 + vec2(t * 0.06, -t * 0.05));
    float gGrain = noise2(p * 10.5 + vec2(t * 0.09, -t * 0.075));
    g = clamp(g + (gGrain - 0.5) * 0.14, 0.0, 1.0);
    float lane = noise2(p * 2.8 + vec2(-t * 0.03, t * 0.025));
    float soot = smoothstep(0.46, 0.84, lane) * smoothstep(0.14, 0.64, g);

    /* Wide low/mid response + soot lanes — this pass supplies the dark galactic body. */
    float cloud = smoothstep(0.14, 0.52, g) * (1.0 - smoothstep(0.72, 0.96, g) * 0.58);
    float volumetric = smoothstep(0.12, 0.42, g) * 0.42;
    float dist = length(q * vec2(0.78, 1.26));
    float edgeFade = 1.0 - smoothstep(0.32, 0.74, dist);
    float armMask = 1.0 - smoothstep(0.08, 0.36, abs(arm));
    vec2 blobC = uBlob + vec2(0.04 * sin(t * 0.28 + uPhase), 0.035 * cos(t * 0.24 + uPhase));
    float blobMask = 1.0 - smoothstep(uBlobRadius * 0.28, uBlobRadius, length(q * vec2(0.72, 1.22) - blobC));

    float haze = (cloud + volumetric + soot * 0.3) * edgeFade * blobMask * mix(0.42, 0.92, armMask) * uIntensity;

    /* Wide cool bias — no saturated cross-fade (reads as volumetric dust, not poster). */
    float lr = smoothstep(0.22, 0.78, uv.x * 0.72 + uv.y * 0.18 + sin(t * 0.08 + uPhase * 0.3) * 0.04);
    vec3 colMid = mix(uColorA, uColorB, smoothstep(0.16, 0.58, g) * 0.62);
    vec3 col = mix(uDustColor, colMid, smoothstep(0.06, 0.62, g));
    col = mix(col, mix(uColorA, uColorB, 0.38), lr * smoothstep(0.32, 0.74, g) * 0.2);
    col = mix(col, uDustColor * 0.48, soot * 0.85);
    col += mix(uColorA, uColorB, 0.5) * pow(max(0.0, g - 0.46), 2.35) * 0.07;

    float centerMask = smoothstep(0.06, 0.30, dist);
    float alpha = haze * 0.48 * centerMask * uAlpha;
    float dn = hash21(gl_FragCoord.xy * 0.013 + t * 0.001) - 0.5;
    col += dn * 0.007;
    alpha = clamp(alpha * 0.94 + dn * 0.012, 0.0, 1.0);
    gl_FragColor = vec4(col, alpha);
  }
  `,
)

/** Main nebula: single domain warp, 4-octave fBm, 3-octave ridged — no per-pixel star grid. */
const NebulaHazeMaterial = shaderMaterial(
  {
    uTime: 0.0,
    uIntensity: 1.0,
    uAlpha: 1.0,
    uPhase: 0.0,
    uBlob: new THREE.Vector2(0, 0),
    uColorA: new THREE.Color(0.08, 0.38, 0.72),
    uColorB: new THREE.Color(0.18, 0.52, 0.82),
    uColorHot: new THREE.Color(0.45, 0.72, 0.92),
    uDustColor: new THREE.Color(0.004, 0.006, 0.045),
    uBlobRadius: 0.72,
    uPatternScale: 1.26,
  },
  `varying vec2 vUv;
   void main() {
     vUv = uv;
     gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
   }`,
  `
  varying vec2 vUv;
  uniform float uTime;
  uniform float uIntensity;
  uniform float uAlpha;
  uniform float uPhase;
  uniform vec2 uBlob;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorHot;
  uniform vec3 uDustColor;
  uniform float uBlobRadius;
  uniform float uPatternScale;

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
    v += 0.5000 * noise2(p); p = p * 2.07 + vec2(0.501, 0.832);
    v += 0.2500 * noise2(p); p = p * 2.07 + vec2(0.811, 0.534);
    v += 0.1250 * noise2(p); p = p * 2.07 + vec2(0.238, 1.144);
    v += 0.0625 * noise2(p);
    return v;
  }

  float ridged3(vec2 p) {
    float v = 0.0, a = 0.55;
    v += a * (1.0 - abs(2.0 * noise2(p) - 1.0)); p *= 2.12; a *= 0.48;
    v += a * (1.0 - abs(2.0 * noise2(p) - 1.0)); p *= 2.12; a *= 0.48;
    v += a * (1.0 - abs(2.0 * noise2(p) - 1.0));
    return v;
  }

  void main() {
    vec2 uv = vUv;
    float t = uTime * 0.06;

    vec2 drift = vec2(
      sin(t * 0.42 + uPhase) * 0.082 + t * 0.010,
      cos(t * 0.37 + uPhase * 1.26) * 0.068 - t * 0.008
    );
    vec2 p = ((uv - 0.5) * vec2(2.7, 2.42) + drift) * uPatternScale;

    /* Single domain warp (was two nested fBm warps). */
    vec2 w = vec2(
      fbm4(p * 1.22 + vec2(uPhase * 0.24, 1.42 + t * 0.048)),
      fbm4(p * 1.22 + vec2(7.55 + t * 0.042, uPhase * 0.17))
    ) * 0.42;
    vec2 r = p + w;
    /* Cheap micro-warp instead of second fBm warp pass. */
    r += (vec2(noise2(r * 6.0 + vec2(t * 0.07, 0.0)), noise2(r * 6.0 + vec2(3.1, t * 0.06))) - 0.5) * 0.14;

    float coarse = fbm4(r * 0.74 + vec2(t * 0.07, -t * 0.052));
    float mid = fbm4(r * 2.05 + w * 0.62 + vec2(-t * 0.062, t * 0.088));
    float clump = fbm4(r * 4.45 + vec2(t * 0.045, -t * 0.036));
    float nHi = noise2(r * 11.5 + vec2(t * 0.1, -t * 0.076));
    float nMed = noise2(r * 7.4 + vec2(-t * 0.054, t * 0.045));
    float nCrisp = noise2(r * 24.0 + vec2(t * 0.08, t * 0.072));
    float rg = ridged3(r * 3.65 + vec2(t * 0.044, t * 0.034));

    vec2 q = uv - 0.5;
    float armCurve = q.y + q.x * 0.28 + sin(q.x * 4.2 + uPhase * 0.64) * 0.035;
    float armMask = 1.0 - smoothstep(0.06, 0.36, abs(armCurve));
    float armFeather = 1.0 - smoothstep(0.16, 0.84, length(q * vec2(0.54, 1.14)));

    /* Layered fBm + clumps + ridged filaments: textured gas, not flat white blobs. */
    float dens = coarse * 0.36 + mid * 0.34 + clump * 0.2 + nHi * 0.08 + rg * 0.2;
    dens += (nMed - 0.5) * 0.08 + abs(nCrisp - 0.5) * 0.055;
    dens *= mix(0.34, 0.95, armMask * armFeather);
    dens = clamp(dens, 0.0, 1.0);

    float cloud = smoothstep(0.24, 0.6, dens) * (1.0 - smoothstep(0.7, 0.94, dens) * 0.68);
    float filament = smoothstep(0.62, 0.86, rg) * smoothstep(0.34, 0.62, dens) * 0.42;
    float volumetric = smoothstep(0.18, 0.5, dens) * 0.24;

    float dist = length(q * vec2(0.74, 1.28));
    float edgeFade = 1.0 - smoothstep(0.34, 0.78, dist);
    float innerOpen = smoothstep(0.02, 0.14, dist);

    vec2 blobC = uBlob
      + vec2(0.052 * sin(t * 0.32 + uPhase), 0.044 * cos(t * 0.27 + uPhase * 0.86));
    float blobMask = 1.0 - smoothstep(uBlobRadius * 0.28, uBlobRadius, length(q * vec2(0.72, 1.18) - blobC));

    float haze = (cloud + filament * 0.34 + volumetric) * edgeFade * innerOpen * blobMask * uIntensity;

    /* Dust lanes carve the light; the arm mask keeps the silhouette 3D and intentional. */
    float laneNoise = noise2(r * 1.55 + vec2(t * 0.035, -t * 0.028));
    float lane = smoothstep(0.08, 0.52, laneNoise);
    float curvedLane = smoothstep(0.035, 0.16, abs(armCurve + (laneNoise - 0.5) * 0.16));
    float dustLane = max(
      smoothstep(0.48, 0.82, laneNoise) * smoothstep(0.2, 0.62, dens),
      (1.0 - curvedLane) * armFeather * 0.74
    );
    float diagBand = smoothstep(0.12, 0.86, (uv.x + uv.y * 0.92) * 0.51 + (dens - 0.42) * 0.22);
    float ridgeGlow = smoothstep(0.5, 0.84, rg) * (1.0 - dustLane * 0.72);
    haze *= mix(0.22, 0.9, lane) * (0.82 + 0.14 * diagBand + 0.1 * ridgeGlow) * mix(0.44, 1.04, armMask);

    float emis = smoothstep(0.43, 0.70, dens);
    float scatter = smoothstep(0.14, 0.30, dens) * (1.0 - smoothstep(0.30, 0.50, dens));
    float hueOsc = 0.5 + 0.5 * sin(dens * 4.1 + t * 0.65 + uPhase);

    vec3 col = uDustColor;
    col = mix(col, uColorA, smoothstep(0.2, 0.56, dens) * 0.78);
    col = mix(col, uDustColor * 0.7, dustLane * 0.52);
    col = mix(col, uColorHot, emis * 0.12 * (1.0 - dustLane * 0.62));
    col = mix(col, uColorB, (filament + pow(max(0.0, rg - 0.46), 1.9) * 0.28) * 0.32);
    col = mix(col, mix(uColorA, uColorB, 0.5), hueOsc * 0.028 * cloud);
    col += uColorA * 0.11 * scatter;
    col += uColorHot * 0.052 * filament * rg * (1.0 - dustLane * 0.58);
    col += uColorB * 0.032 * pow(max(0.0, dens - 0.58), 2.15);
    col += uColorHot * 0.012 * diagBand * cloud;
    col += mix(uColorA, uColorB, diagBand) * pow(max(0.0, dens - 0.4), 1.7) * 0.034;
    col += mix(uColorA, uColorB, 0.5) * pow(max(0.0, nCrisp - 0.54), 2.6) * 0.032 * cloud;
    col = mix(col, uDustColor * 0.56, dustLane * 0.48);

    float lum = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(vec3(lum), col, 0.74);

    float centerMask = smoothstep(0.08, 0.32, dist);
    float alpha = haze * 0.34 * centerMask * uAlpha;
    float dn = hash21(gl_FragCoord.xy * 0.017 + t * 0.002) - 0.5;
    col += dn * 0.006;
    gl_FragColor = vec4(col, alpha * 0.64);
  }
  `,
)

extend({ NebulaHazeMaterial, NebulaHazeBgMaterial })
export { NebulaHazeMaterial, NebulaHazeBgMaterial }
