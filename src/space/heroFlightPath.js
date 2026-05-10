import * as THREE from 'three'

/** Long hero fly-in after the Bieber curtain — ship + camera choreography. */
export const HERO_POST_CURTAIN_FLIGHT_S = 4.45

const _p0 = new THREE.Vector3()
const _p1 = new THREE.Vector3()
const _p2 = new THREE.Vector3()
const _p3 = new THREE.Vector3()
const _ctrl = new THREE.Vector3()

/**
 * Off-screen right / slightly toward camera — reads as “enters from the right edge”.
 */
export function setHeroCinematicShipStart(out, shipLift) {
  return out.set(3.65, -0.48 + shipLift * 0.82, 0.62)
}

/**
 * Cubic arc: cinematic start → classic idle anchor (0.7, -0.25+lift, -2).
 */
export function sampleHeroShipFlight(out, t01, shipLift) {
  const u = THREE.MathUtils.clamp(t01, 0, 1)
  setHeroCinematicShipStart(_p0, shipLift)
  _p3.set(0.7, -0.25 + shipLift, -2)
  _p1.copy(_p0).lerp(_p3, 0.34).add(_ctrl.set(-1.12, 0.68, -1.18))
  _p2.copy(_p3).add(_ctrl.set(0.32, 0.16, 0.48))
  const v = 1 - u
  const tt = u * u
  const vv = v * v
  out.copy(_p0).multiplyScalar(vv * v)
  out.addScaledVector(_p1, 3 * vv * u)
  out.addScaledVector(_p2, 3 * v * tt)
  out.addScaledVector(_p3, tt * u)
  return out
}

export function easeOutQuint(t) {
  return 1 - Math.pow(1 - THREE.MathUtils.clamp(t, 0, 1), 5)
}
