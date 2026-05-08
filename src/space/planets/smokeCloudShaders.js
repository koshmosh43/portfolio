export const SMOKE_PUFF_VS = /* glsl */ `
uniform float uTime;
uniform float uSpeed;
uniform float uPixelRatio;
attribute float aBaseScale;
attribute float aPhase;
attribute float aSpin;
attribute float aShear;
attribute float aLift;
attribute float aAlphaMul;
varying float vAlphaMul;
varying float vAngle;

void main() {
  float t = uTime * uSpeed;
  float wind = sin(t * 2.2 + aPhase);
  float roll = cos(t * 1.45 + aPhase * 0.7);
  vec3 base = position;
  vec3 pos = vec3(
    base.x + wind * aShear,
    base.y + roll * aLift,
    base.z + wind * aLift * 0.7
  );
  float breathe = 1.0 + sin(t * 1.8 + aPhase) * 0.055;
  float shearSign = abs(aShear) < 1e-5 ? 1.0 : sign(aShear);
  vAngle = aSpin + t * 0.035 * shearSign;
  vAlphaMul = aAlphaMul;
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  float w = aBaseScale * breathe;
  float h = aBaseScale * 0.58 * (1.0 + roll * 0.035);
  float screen = 420.0 * uPixelRatio;
  gl_PointSize = max(2.0, sqrt(w * h) * screen / max(-mvPosition.z, 0.35));
}
`

export const SMOKE_PUFF_FS = /* glsl */ `
uniform sampler2D uMap;
uniform vec3 uTint;
uniform float uAlpha;
varying float vAlphaMul;
varying float vAngle;

void main() {
  vec2 qc = gl_PointCoord - 0.5;
  float c = cos(vAngle);
  float s = sin(vAngle);
  vec2 uv = vec2(qc.x * c - qc.y * s, qc.x * s + qc.y * c) + 0.5;
  uv.y = (uv.y - 0.5) / 0.58 + 0.5;
  vec4 tex = texture2D(uMap, uv);
  float a = tex.a * uAlpha * vAlphaMul;
  if (a < 0.018) discard;
  gl_FragColor = vec4(uTint * tex.rgb, a);
}
`
