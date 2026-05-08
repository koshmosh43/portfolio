import * as THREE from 'three'

export function lerpPlanetGroup(groupRef, target, speed = 0.06) {
  const group = groupRef.current
  if (!group || !target) return

  group.position.x = THREE.MathUtils.lerp(group.position.x, target.x, speed)
  group.position.y = THREE.MathUtils.lerp(group.position.y, target.y, speed)
  group.position.z = THREE.MathUtils.lerp(group.position.z, target.z, speed)
  group.rotation.z = THREE.MathUtils.lerp(group.rotation.z, target.rotZ, speed)
  group.scale.setScalar(THREE.MathUtils.lerp(group.scale.x, target.scale, speed))
}

/** CanvasTexture UV scroll — keeps fractional offset in [0, 1) */
export function wrapTextureScroll(x) {
  return ((x % 1) + 1) % 1
}
