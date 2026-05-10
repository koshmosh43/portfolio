import * as THREE from 'three'

export const HERO_TRAIL_LEN = 64

/**
 * Written by Spaceship / SceneDirector each frame; wake reads trail + wakeStrength.
 */
export const heroShipCameraBridge = {
  shipWorld: new THREE.Vector3(),
  /** Legacy typing ratio (unused for flight; kept for tooling). */
  emerge01: 0,
  /** Linear 0..1 time along post-curtain hero flight. */
  heroFlightLinear01: 0,
  /** Eased 0..1 — ship path + camera settle share this phase. */
  heroFlightEase01: 0,
  wakeStrength: 0,
  valid: false,
  orbitActive: false,
  orbitAngle: 0,
  orbitTargetAngle: 0,
  orbitElapsed: 0,
  orbitDuration: 1.2,
  /** Ring buffer tail→head world positions for ion wake (filled when wake > 0). */
  trail: Array.from({ length: HERO_TRAIL_LEN }, () => new THREE.Vector3()),
  trailHead: 0,
  trailFilled: 0,
  /** SceneDirector: snap ship/camera without fly-in (late Canvas mount). */
  skipHeroCinematicOnce: false,
}

export function pushHeroTrail(worldPos) {
  const b = heroShipCameraBridge
  b.trail[b.trailHead].copy(worldPos)
  b.trailHead = (b.trailHead + 1) % HERO_TRAIL_LEN
  b.trailFilled = Math.min(HERO_TRAIL_LEN, b.trailFilled + 1)
}

export function resetHeroTrail() {
  const b = heroShipCameraBridge
  b.trailHead = 0
  b.trailFilled = 0
}

/** Ship idle rest at idleT=0 (sin terms zero); matches Spaceship idleRest baseline + desktop lift. */
export const HERO_CAM_SHIP_IDLE_NOMINAL = new THREE.Vector3(0.7, -0.25 + 0.34, -2)

/** World delta: nominal ship idle → default hero camera (0, 0, 4). */
export const HERO_CAM_CHASE_DELTA = new THREE.Vector3(
  -HERO_CAM_SHIP_IDLE_NOMINAL.x,
  -HERO_CAM_SHIP_IDLE_NOMINAL.y,
  4 - HERO_CAM_SHIP_IDLE_NOMINAL.z,
)
