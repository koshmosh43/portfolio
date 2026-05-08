import { useRef } from 'react'

import { FINTECH_SATELLITE_COUNT } from './planetConstants'

function r() {
  return { current: null }
}

function indexRefSlot(arrRef, i) {
  return {
    get current() {
      return arrRef.current[i]
    },
    set current(v) {
      arrRef.current[i] = v
    },
  }
}

/**
 * Stable object graph for all planet meshes / groups. Uses plain `{ current }` mutators
 * (same contract as React refs) so we allocate once per `Planets` mount.
 */
export function usePlanetRefs() {
  const bagRef = useRef(null)
  if (bagRef.current === null) {
    const fintechDustGeomRefs = { current: Array.from({ length: FINTECH_SATELLITE_COUNT }, () => null) }
    const fintechDustWideGeomRefs = { current: Array.from({ length: FINTECH_SATELLITE_COUNT }, () => null) }
    const fintechDustCoreMatRefs = { current: Array.from({ length: FINTECH_SATELLITE_COUNT }, () => null) }
    const fintechDustSoftMatRefs = { current: Array.from({ length: FINTECH_SATELLITE_COUNT }, () => null) }
    const fintechTrailReadies = { current: Array.from({ length: FINTECH_SATELLITE_COUNT }, () => false) }

    const fintechCoreGeomRefSlots = Array.from({ length: FINTECH_SATELLITE_COUNT }, (_, i) =>
      indexRefSlot(fintechDustGeomRefs, i),
    )
    const fintechWideGeomRefSlots = Array.from({ length: FINTECH_SATELLITE_COUNT }, (_, i) =>
      indexRefSlot(fintechDustWideGeomRefs, i),
    )
    const fintechTrailReadySlots = Array.from({ length: FINTECH_SATELLITE_COUNT }, (_, i) =>
      indexRefSlot(fintechTrailReadies, i),
    )

    const fintechSatellite0 = r()
    const fintechSatellite1 = r()
    const fintechSatelliteRefs = [fintechSatellite0, fintechSatellite1]

    bagRef.current = {
      root: r(),
      planetAGroup: r(),
      planetBGroup: r(),
      planetCGroup: r(),
      planetDGroup: r(),
      planetEGroup: r(),
      planetDCloudField: r(),
      planetDCloudDarkField: r(),
      planetDSatelliteRing: r(),
      planetDCloudShellNear: r(),
      planetDCloudShellMid: r(),
      planetDCloudShellFar: r(),
      planetCCloudField: r(),
      planetECloudField: r(),
      moonPivot: r(),
      planetA: r(),
      planetB: r(),
      planetC: r(),
      planetD: r(),
      planetE: r(),
      moonOrbit: r(),
      moon: r(),
      moonGlow: r(),
      moonOrbitB: r(),
      moonB: r(),
      moonBGlow: r(),
      moonOrbitC: r(),
      moonC: r(),
      moonCGlow: r(),
      designMoonOrbitA: r(),
      designMoonOrbitB: r(),
      designMoonA: r(),
      designMoonB: r(),
      designMoonAGlow: r(),
      designMoonBGlow: r(),
      planetACloudField: r(),
      planetBCloudField: r(),
      moonDustGeom: r(),
      moonDustWideGeom: r(),
      moonDustCoreMat: r(),
      moonDustSoftMat: r(),
      moonBDustGeom: r(),
      moonBDustWideGeom: r(),
      moonBDustCoreMat: r(),
      moonBDustSoftMat: r(),
      moonCDustGeom: r(),
      moonCDustWideGeom: r(),
      moonCDustCoreMat: r(),
      moonCDustSoftMat: r(),
      moonSparkMat: r(),
      moonBSparkMat: r(),
      moonCSparkMat: r(),
      designMoonATrailGeom: r(),
      designMoonATrailWideGeom: r(),
      designMoonATrailCoreMat: r(),
      designMoonATrailSoftMat: r(),
      designMoonBTrailGeom: r(),
      designMoonBTrailWideGeom: r(),
      designMoonBTrailCoreMat: r(),
      designMoonBTrailSoftMat: r(),
      moonTrailReady: r(),
      moonBTrailReady: r(),
      moonCTrailReady: r(),
      designMoonATrailReady: r(),
      designMoonBTrailReady: r(),
      fintechSatelliteRefs,
      fintechDustGeomRefs,
      fintechDustWideGeomRefs,
      fintechDustCoreMatRefs,
      fintechDustSoftMatRefs,
      fintechTrailReadies,
      fintechCoreGeomRefSlots,
      fintechWideGeomRefSlots,
      fintechTrailReadySlots,
    }
  }
  return bagRef.current
}
