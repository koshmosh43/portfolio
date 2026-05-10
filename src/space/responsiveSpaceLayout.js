const DEFAULT_FOV = 45
const CAMERA_Z = 4

/**
 * Hero composition (idle camera 0,0,4 → look 0,0,-2):
 * - Galaxy in optical center; sun upper-left.
 * - Planets sit on a cubic Bezier (not a straight line): left/right ends lift
 *   toward the sun (higher y); middle dips — frames the galaxy and reads as a
 *   shallow U / smile. Order along t: A → C → E → B → D.
 *
 * x,y = fractions of half-view at that slot’s z (resolveSlot scales by z).
 */
function cubicBezier2D(p0, p1, p2, p3, t) {
  const u = 1 - t
  const u2 = u * u
  const u3 = u2 * u
  const t2 = t * t
  const t3 = t2 * t
  return {
    x: u3 * p0[0] + 3 * u2 * t * p1[0] + 3 * u * t2 * p2[0] + t3 * p3[0],
    y: u3 * p0[1] + 3 * u2 * t * p1[1] + 3 * u * t2 * p2[1] + t3 * p3[1],
  }
}

/** Add to all Bezier Y controls (negative = entire planet chain lower in frame) */
const PLANET_CURVE_Y_SHIFT = -0.52

/** P0 / P3: high corners near sun; P1 / P2: pull the spline down in the middle */
const PLANET_CURVE_P0 = Object.freeze([-0.8, 0.2 + PLANET_CURVE_Y_SHIFT])
const PLANET_CURVE_P1 = Object.freeze([-0.34, -0.48 + PLANET_CURVE_Y_SHIFT])
const PLANET_CURVE_P2 = Object.freeze([0.4, -0.52 + PLANET_CURVE_Y_SHIFT])
const PLANET_CURVE_P3 = Object.freeze([0.92, 0.18 + PLANET_CURVE_Y_SHIFT])

/** Slightly uneven t so middle planets don’t feel mechanically spaced */
const PLANET_CURVE_T = Object.freeze([0, 0.26, 0.5, 0.74, 1])

const _a = cubicBezier2D(PLANET_CURVE_P0, PLANET_CURVE_P1, PLANET_CURVE_P2, PLANET_CURVE_P3, PLANET_CURVE_T[0])
const _c = cubicBezier2D(PLANET_CURVE_P0, PLANET_CURVE_P1, PLANET_CURVE_P2, PLANET_CURVE_P3, PLANET_CURVE_T[1])
const _e = cubicBezier2D(PLANET_CURVE_P0, PLANET_CURVE_P1, PLANET_CURVE_P2, PLANET_CURVE_P3, PLANET_CURVE_T[2])
const _b = cubicBezier2D(PLANET_CURVE_P0, PLANET_CURVE_P1, PLANET_CURVE_P2, PLANET_CURVE_P3, PLANET_CURVE_T[3])
const _d = cubicBezier2D(PLANET_CURVE_P0, PLANET_CURVE_P1, PLANET_CURVE_P2, PLANET_CURVE_P3, PLANET_CURVE_T[4])

const PLANET_SLOTS = Object.freeze({
  planetA: {
    radius: 0.68,
    idle: { x: _a.x, y: _a.y, z: -3.38, rotZ: 0 },
    focus: { x: _a.x, y: _a.y + 0.12, z: -3.16, rotZ: 0.02 },
  },
  planetB: {
    radius: 0.86,
    idle: { x: _b.x, y: _b.y, z: -4.35, rotZ: 0 },
    focus: { x: _b.x, y: _b.y + 0.08, z: -4.62, rotZ: -0.035 },
  },
  planetC: {
    radius: 0.62,
    idle: { x: _c.x, y: _c.y, z: -2.62, rotZ: 0 },
    focus: { x: _c.x, y: _c.y + 0.11, z: -2.42, rotZ: 0.04 },
  },
  planetD: {
    radius: 0.95,
    idle: { x: _d.x, y: _d.y, z: -5.68, rotZ: 0 },
    focus: { x: _d.x, y: _d.y + 0.1, z: -5.94, rotZ: -0.03 },
  },
  planetE: {
    radius: 0.58,
    idle: { x: _e.x, y: _e.y, z: -1.88, rotZ: 0 },
    focus: { x: _e.x, y: _e.y + 0.2, z: -1.66, rotZ: 0.06 },
  },
})

