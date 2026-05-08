/**
 * 3D value noise for CPU-side procedural planet textures.
 * Tuned to minimize per-sample cost: one short integer mix, no trigonometry.
 *
 * @see fbm3 — typical call volume ~1e5–1e7 during atlas generation; keep `hash3` lean.
 */

/**
 * [0,1) lattice sample. `x,y,z` are integer cell corners from `valueNoise3`;
 * `seed` may be fractional (fbm uses `seed + i * 19.37`).
 */
export function hash3(x, y, z, seed) {
  const xi = x | 0
  const yi = y | 0
  const zi = z | 0
  // SplitMix-style spread of float `seed` into 32 bits before xor
  const s = (seed * 1103515245.12345 + seed) | 0
  let h = (Math.imul(xi, 127) + Math.imul(yi, 311) + Math.imul(zi, 73) + s) | 0
  h = (h ^ (h << 13)) | 0
  h = (h ^ (h >>> 17)) | 0
  h = (h ^ (h << 5)) | 0
  h = Math.imul(h ^ (h >>> 16), 2246822519) >>> 0
  return h * 2.3283064365386963e-10
}

/** Trilinear value noise, interpolation inlined (avoids `lerp` call overhead in hot loop). */
export function valueNoise3(x, y, z, seed) {
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const z0 = Math.floor(z)
  const x1 = x0 + 1
  const y1 = y0 + 1
  const z1 = z0 + 1
  const sx = x - x0
  const sy = y - y0
  const sz = z - z0

  const n000 = hash3(x0, y0, z0, seed)
  const n100 = hash3(x1, y0, z0, seed)
  const n010 = hash3(x0, y1, z0, seed)
  const n110 = hash3(x1, y1, z0, seed)
  const n001 = hash3(x0, y0, z1, seed)
  const n101 = hash3(x1, y0, z1, seed)
  const n011 = hash3(x0, y1, z1, seed)
  const n111 = hash3(x1, y1, z1, seed)

  const ix00 = n000 + (n100 - n000) * sx
  const ix10 = n010 + (n110 - n010) * sx
  const ix01 = n001 + (n101 - n001) * sx
  const ix11 = n011 + (n111 - n011) * sx
  const iy0 = ix00 + (ix10 - ix00) * sy
  const iy1 = ix01 + (ix11 - ix01) * sy
  return iy0 + (iy1 - iy0) * sz
}

export function fbm3(x, y, z, seed, octaves = 5) {
  let value = 0
  let amplitude = 0.5
  let frequency = 1
  let norm = 0
  for (let i = 0; i < octaves; i += 1) {
    const f = frequency
    value += valueNoise3(x * f, y * f, z * f, seed + i * 19.37) * amplitude
    norm += amplitude
    amplitude *= 0.5
    frequency *= 2.03
  }
  return value / norm
}
