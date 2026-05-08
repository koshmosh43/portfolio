import * as THREE from 'three'

import { FinTechDollarSatellites } from '../FinTechDollarSatellites'
import { FinTechPlanetConstellation } from '../GamesPlanetConstellation'
import { SmokeCloudCluster } from './SmokeCloudCluster'

export function PlanetFinTech({
  layout,
  assets,
  refs,
  onSelectPlanet,
  onPlanetPointerOver,
  onPlanetPointerOut,
}) {
  const idle = layout.planets.planetA.idle
  return (
    <group
      ref={refs.planetAGroup}
      position={[idle.x, idle.y, idle.z]}
      scale={[idle.scale, idle.scale, idle.scale]}
      onClick={(event) => onSelectPlanet('planetA', event)}
      onPointerOver={onPlanetPointerOver}
      onPointerOut={onPlanetPointerOut}
    >
      <mesh ref={refs.planetA} geometry={assets.planetAGrassGeometry} castShadow receiveShadow>
        <meshPhysicalMaterial
          color="#e9fff0"
          map={assets.planetDSurface.color}
          bumpMap={assets.planetDSurface.bump}
          bumpScale={0.095}
          envMapIntensity={0}
        />
      </mesh>
      <group ref={refs.planetACloudField}>
        {assets.planetACloudBlobs.map((blob, i) => (
          <SmokeCloudCluster key={`a-cloud-${i}`} {...blob} texture={assets.cloudSpriteTex} />
        ))}
      </group>
      <mesh scale={1.08} castShadow={false} receiveShadow={false}>
        <meshPhysicalMaterial
          color="#c8f5de"
          depthWrite={false}
          side={THREE.BackSide}
          envMapIntensity={0}
          specularIntensity={0}
        />
      </mesh>
      <FinTechPlanetConstellation />
      <FinTechDollarSatellites satelliteRefs={refs.fintechSatelliteRefs} assets={assets} />
    </group>
  )
}
