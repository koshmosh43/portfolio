import { extend } from '@react-three/fiber'
import { shaderMaterial } from './shaderMaterial'

const VortexMaterial = shaderMaterial(
  { uTime: 0, uLayer: 0 },
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  `
    varying vec2 vUv;
    uniform float uTime;
    uniform float uLayer;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
        u.y
      );
    }

    void main() {
      vec2 p = vUv * 2.0 - 1.0;
      float layerMix = uLayer;
      float r = length(p);
      float angle = atan(p.y, p.x) + uTime * (0.24 + layerMix * 0.12);
      float t = uTime * (0.2 + layerMix * 0.05);

      float radialShift = sin(uTime * (0.8 + layerMix * 0.4) + r * 12.0) * (0.06 + layerMix * 0.018);
      r += radialShift;
      vec2 drift = vec2(sin(uTime * 0.14), cos(uTime * 0.11)) * 0.095;
      vec2 q = p + drift;

      float spiral = sin(angle * (6.0 + layerMix) - r * (18.0 + layerMix * 2.0) - t * 4.6) * 0.5 + 0.5;
      float spiral2 = sin(angle * 4.2 - r * 12.0 + t * 2.8) * 0.5 + 0.5;
      float haze = noise(q * 6.5 + vec2(t * 1.6, -t * 1.4)) * 0.56 + noise(q * 12.0 - vec2(t * 2.3, t * 0.9)) * 0.44;
      float ring = exp(-pow((r - (0.72 + layerMix * 0.05)) * 2.5, 2.0));
      float center = smoothstep(0.48, 0.03, r);
      float glow = smoothstep(1.55, 0.3, r) * 0.4;

      vec3 base = vec3(0.01, 0.015, 0.05);
      vec3 purple = vec3(0.34, 0.12, 0.63);
      vec3 cyan = vec3(0.10, 0.44, 0.62);
      vec3 blackHole = vec3(0.0, 0.0, 0.0);

      float mixFactor = (spiral * 0.42 + spiral2 * 0.2 + haze * 0.38) * ring;
      vec3 col = base;
      col += mix(purple, cyan, spiral) * mixFactor * (1.65 + layerMix * 0.3);
      col += purple * glow * 0.35;
      col = mix(col, blackHole, center * 0.95);
      col *= (1.0 - smoothstep(1.28, 1.85, r));

      gl_FragColor = vec4(col, 1.0);
    }
  `,
  (self) => {
    /* Full-quad fragments use alpha 1; depth would otherwise carve holes in Stars/Nebula when the camera strafes */
    self.depthWrite = true
  },
)

extend({ VortexMaterial })

export { VortexMaterial }