const FOCUS_OFFSETS_DESKTOP = Object.freeze({
  planetA: {
    lookAt: [0.17, -0.25, 1.9],
    camera: [1.26, 0.4, 2.04],
    ship: [-0.26, -0.16, 0.2],
    meta: {
      shipYaw: 0,
      pilotStickerScaleMul: 0.8,
      pilotStickerOffsetX: 0.2,
      pilotStickerOffsetY: 0,
      shipNeonLightMul: 0.22,
      shipGlassLightMul: 0.2,
      pilotStickerOffsetZ: 0.1,
    },
  },
  planetB: {
    lookAt: [-0.07, -0.58, 0.19],
    camera: [-1.5, -0.31, 4.04],
    ship: [-1.16, -0.54, 2.22],
    meta: {
      pilotStickerScaleMul: 0.55,
      pilotStickerOffsetX: -0.038,
    },
  },
  planetC: {
    lookAt: [0.13, -0.07, -0.11],
    camera: [1.3, 0.52, 2.2],
    ship: [0.94, -0.24, 0.7],
    meta: {
      shipGlowAttenuation: 0.4,
      pilotStickerScaleMul: 0.75,
    },
  },
  planetD: {
    lookAt: [-0.03, -0.02, -0.14],
    camera: [-0.17, 0.46, 2.93],
    ship: [-0.68, 0.1, 0.4],
    meta: {
      shipYaw: -0.1,
      pilotStickerScaleMul: 0.84,
      pilotStickerOffsetZ: 0,
      shipNeonLightMul: 0.26,
    },
  },
  planetE: {
    lookAt: [-0.03, -0.17, 0.8],
    camera: [-0.76, -0.4, 1.7],
    ship: [1, -0.2, -1.13],
    meta: {
      pilotStickerScaleMul: 0.5,
      pilotStickerOffsetZ: 0,
      shipYaw: -0.5,
    },
  },
})

/** Portrait focus tuning for tablets. */
const FOCUS_OFFSETS_PORTRAIT = Object.freeze({
  planetA: {
    lookAt: [0.87, -0.65, 0.8],
    camera: [1.26, 0.66, 20.64],
    ship: [0.75, -0.16, 0.8],
    meta: {
      shipYaw: -0.35,
      shipRollWiggleScale: 0.5,
      shipRollBias: 0.2,
      pilotStickerScaleMul: 0.85,
      pilotStickerOffsetX: 0.1,
      pilotStickerOffsetY: 0,
      pilotStickerOffsetZ: 0,
      shipNeonLightMul: 0.22,
      shipGlassLightMul: 0.7,
    },
  },
  planetB: {
    lookAt: [0.09, -0.7, 0.69],
    camera: [-2.5, 0.6, 4.04],
    ship: [-1.16, -0.1, 2.22],
    meta: {
      shipYaw: -0.35,
      pilotStickerScaleMul: 0.9,
      pilotStickerOffsetX: -0.038,
    },
  },
  planetC: {
    lookAt: [0.13, -0.07, -0.11],
    camera: [1, -0.44, 2.2],
    ship: [0.4, -0.8, 0.7],
    meta: {
      shipGlowAttenuation: 0.4,
      pilotStickerScaleMul: 0.62,
      pilotStickerOffsetX: 0.03,
    },
  },
  planetD: {
    lookAt: [0.2, -0.6, 0.54],
    camera: [-1.57, 0.6, 3.93],
    ship: [-0.6, -0.1, 2.4],
    meta: {
      shipYaw: -0.42,
      pilotStickerScaleMul: 0.99,
      pilotStickerOffsetZ: 0,
      shipNeonLightMul: 0.26,
    },
  },
  planetE: {
    lookAt: [0.03, -0.6, -0.2],
    camera: [0.68, -0.05, 2.9],
    ship: [-0.06, -0.3, 0.8],
    meta: {
      pilotStickerScaleMul: 0.57,
      pilotStickerOffsetX: 0.08,
      pilotStickerOffsetY: -0.02,
    },  
  },
})

