import { PlayableAdsPlanetConstellation } from '../GamesPlanetConstellation'
import { PLANET_BASE_ENVMAP_INTENSITY, PLANET_BASE_SPECULAR_INTENSITY, REMOTE_SURFACE_TINT } from './planetConstants'
import { SmokeCloudCluster } from './SmokeCloudCluster'

export function PlanetPlayableAds({
  layout,
  assets,
  refs,
  onSelectPlanet,
  onPlanetPointerOver,
  onPlanetPointerOut,
}) {
  const idle = layout.planets.planetC.idle
  return (
    <group
      ref={refs.planetCGroup}
      position={[idle.x, idle.y, idle.z]}
      scale={[idle.scale, idle.scale, idle.scale]}
      onClick={(event) => onSelectPlanet('planetC', event)}
      onPointerOver={onPlanetPointerOver}
      onPointerOut={onPlanetPointerOut}
    >
      <mesh ref={refs.planetC} geometry={assets.planetCMoonGeometry} castShadow receiveShadow>
        <meshPhysicalMaterial
          color={REMOTE_SURFACE_TINT}
          map={assets.planetCSurface.color}
          bumpMap={assets.planetCSurface.bump}
          bumpScale={0.165}
          displacementMap={assets.planetCSurface.displacement}
          displacementScale={0.138}
          displacementBias={-0.069}
          roughnessMap={assets.planetCSurface.roughness}
          roughness={0.68}
          metalness={0}
          clearcoat={0}
          emissive="#000000"
          emissiveIntensity={0}
          envMapIntensity={PLANET_BASE_ENVMAP_INTENSITY}
          specularIntensity={PLANET_BASE_SPECULAR_INTENSITY}
          iridescence={0}
        />
      </mesh>
      <group ref={refs.planetCCloudField} scale={1.06}>
        {assets.planetCCloudBlobs.map((blob, i) => (
          <SmokeCloudCluster key={`c-cloud-${i}`} {...blob} texture={assets.cloudSpriteTex} />
        ))}
      </group>
      <PlayableAdsPlanetConstellation />
    </group>
  )
}
