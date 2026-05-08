/**
 * Random points on a spherical shell, projected into camera-facing depth range.
 */
export function buildSphereShellPoints(count, radiusMin, radiusMax, zMin, zSpread) {
  const data = new Float32Array(count * 3)
  for (let i = 0; i < count; i += 1) {
    const radius = radiusMin + Math.random() * (radiusMax - radiusMin)
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos((Math.random() - 0.5) * 2)
    data[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
    data[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
    data[i * 3 + 2] = zMin - Math.random() * zSpread
  }
  return data
}

/**
 * Same distribution as buildSphereShellPoints, plus twinkle attributes for GPU shaders.
 * @param {object} [opts]
 * @param {number} [opts.twinkleChance] — fraction of stars that twinkle strongly
 * @param {number} [opts.speedMul] — scales aSpeed
 */
export function buildStarShellLayer(count, radiusMin, radiusMax, zMin, zSpread, opts = {}) {
  const twinkleChance = opts.twinkleChance ?? 0.12
  const speedMul = opts.speedMul ?? 1
  const positions = new Float32Array(count * 3)
  const aTwinkle = new Float32Array(count)
  const aPhase = new Float32Array(count)
  const aSpeed = new Float32Array(count)

  for (let i = 0; i < count; i += 1) {
    const radius = radiusMin + Math.random() * (radiusMax - radiusMin)
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos((Math.random() - 0.5) * 2)
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
    positions[i * 3 + 2] = zMin - Math.random() * zSpread

    aPhase[i] = Math.random() * Math.PI * 2
    aSpeed[i] = (0.4 + Math.random() * 2.0) * speedMul

    if (Math.random() < twinkleChance) {
      aTwinkle[i] = 0.55 + Math.random() * 0.45
    } else {
      aTwinkle[i] = Math.random() * 0.06
    }
  }

  return { positions, aTwinkle, aPhase, aSpeed }
}