/** Portrait focus tuning for mobile (same initial values; tweak separately as needed). */
const FOCUS_OFFSETS_PORTRAIT_MOBILE = Object.freeze({
  planetA: {
    lookAt: [0.67, -0.2, 0.8],
    camera: [1.1, 0.26, 1.64],
    ship: [0.15, -0.46, 0.1],
    meta: {
      shipYaw: 0.25,
      shipRollWiggleScale: 0.5,
      shipRollBias: 0.2,
      pilotStickerScaleMul: 0.85,
      pilotStickerOffsetX: 0.1,
      pilotStickerOffsetY: 0,
      pilotStickerOffsetZ: 0,
      shipNeonLightMul: 0.22,
      shipGlassLightMul: 0.7,
    },
  },
  planetB: {
    lookAt: [0.09, -0.7, 0.69],
    camera: [0.7, 0.4, 4.04],
    ship: [0.6, -0.3, 2.22],
    meta: {
      shipYaw: -0.15,
      pilotStickerScaleMul: 0.9,
      pilotStickerOffsetX: -0.038,
    },
  },
  planetC: {
    lookAt: [0, -0.27, 0.11],
    camera: [0.6, -0.44, 2.2],
    ship: [0.4, -0.8, 0.7],
    meta: {
      shipGlowAttenuation: 0.4,
      pilotStickerScaleMul: 0.57,
      pilotStickerOffsetX: 0.03,
    },
  },
  planetD: {
    lookAt: [-0.2, -0.6, 0.54],
    camera: [-1.57, 0.2, 2.3],
    ship: [-0.8, -0.46, 1],
    meta: {
      shipYaw: -0.42,
      pilotStickerScaleMul: 0.99,
      pilotStickerOffsetZ: 0,
      shipNeonLightMul: 0.26,
    },
  },
  planetE: {
    lookAt: [0.03, -0.3, -0.2],
    camera: [0.68, -0.05, 2],
    ship: [0.4, -0.6, 0.8],
    meta: {
      pilotStickerScaleMul: 0.57,
      pilotStickerOffsetX: 0.08,
      pilotStickerOffsetY: -0.02,
    },
  },
})

const PLANET_POSITION_OFFSETS = Object.freeze({
  portraitMobile: {
    planetA: { x: -0.23, y: 0.57 }, // FinTech: up + closer to left edge
    planetB: { x: 0.2, y: 0.9 }, // Games: up
    planetC: { x: -0.26, y: 0.16 }, // Playable Ads: up
    planetD: { x: 0.1, y: 2.9 }, // SaaS: up + closer to right edge
    planetE: { x: 0.5, y: -0.44 }, // AR/VR: down
  },
  portraitTablet: {
    planetA: { x: -0.22, y: 0.18 },
    planetB: { x: 0.04, y: 0.1 },
    planetC: { x: -0.03, y: 0.11 },
    planetD: { x: 0.22, y: 0.13 },
    planetE: { x: 0, y: -0.1 },
  },
  default: {},
})

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function halfViewAtZ(z, aspect, fov = DEFAULT_FOV) {
  const distance = CAMERA_Z - z
  const halfH = Math.tan((fov * Math.PI) / 360) * distance
  return { halfH, halfW: halfH * aspect }
}

function createProfile(viewport) {
  const width = viewport?.width ?? 1440
  const height = viewport?.height ?? 900
  const aspect = viewport?.aspect ?? width / height
  const mobile = width < 700 || aspect < 0.78
  const isPortrait = aspect < 1
  const tablet = !mobile && isPortrait
  const isPortraitMobileTablet = mobile || tablet
  const focusCameraMulDesktop = mobile ? 1.16 : tablet ? 1.08 : 1
  const focusCameraMulPortrait = 1

  return {
    aspect,
    device: mobile ? 'mobile' : tablet ? 'tablet' : 'desktop',
    edgePad: mobile ? 0.2 : tablet ? 0.14 : 0.1,
    isPortraitMobileTablet,
    focusCameraMul: isPortraitMobileTablet ? focusCameraMulPortrait : focusCameraMulDesktop,
    planetScale: mobile ? 0.78 : tablet ? 0.9 : 1,
    sunScale: mobile ? 0.72 : tablet ? 0.86 : 1,
  }
}

