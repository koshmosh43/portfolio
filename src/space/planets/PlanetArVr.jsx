import * as THREE from 'three'

import { Design3DPlanetConstellation } from '../GamesPlanetConstellation'
import { REMOTE_MOON_TINT, REMOTE_SURFACE_TINT } from './planetConstants'
import { SmokeCloudCluster } from './SmokeCloudCluster'

export function PlanetArVr({
  layout,
  assets,
  refs,
  onSelectPlanet,
  onPlanetPointerOver,
  onPlanetPointerOut,
}) {
  const idle = layout.planets.planetE.idle
  return (
    <group
      ref={refs.planetEGroup}
      position={[idle.x, idle.y, idle.z]}
      scale={[idle.scale, idle.scale, idle.scale]}
      onClick={(event) => onSelectPlanet('planetE', event)}
      onPointerOver={onPlanetPointerOver}
      onPointerOut={onPlanetPointerOut}
    >
      <mesh ref={refs.planetE} geometry={assets.planetEGeometry} castShadow receiveShadow>
        <meshPhysicalMaterial
          color={REMOTE_SURFACE_TINT}
          map={assets.planetESurface.color}
          bumpMap={assets.planetESurface.bump}
          bumpScale={0.17}
          roughnessMap={assets.planetESurface.roughness}
          roughness={0.5}
          metalness={0}
          clearcoat={0}
          emissive="#000000"
          emissiveIntensity={0}
          envMapIntensity={0}
          specularIntensity={0}
          iridescence={0}
        />
      </mesh>
      <group ref={refs.planetECloudField}>
        {assets.planetECloudBlobs.map((blob, i) => (
          <SmokeCloudCluster key={`e-cloud-${i}`} {...blob} texture={assets.cloudSpriteTex} />
        ))}
      </group>
      <mesh scale={1.09} castShadow={false} receiveShadow={false}>
        <sphereGeometry args={[0.23, 40, 40]} />
        <meshPhysicalMaterial
          color="#9a6fa8"
          transparent
          opacity={0.056}
          transmission={0.38}
          thickness={0.18}
          roughness={1}
          metalness={0}
          clearcoat={0}
          depthWrite={false}
          side={THREE.BackSide}
          envMapIntensity={0}
          specularIntensity={0}
        />
      </mesh>
      <Design3DPlanetConstellation />

      <points frustumCulled={false} visible={false}>
        <bufferGeometry ref={refs.designMoonATrailWideGeom}>
          <bufferAttribute attach="attributes-position" args={[assets.designMoonATrailWidePositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[assets.designMoonATrailWideColors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={refs.designMoonATrailSoftMat}
          map={assets.dustParticleTex}
          transparent
          opacity={0.052}
          size={0.056}
          sizeAttenuation
          depthWrite={false}
          depthTest
          blending={THREE.NormalBlending}
          vertexColors
          toneMapped={false}
        />
      </points>
      <points frustumCulled={false} visible={false}>
        <bufferGeometry ref={refs.designMoonATrailGeom}>
          <bufferAttribute attach="attributes-position" args={[assets.designMoonATrailPositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[assets.designMoonATrailColors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={refs.designMoonATrailCoreMat}
          map={assets.dustParticleTex}
          transparent
          opacity={0.11}
          size={0.022}
          sizeAttenuation
          depthWrite={false}
          depthTest
          blending={THREE.AdditiveBlending}
          vertexColors
          toneMapped={false}
        />
      </points>
      <group ref={refs.designMoonOrbitA} rotation={[0.18, 0, 0.08]}>
        <group position={[0.52, 0.02, 0.2]}>
          <mesh ref={refs.designMoonA} castShadow receiveShadow>
            <sphereGeometry args={[0.085, 28, 28]} />
            <meshPhysicalMaterial
              color={REMOTE_MOON_TINT}
              map={assets.designMoonSurfaceA.color}
              bumpMap={assets.designMoonSurfaceA.bump}
              bumpScale={0.1}
              roughnessMap={assets.designMoonSurfaceA.roughness}
              roughness={0.78}
              metalness={0}
              clearcoat={0}
              emissive="#000000"
              emissiveIntensity={0}
              envMapIntensity={0}
              specularIntensity={0}
            />
          </mesh>
          <sprite ref={refs.designMoonAGlow} scale={[0.5, 0.5, 1]} visible={false}>
            <spriteMaterial
              map={assets.moonGlowSoftTex}
              color="#e9b2ff"
              transparent
              opacity={0.028}
              depthWrite={false}
              depthTest
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </sprite>
        </group>
      </group>

      <points frustumCulled={false} visible={false}>
        <bufferGeometry ref={refs.designMoonBTrailWideGeom}>
          <bufferAttribute attach="attributes-position" args={[assets.designMoonBTrailWidePositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[assets.designMoonBTrailWideColors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={refs.designMoonBTrailSoftMat}
          map={assets.dustParticleTex}
          transparent
          opacity={0.048}
          size={0.052}
          sizeAttenuation
          depthWrite={false}
          depthTest
          blending={THREE.NormalBlending}
          vertexColors
          toneMapped={false}
        />
      </points>
      <points frustumCulled={false} visible={false}>
        <bufferGeometry ref={refs.designMoonBTrailGeom}>
          <bufferAttribute attach="attributes-position" args={[assets.designMoonBTrailPositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[assets.designMoonBTrailColors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={refs.designMoonBTrailCoreMat}
          map={assets.dustParticleTex}
          transparent
          opacity={0.1}
          size={0.02}
          sizeAttenuation
          depthWrite={false}
          depthTest
          blending={THREE.AdditiveBlending}
          vertexColors
          toneMapped={false}
        />
      </points>
      <group ref={refs.designMoonOrbitB} rotation={[-0.24, Math.PI * 0.72, -0.12]}>
        <group position={[-0.64, -0.03, -0.42]}>
          <mesh ref={refs.designMoonB} castShadow receiveShadow>
            <sphereGeometry args={[0.068, 24, 24]} />
            <meshPhysicalMaterial
              color={REMOTE_MOON_TINT}
              map={assets.designMoonSurfaceB.color}
              bumpMap={assets.designMoonSurfaceB.bump}
              bumpScale={0.095}
              roughnessMap={assets.designMoonSurfaceB.roughness}
              roughness={0.8}
              metalness={0}
              clearcoat={0}
              emissive="#000000"
              emissiveIntensity={0}
              envMapIntensity={0}
              specularIntensity={0}
            />
          </mesh>
          <sprite ref={refs.designMoonBGlow} scale={[0.42, 0.42, 1]} visible={false}>
            <spriteMaterial
              map={assets.moonGlowSoftTex}
              color="#8df7ff"
              transparent
              opacity={0.025}
              depthWrite={false}
              depthTest
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </sprite>
        </group>
      </group>
    </group>
  )
}
