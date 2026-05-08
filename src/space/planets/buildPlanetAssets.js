import * as THREE from 'three'

import { getDustParticleTexture, getSoftGlowTexture } from '../planetTextures'
import {
  createCloudAlphaTexture,
  createMoonSurfaceTextures,
  createPlanetCloudLayerTextures,
  createPlayableMoonPlanetSurfaceTextures,
  createSassGrassPlanetSurfaceTextures,
  createTerrainSurfaceTextures,
  fillSaaSDustRingBuffers,
} from './planetProceduralTextures'
import { FINTECH_SATELLITE_COUNT, MOON_TRAIL_POINTS } from './planetConstants'
import {
  createFintechTrailPaletteSets,
  createSparkHeadPositions,
  createTrailColors,
} from './planetTrails'

const PLANET_A_CLOUD_BLOBS = Object.freeze([
  { position: [0.62, 0.18, 0.08], scale: [0.34, 0.22, 0.28], tint: '#dff5e8', speed: 0.13, seed: 0.7, alpha: 0.28, puffCount: 30 },
  { position: [-0.58, -0.12, 0.11], scale: [0.32, 0.21, 0.26], tint: '#c8edd6', speed: 0.11, seed: 1.2, alpha: 0.25, puffCount: 26 },
  { position: [0.14, -0.48, -0.06], scale: [0.26, 0.17, 0.22], tint: '#b8e5d0', speed: 0.1, seed: 2.1, alpha: 0.2, puffCount: 20 },
  { position: [-0.22, 0.43, -0.14], scale: [0.24, 0.16, 0.21], tint: '#e8f8f0', speed: 0.12, seed: 3.4, alpha: 0.21, puffCount: 20 },
  { position: [0.02, 0.05, 0.62], scale: [0.23, 0.15, 0.2], tint: '#d4f0e2', speed: 0.09, seed: 4.7, alpha: 0.18, puffCount: 18 },
  { position: [-0.42, 0.29, 0.36], scale: [0.28, 0.18, 0.24], tint: '#a8dcc4', speed: 0.095, seed: 5.6, alpha: 0.22, puffCount: 22 },
  { position: [0.38, -0.28, -0.42], scale: [0.27, 0.17, 0.23], tint: '#ecf8f2', speed: 0.105, seed: 5.9, alpha: 0.21, puffCount: 21 },
])

const PLANET_C_CLOUD_BLOBS = Object.freeze([
  { position: [0.72, 0.22, 0.12], scale: [0.38, 0.24, 0.32], tint: '#e8ecfc', speed: 0.12, seed: 402, alpha: 0.34, puffCount: 30 },
  { position: [-0.68, -0.14, 0.14], scale: [0.35, 0.22, 0.29], tint: '#d8def0', speed: 0.105, seed: 415, alpha: 0.32, puffCount: 28 },
  { position: [0.14, -0.58, -0.05], scale: [0.28, 0.18, 0.24], tint: '#e0e6f8', speed: 0.095, seed: 428, alpha: 0.3, puffCount: 22 },
  { position: [-0.24, 0.48, -0.14], scale: [0.26, 0.17, 0.22], tint: '#f0f2ff', speed: 0.11, seed: 439, alpha: 0.3, puffCount: 22 },
  { position: [0.04, 0.06, 0.74], scale: [0.25, 0.16, 0.21], tint: '#d0d8ee', speed: 0.086, seed: 441, alpha: 0.28, puffCount: 20 },
  { position: [-0.48, 0.34, 0.42], scale: [0.32, 0.2, 0.27], tint: '#dce2f6', speed: 0.09, seed: 452, alpha: 0.32, puffCount: 24 },
  { position: [0.44, -0.32, -0.48], scale: [0.3, 0.19, 0.26], tint: '#f4f6ff', speed: 0.1, seed: 463, alpha: 0.3, puffCount: 22 },
])