function resolveSlot(slot, profile, radius) {
  const { halfH, halfW } = halfViewAtZ(slot.z, profile.aspect)
  const scaledRadius = radius * profile.planetScale
  const maxX = Math.max(scaledRadius * 0.45, halfW * (1 - profile.edgePad) - scaledRadius)
  const maxY = Math.max(scaledRadius * 0.45, halfH * (1 - profile.edgePad) - scaledRadius)

  return {
    x: clamp(slot.x * halfW, -maxX, maxX),
    y: clamp(slot.y * halfH, -maxY, maxY),
    z: slot.z,
    rotZ: slot.rotZ,
    scale: profile.planetScale,
  }
}

function add3(a, b, mul = 1) {
  return [a[0] + b[0] * mul, a[1] + b[1] * mul, a[2] + b[2] * mul]
}

function toArray(v) {
  return [v.x, v.y, v.z]
}

function createFocus(planetId, target, profile) {
  const focusOffsets = profile.isPortraitMobileTablet
    ? profile.device === 'mobile'
      ? FOCUS_OFFSETS_PORTRAIT_MOBILE
      : FOCUS_OFFSETS_PORTRAIT
    : FOCUS_OFFSETS_DESKTOP
  const offsets = focusOffsets[planetId]
  const anchor = toArray(target)
  const lookAt = add3(anchor, offsets.lookAt)
  const cameraPos = add3(lookAt, offsets.camera, profile.focusCameraMul)
  const shipPos = add3(lookAt, offsets.ship, profile.focusCameraMul)
  const shipYMul = 1
  shipPos[1] = lookAt[1] + (shipPos[1] - lookAt[1]) * shipYMul
  const meta = { ...offsets.meta }
  const out = { lookAt, cameraPos, shipPos, ...meta }
  /**
   * Portrait tablet: a straight idle→Playable Ads (planetC) path clips planetE (AR/VR).
   * Waypoint is closer to the camera (+Z) and farther right (+X); final shipPos unchanged.
   */
  if (planetId === 'planetC' && profile.isPortraitMobileTablet && profile.device === 'tablet') {
    out.shipWaypoint = add3(lookAt, [0.82, -0.18, 1.55])
  }
  return out
}

const PLANET_IDS_FOR_SUN = ['planetA', 'planetB', 'planetC', 'planetD', 'planetE']

function createSun(profile, planets) {
  const sunZ = -1.22
  const { halfH, halfW } = halfViewAtZ(sunZ, profile.aspect)
  const edge = 1 - profile.edgePad
  /** Strong upper-left: rim light reads cleanly above the galaxy tableau */
  const position = [
    clamp(-0.92 * halfW, -halfW * edge, halfW * edge),
    clamp(0.88 * halfH, -halfH * edge, halfH * edge),
    sunZ,
  ]
  let sx = 0
  let sy = 0
  let sz = 0
  for (const id of PLANET_IDS_FOR_SUN) {
    const p = planets[id].idle
    sx += p.x
    sy += p.y
    sz += p.z
  }
  const n = PLANET_IDS_FOR_SUN.length
  const target = [sx / n, sy / n, sz / n]

  return { position, target, scale: profile.sunScale }
}

export function createResponsiveSpaceLayout(viewport) {
  const profile = createProfile(viewport)
  const positionOffsetKey = profile.isPortraitMobileTablet
    ? profile.device === 'mobile'
      ? 'portraitMobile'
      : 'portraitTablet'
    : 'default'
  const positionOffsets = PLANET_POSITION_OFFSETS[positionOffsetKey] ?? PLANET_POSITION_OFFSETS.default
  const planets = Object.fromEntries(
    Object.entries(PLANET_SLOTS).map(([planetId, config]) => {
      const offset = positionOffsets[planetId] ?? { x: 0, y: 0 }
      const idle = resolveSlot(config.idle, profile, config.radius)
      const focus = resolveSlot(config.focus, profile, config.radius)
      idle.x += offset.x
      idle.y += offset.y
      focus.x += offset.x
      focus.y += offset.y
      return [planetId, { idle, focus }]
    }),
  )

  return {
    planets,
    focus: Object.fromEntries(
      Object.keys(PLANET_SLOTS).map((planetId) => [planetId, createFocus(planetId, planets[planetId].focus, profile)]),
    ),
    sun: createSun(profile, planets),
    cameraFov: DEFAULT_FOV,
  }
}

export const DEFAULT_SPACE_LAYOUT = createResponsiveSpaceLayout({ width: 1440, height: 900 })
