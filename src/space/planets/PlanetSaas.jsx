import * as THREE from 'three'

import { SaasPlanetConstellation } from '../GamesPlanetConstellation'
import { PLANET_D_RING_BASE_ROT } from './planetConstants'
import { SmokeCloudCluster } from './SmokeCloudCluster'

export function PlanetSaas({
  layout,
  assets,
  refs,
  onSelectPlanet,
  onPlanetPointerOver,
  onPlanetPointerOut,
}) {
  const idle = layout.planets.planetD.idle
  return (
    <group
      ref={refs.planetDGroup}
      position={[idle.x, idle.y, idle.z]}
      scale={[idle.scale, idle.scale, idle.scale]}
      onClick={(event) => onSelectPlanet('planetD', event)}
      onPointerOver={onPlanetPointerOver}
      onPointerOut={onPlanetPointerOut}
    >
      <mesh ref={refs.planetD} castShadow receiveShadow>
        <sphereGeometry args={[0.5, 64, 64]} />
        <meshPhysicalMaterial
          color="#ffdbe6"
          map={assets.planetSaaSSurface.color}
          bumpMap={assets.planetSaaSSurface.bump}
          bumpScale={0.125}
          roughnessMap={assets.planetSaaSSurface.roughness}
          roughness={0.6}
          metalness={0}
          clearcoat={0}
          clearcoatRoughness={0.72}
          emissive="#2a0a0c"
          emissiveIntensity={0.005}
          envMapIntensity={0}
          specularIntensity={0}
        />
      </mesh>
      <group ref={refs.planetDCloudField}>
        {assets.planetDCloudBlobs.map((blob, i) => (
          <SmokeCloudCluster key={`d-cloud-${i}`} {...blob} texture={assets.cloudSpriteTex} />
        ))}
      </group>
      <group ref={refs.planetDCloudDarkField} scale={1.045}>
        {assets.planetDCloudDarkBlobs.map((blob, i) => (
          <SmokeCloudCluster key={`d-dark-cloud-${i}`} {...blob} texture={assets.cloudSpriteTex} />
        ))}
      </group>
      <group ref={refs.planetDSatelliteRing} position={[0, -0.05, -0.1]} rotation={PLANET_D_RING_BASE_ROT} scale={[1, 1, 0.48]}>
        <mesh castShadow receiveShadow>
          <ringGeometry args={[0.65, 0.94, 128]} />
          <meshPhysicalMaterial
            color="#3c1a24"
            roughness={0.84}
            metalness={0}
            envMapIntensity={0.14}
            specularIntensity={0.16}
            side={THREE.DoubleSide}
          />
        </mesh>
        <points frustumCulled={false}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[assets.planetDRingDust.positions, 3]} />
            <bufferAttribute attach="attributes-color" args={[assets.planetDRingDust.colors, 3]} />
          </bufferGeometry>
          <pointsMaterial
            map={assets.dustParticleTex}
            size={0.0072}
            sizeAttenuation
            transparent
            opacity={0.56}
            depthWrite={false}
            depthTest
            blending={THREE.NormalBlending}
            vertexColors
            toneMapped={false}
          />
        </points>
        <points frustumCulled={false}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[assets.planetDRingDust.positions, 3]} />
            <bufferAttribute attach="attributes-color" args={[assets.planetDRingDust.colors, 3]} />
          </bufferGeometry>
          <pointsMaterial
            map={assets.dustParticleTex}
            size={0.013}
            sizeAttenuation
            transparent
            opacity={0.24}
            depthWrite={false}
            depthTest
            blending={THREE.AdditiveBlending}
            vertexColors
            toneMapped={false}
          />
        </points>
        <points frustumCulled={false}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[assets.planetDRingDust.positions, 3]} />
            <bufferAttribute attach="attributes-color" args={[assets.planetDRingDust.colors, 3]} />
          </bufferGeometry>
          <pointsMaterial
            map={assets.dustParticleTex}
            size={0.004}
            sizeAttenuation
            transparent
            opacity={0.66}
            depthWrite={false}
            depthTest
            blending={THREE.AdditiveBlending}
            vertexColors
            toneMapped={false}
          />
        </points>
        <points frustumCulled={false}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[assets.planetDRingDust.positions, 3]} />
            <bufferAttribute attach="attributes-color" args={[assets.planetDRingDust.colors, 3]} />
          </bufferGeometry>
          <pointsMaterial
            map={assets.dustParticleTex}
            size={0.026}
            sizeAttenuation
            transparent
            opacity={0.06}
            depthWrite={false}
            depthTest
            blending={THREE.AdditiveBlending}
            vertexColors
            toneMapped={false}
          />
        </points>
      </group>
      <mesh ref={refs.planetDCloudShellNear} scale={1.028} castShadow={false} receiveShadow={false}>
        <sphereGeometry args={[0.5, 64, 64]} />
        <meshPhysicalMaterial
          map={assets.planetSaaSCloudTex.near}
          alphaMap={assets.planetSaaSCloudTex.near}
          color="#ffd6df"
          transparent
          opacity={0.28}
          alphaTest={0.055}
          side={THREE.DoubleSide}
          depthWrite={false}
          roughness={0.92}
          metalness={0}
          clearcoat={0}
          emissive="#48111f"
          emissiveIntensity={0.05}
          envMapIntensity={0.14}
          specularIntensity={0.12}
        />
      </mesh>
      <mesh ref={refs.planetDCloudShellMid} scale={1.05} castShadow={false} receiveShadow={false}>
        <sphereGeometry args={[0.5, 64, 64]} />
        <meshPhysicalMaterial
          map={assets.planetSaaSCloudTex.mid}
          alphaMap={assets.planetSaaSCloudTex.mid}
          color="#ffc0cf"
          transparent
          opacity={0.2}
          alphaTest={0.045}
          side={THREE.DoubleSide}
          depthWrite={false}
          roughness={0.96}
          metalness={0}
          clearcoat={0}
          emissive="#37101b"
          emissiveIntensity={0.036}
          envMapIntensity={0.14}
          specularIntensity={0.12}
        />
      </mesh>
      <mesh ref={refs.planetDCloudShellFar} scale={1.082} castShadow={false} receiveShadow={false}>
        <sphereGeometry args={[0.5, 56, 56]} />
        <meshPhysicalMaterial
          map={assets.planetSaaSCloudTex.far}
          alphaMap={assets.planetSaaSCloudTex.far}
          color="#ffb5c7"
          transparent
          opacity={0.14}
          alphaTest={0.035}
          side={THREE.DoubleSide}
          depthWrite={false}
          roughness={1}
          metalness={0}
          clearcoat={0}
          emissive="#2c0d16"
          emissiveIntensity={0.026}
          envMapIntensity={0.14}
          specularIntensity={0.12}
        />
      </mesh>
      <mesh scale={1.08} castShadow={false} receiveShadow={false}>
        <sphereGeometry args={[0.5, 44, 44]} />
        <meshPhysicalMaterial
          color="#fb7185"
          transparent
          opacity={0.13}
          transmission={0.58}
          thickness={0.22}
          roughness={1}
          metalness={0}
          clearcoat={0}
          depthWrite={false}
          side={THREE.BackSide}
          envMapIntensity={0.14}
          specularIntensity={0.12}
        />
      </mesh>
      <SaasPlanetConstellation />
    </group>
  )
}