const PLANET_D_CLOUD_BLOBS = Object.freeze([
  { position: [0.58, 0.2, 0.1], scale: [0.34, 0.2, 0.28], tint: '#ffc1cc', speed: 0.13, seed: 20.1, alpha: 0.24, puffCount: 30 },
  { position: [-0.55, -0.1, 0.12], scale: [0.32, 0.19, 0.26], tint: '#f5a4b5', speed: 0.112, seed: 21.4, alpha: 0.22, puffCount: 28 },
  { position: [0.12, -0.45, -0.04], scale: [0.26, 0.15, 0.22], tint: '#f7b0bf', speed: 0.102, seed: 22.2, alpha: 0.2, puffCount: 22 },
  { position: [-0.2, 0.41, -0.12], scale: [0.24, 0.14, 0.2], tint: '#e992a8', speed: 0.12, seed: 23.5, alpha: 0.19, puffCount: 23 },
  { position: [0.04, 0.06, 0.6], scale: [0.23, 0.14, 0.2], tint: '#ffd1d9', speed: 0.092, seed: 24.8, alpha: 0.18, puffCount: 20 },
  { position: [-0.4, 0.28, 0.34], scale: [0.28, 0.16, 0.24], tint: '#df8ba1', speed: 0.096, seed: 25.6, alpha: 0.21, puffCount: 24 },
  { position: [0.36, -0.26, -0.4], scale: [0.27, 0.16, 0.22], tint: '#f4a8b7', speed: 0.106, seed: 25.9, alpha: 0.2, puffCount: 22 },
  { position: [0.18, 0.47, 0.22], scale: [0.29, 0.17, 0.24], tint: '#d9859b', speed: 0.114, seed: 26.7, alpha: 0.22, puffCount: 27 },
  { position: [-0.14, -0.36, 0.44], scale: [0.25, 0.15, 0.2], tint: '#ffd8de', speed: 0.1, seed: 27.3, alpha: 0.17, puffCount: 18 },
])

const PLANET_D_CLOUD_DARK_BLOBS = Object.freeze([
  { position: [0.62, 0.24, -0.02], scale: [0.44, 0.26, 0.35], tint: '#170a10', speed: 0.083, seed: 32.1, alpha: 0.24, puffCount: 36 },
  { position: [-0.58, -0.16, 0.2], scale: [0.42, 0.25, 0.33], tint: '#210d15', speed: 0.078, seed: 33.4, alpha: 0.23, puffCount: 34 },
  { position: [0.08, -0.5, 0.08], scale: [0.36, 0.21, 0.28], tint: '#12070c', speed: 0.073, seed: 34.2, alpha: 0.22, puffCount: 30 },
  { position: [-0.26, 0.46, -0.2], scale: [0.38, 0.23, 0.3], tint: '#2a111a', speed: 0.085, seed: 35.5, alpha: 0.24, puffCount: 32 },
  { position: [0.0, 0.1, 0.72], scale: [0.32, 0.19, 0.24], tint: '#1b0b11', speed: 0.071, seed: 36.8, alpha: 0.2, puffCount: 26 },
  { position: [-0.42, 0.32, 0.38], scale: [0.37, 0.22, 0.29], tint: '#30131d', speed: 0.077, seed: 37.6, alpha: 0.22, puffCount: 31 },
  { position: [0.4, -0.28, -0.46], scale: [0.39, 0.23, 0.3], tint: '#1a0a10', speed: 0.081, seed: 38.9, alpha: 0.24, puffCount: 33 },
])

const PLANET_E_CLOUD_BLOBS = Object.freeze([
  { position: [0.48, 0.14, 0.08], scale: [0.25, 0.15, 0.2], tint: '#f5d7f1', speed: 0.122, seed: 1001, alpha: 0.17, puffCount: 20 },
  { position: [-0.42, -0.12, 0.1], scale: [0.21, 0.13, 0.17], tint: '#c2eef2', speed: 0.11, seed: 1002, alpha: 0.15, puffCount: 17 },
  { position: [0.08, -0.42, -0.06], scale: [0.17, 0.11, 0.14], tint: '#f2dfbf', speed: 0.102, seed: 1003, alpha: 0.14, puffCount: 14 },
  { position: [-0.14, 0.34, -0.12], scale: [0.18, 0.11, 0.15], tint: '#d7d0ec', speed: 0.116, seed: 1004, alpha: 0.145, puffCount: 14 },
])

const PLANET_B_CLOUD_BLOBS = Object.freeze([
  { position: [0.73, -0.08, 0.14], scale: [0.36, 0.24, 0.3], tint: '#e8f7ff', speed: 0.1, seed: 6.1, alpha: 0.27, puffCount: 30 },
  { position: [-0.68, 0.15, 0.06], scale: [0.32, 0.22, 0.28], tint: '#dff2ff', speed: 0.09, seed: 7.4, alpha: 0.24, puffCount: 26 },
  { position: [0.18, 0.58, -0.16], scale: [0.27, 0.18, 0.23], tint: '#f2fbff', speed: 0.12, seed: 8.3, alpha: 0.22, puffCount: 22 },
  { position: [-0.09, -0.62, -0.1], scale: [0.29, 0.19, 0.24], tint: '#d7edff', speed: 0.08, seed: 9.5, alpha: 0.2, puffCount: 21 },
  { position: [0.02, 0.02, 0.78], scale: [0.24, 0.16, 0.21], tint: '#e5f4ff', speed: 0.1, seed: 10.1, alpha: 0.19, puffCount: 18 },
  { position: [-0.04, -0.05, -0.82], scale: [0.22, 0.15, 0.19], tint: '#d1e8ff', speed: 0.07, seed: 11.4, alpha: 0.18, puffCount: 17 },
  { position: [0.46, 0.31, -0.46], scale: [0.28, 0.18, 0.24], tint: '#ebf8ff', speed: 0.094, seed: 11.9, alpha: 0.21, puffCount: 20 },
  { position: [-0.52, -0.27, 0.52], scale: [0.3, 0.2, 0.25], tint: '#dcefff', speed: 0.085, seed: 12.6, alpha: 0.21, puffCount: 20 },
])

