export const MOON_TRAIL_POINTS = 120
export const TRAIL_POINT_MAX_STEP = 0.045
export const TRAIL_MAX_SUBSTEPS = 3
export const FINTECH_SATELLITE_COUNT = 2

/**
 * Planet atmospheres / aurora / transmission shells are transparent; draw after starfield (61)
 * so halos sit on top of stars; opaque rock stays in the opaque pass with depth.
 */
export const PLANET_TRANSPARENT_MIN_RENDER_ORDER = 85
/** Idle: pronounced diagonal, visually "left-bottom -> right-top". */
export const PLANET_D_RING_BASE_ROT = Object.freeze([0.94, -0.58, 0.42])
/** Focus / showcase: even stronger diagonal presentation for SaaS. */
export const PLANET_D_RING_FOCUS_ROT = Object.freeze([1.04, -0.78, 0.56])
/**
 * Parent-space spin axis for the SaaS dust ring (normalized at runtime).
 * Tuned so motion reads as bottom-left → top-right on the default tableau.
 */
export const PLANET_D_RING_SPIN_AXIS = Object.freeze([0.82, 0.82, 0.28])

/** Planet body spin: each axis slightly tilted from local Y; speeds differ per planet. */
export const PLANET_BODY_SPIN = Object.freeze({
  A: Object.freeze({ axis: [0.14, 0.986, -0.1], speed: 0.0031 }),
  B: Object.freeze({ axis: [-0.1, 0.991, 0.12], speed: 0.0028 }),
  C: Object.freeze({ axis: [0.17, 0.976, 0.13], speed: 0.0024 }),
  D: Object.freeze({ axis: [-0.13, 0.983, -0.11], speed: 0.00255 }),
  E: Object.freeze({ axis: [0.08, 0.994, 0.15], speed: 0.0036 }),
})
/**
 * SaaS dust ring: spin angle only wobbles between these degrees (around `PLANET_D_RING_SPIN_AXIS`),
 * not a full 360° loop. Tune here if you want a wider or narrower sway.
 */
export const PLANET_D_RING_SPIN_DEG_MIN = 20
export const PLANET_D_RING_SPIN_DEG_MAX = 30
/** Games / Playable Ads / AR·VR — dimmer lit hemisphere & halos. */
export const REMOTE_SURFACE_TINT = '#7d8c9c'
export const REMOTE_MOON_TINT = '#8f9dad'
export const PLANET_BASE_ENVMAP_INTENSITY = 0.2
export const PLANET_BASE_SPECULAR_INTENSITY = 0.2

export const DEFAULT_PROCEDURAL_TEX = Object.freeze({
  terrainW: 256,
  terrainH: 128,
  moonW: 240,
  moonH: 120,
})