function buildPlanetDRingDust(sunAzimuth) {
  const count = 88000
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  fillSaaSDustRingBuffers(count, 90210, positions, colors, sunAzimuth)
  return { positions, colors }
}

function makeSphereGeometry(radius, w, h) {
  const g = new THREE.SphereGeometry(radius, w, h)
  g.computeTangents()
  return g
}

/**
 * All GPU-heavy planet data in one place. Call from a single `useMemo` keyed by texture resolution.
 */
export function buildPlanetAssets({ terrainW, terrainH, moonW, moonH, sunAzimuth }) {
  const planetBSurface = createTerrainSurfaceTextures({
    terrainW,
    terrainH,
    seed: 33,
    deepSea: '#1656a8',
    shallowSea: '#49d0ff',
    plains: '#baa57a',
    forest: '#26a86d',
    mountain: '#7f7a73',
    snow: '#eff3ff',
    seaLevel: 0.43,
    forestLevel: 0.63,
    mountainLevel: 0.81,
    polarStrength: 0.58,
  })

  const planetSaaSSurface = createTerrainSurfaceTextures({
    terrainW,
    terrainH,
    seed: 823,
    deepSea: '#2a0c1a',
    shallowSea: '#7d184a',
    plains: '#f7a4be',
    forest: '#e44579',
    mountain: '#a32052',
    snow: '#ffe7f0',
    seaLevel: 0.34,
    forestLevel: 0.59,
    mountainLevel: 0.78,
    polarStrength: 0.36,
  })
  const planetSaaSCloudTex = createPlanetCloudLayerTextures(812)
  const planetCSurface = createPlayableMoonPlanetSurfaceTextures({ seed: 407, moonW, moonH })
  const planetCMoonGeometry = makeSphereGeometry(0.44, 96, 96)
  const planetDSurface = createSassGrassPlanetSurfaceTextures({ seed: 531, moonW, moonH })
  const planetESurface = createTerrainSurfaceTextures({
    terrainW,
    terrainH,
    seed: 947,
    deepSea: '#101a7a',
    shallowSea: '#19c8ff',
    plains: '#ffb347',
    forest: '#ff4fd8',
    mountain: '#6b3cff',
    snow: '#fff0d4',
    seaLevel: 0.38,
    forestLevel: 0.57,
    mountainLevel: 0.75,
    polarStrength: 0.32,
  })
  const planetEGeometry = makeSphereGeometry(0.23, 80, 80)
  const planetAGrassGeometry = makeSphereGeometry(0.5, 80, 80)

  const dustParticleTex = getDustParticleTexture()
  const moonGlowSoftTex = getSoftGlowTexture('#a9c7ff')
  const moonTrailPositions = new Float32Array(MOON_TRAIL_POINTS * 3)
  const moonTrailColors = createTrailColors([0.42, 0.64, 0.84], [0.95, 1, 1])
  const moonTrailWidePositions = new Float32Array(MOON_TRAIL_POINTS * 3)
  const moonTrailWideColors = createTrailColors([0.015, 0.03, 0.05], [0.38, 0.65, 0.82], 2.8)
  const moonBTrailPositions = new Float32Array(MOON_TRAIL_POINTS * 3)
  const moonBTrailWidePositions = new Float32Array(MOON_TRAIL_POINTS * 3)
  const moonBTrailColors = createTrailColors([0.55, 0.3, 0.16], [1, 0.86, 0.72])
  const moonBTrailWideColors = createTrailColors([0.03, 0.02, 0.015], [0.72, 0.42, 0.24], 2.8)
  const moonCTrailPositions = new Float32Array(MOON_TRAIL_POINTS * 3)
  const moonCTrailWidePositions = new Float32Array(MOON_TRAIL_POINTS * 3)
  const moonCTrailColors = createTrailColors([0.36, 0.46, 0.95], [0.86, 0.92, 1])
  const moonCTrailWideColors = createTrailColors([0.015, 0.02, 0.045], [0.45, 0.56, 0.9], 2.8)
  const designMoonATrailPositions = new Float32Array(MOON_TRAIL_POINTS * 3)
  const designMoonATrailWidePositions = new Float32Array(MOON_TRAIL_POINTS * 3)
  const designMoonATrailColors = createTrailColors([0.54, 0.22, 0.78], [1, 0.82, 0.98])
  const designMoonATrailWideColors = createTrailColors([0.03, 0.015, 0.045], [0.54, 0.3, 0.78], 2.8)
  const designMoonBTrailPositions = new Float32Array(MOON_TRAIL_POINTS * 3)
  const designMoonBTrailWidePositions = new Float32Array(MOON_TRAIL_POINTS * 3)
  const designMoonBTrailColors = createTrailColors([0.1, 0.74, 0.88], [0.88, 1, 1])
  const designMoonBTrailWideColors = createTrailColors([0.01, 0.04, 0.05], [0.28, 0.88, 0.98], 2.8)
  const fintechTrailPositions = Array.from({ length: FINTECH_SATELLITE_COUNT }, () => new Float32Array(MOON_TRAIL_POINTS * 3))
  const fintechTrailWidePositions = Array.from({ length: FINTECH_SATELLITE_COUNT }, () => new Float32Array(MOON_TRAIL_POINTS * 3))
  const fintechTrailPalettes = createFintechTrailPaletteSets()
  const moonSparkPositions = createSparkHeadPositions(16, 0.07)
  const moonBSparkPositions = createSparkHeadPositions(14, 0.06)
  const moonCSparkPositions = createSparkHeadPositions(12, 0.05)
  const moonSurfaceA = createMoonSurfaceTextures({
    moonW,
    moonH,
    seed: 101,
    baseColor: '#b8bfcd',
    darkColor: '#7e8593',
    lightColor: '#e2e7f1',
  })
  const moonSurfaceB = createMoonSurfaceTextures({
    moonW,
    moonH,
    seed: 202,
    baseColor: '#c39f88',
    darkColor: '#8c6f5f',
    lightColor: '#e8c9b0',
  })
  const moonSurfaceC = createMoonSurfaceTextures({
    moonW,
    moonH,
    seed: 303,
    baseColor: '#a9b8dd',
    darkColor: '#7383b1',
    lightColor: '#dbe4ff',
  })
  const designMoonSurfaceA = createMoonSurfaceTextures({
    moonW,
    moonH,
    seed: 880,
    baseColor: '#d9a5ff',
    darkColor: '#6b2c8d',
    lightColor: '#ffe8ff',
  })
  const designMoonSurfaceB = createMoonSurfaceTextures({
    moonW,
    moonH,
    seed: 881,
    baseColor: '#96f8ff',
    darkColor: '#246a7a',
    lightColor: '#eaffff',
  })
  const cloudSpriteTex = createCloudAlphaTexture()
  const planetDRingDust = buildPlanetDRingDust(sunAzimuth)

  return {
    planetBSurface,
    planetSaaSSurface,
    planetSaaSCloudTex,
    planetCSurface,
    planetCMoonGeometry,
    planetDSurface,
    planetESurface,
    planetEGeometry,
    planetAGrassGeometry,
    dustParticleTex,
    moonGlowSoftTex,
    moonTrailPositions,
    moonTrailColors,
    moonTrailWidePositions,
    moonTrailWideColors,
    moonBTrailPositions,
    moonBTrailWidePositions,
    moonBTrailColors,
    moonBTrailWideColors,
    moonCTrailPositions,
    moonCTrailWidePositions,
    moonCTrailColors,
    moonCTrailWideColors,
    designMoonATrailPositions,
    designMoonATrailWidePositions,
    designMoonATrailColors,
    designMoonATrailWideColors,
    designMoonBTrailPositions,
    designMoonBTrailWidePositions,
    designMoonBTrailColors,
    designMoonBTrailWideColors,
    fintechTrailPositions,
    fintechTrailWidePositions,
    fintechTrailPalettes,
    moonSparkPositions,
    moonBSparkPositions,
    moonCSparkPositions,
    moonSurfaceA,
    moonSurfaceB,
    moonSurfaceC,
    designMoonSurfaceA,
    designMoonSurfaceB,
    cloudSpriteTex,
    planetDRingDust,
    planetACloudBlobs: PLANET_A_CLOUD_BLOBS,
    planetCCloudBlobs: PLANET_C_CLOUD_BLOBS,
    planetDCloudBlobs: PLANET_D_CLOUD_BLOBS,
    planetDCloudDarkBlobs: PLANET_D_CLOUD_DARK_BLOBS,
    planetECloudBlobs: PLANET_E_CLOUD_BLOBS,
    planetBCloudBlobs: PLANET_B_CLOUD_BLOBS,
  }
}
