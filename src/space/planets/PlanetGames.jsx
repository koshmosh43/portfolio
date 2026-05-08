import * as THREE from 'three'

import { GamesPlanetConstellation } from '../GamesPlanetConstellation'
import { REMOTE_MOON_TINT, REMOTE_SURFACE_TINT } from './planetConstants'
import { SmokeCloudCluster } from './SmokeCloudCluster'

export function PlanetGames({
  layout,
  assets,
  refs,
  onSelectPlanet,
  onPlanetPointerOver,
  onPlanetPointerOut,
}) {
  const idle = layout.planets.planetB.idle
  return (
    <group
      ref={refs.planetBGroup}
      position={[idle.x, idle.y, idle.z]}
      scale={[idle.scale, idle.scale, idle.scale]}
      onClick={(event) => onSelectPlanet('planetB', event)}
      onPointerOver={onPlanetPointerOver}
      onPointerOut={onPlanetPointerOut}
    >
      <mesh ref={refs.planetB} castShadow receiveShadow>
        <sphereGeometry args={[0.62, 48, 48]} />
        <meshPhysicalMaterial
          color={REMOTE_SURFACE_TINT}
          map={assets.planetBSurface.color}
          bumpMap={assets.planetBSurface.bump}
          bumpScale={0.1}
          roughnessMap={assets.planetBSurface.roughness}
          roughness={0.72}
          metalness={0}
          clearcoat={0}
          emissive="#000000"
          emissiveIntensity={0}
          envMapIntensity={0}
          specularIntensity={0}
        />
      </mesh>
      <mesh scale={1.07} castShadow={false} receiveShadow={false}>
        <sphereGeometry args={[0.62, 44, 44]} />
        <meshPhysicalMaterial
          color="#6ba3b5"
          transparent
          opacity={0.042}
          transmission={0.34}
          thickness={0.26}
          roughness={1}
          metalness={0}
          clearcoat={0}
          depthWrite={false}
          side={THREE.BackSide}
          envMapIntensity={0}
          specularIntensity={0}
        />
      </mesh>
      <group ref={refs.planetBCloudField}>
        {assets.planetBCloudBlobs.map((blob, i) => (
          <SmokeCloudCluster key={`b-cloud-${i}`} {...blob} texture={assets.cloudSpriteTex} />
        ))}
      </group>
      <GamesPlanetConstellation />
      <points frustumCulled={false} visible={false}>
        <bufferGeometry ref={refs.moonDustWideGeom}>
          <bufferAttribute attach="attributes-position" args={[assets.moonTrailWidePositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[assets.moonTrailWideColors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={refs.moonDustSoftMat}
          map={assets.dustParticleTex}
          transparent
          opacity={0.07}
          size={0.09}
          sizeAttenuation
          depthWrite={false}
          depthTest
          blending={THREE.NormalBlending}
          vertexColors
          toneMapped={false}
        />
      </points>
      <points frustumCulled={false} visible={false}>
        <bufferGeometry ref={refs.moonDustGeom}>
          <bufferAttribute attach="attributes-position" args={[assets.moonTrailPositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[assets.moonTrailColors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={refs.moonDustCoreMat}
          map={assets.dustParticleTex}
          transparent
          opacity={0.17}
          size={0.036}
          sizeAttenuation
          depthWrite={false}
          depthTest
          blending={THREE.AdditiveBlending}
          vertexColors
          toneMapped={false}
        />
      </points>

      <group ref={refs.moonPivot}>
        <group ref={refs.moonOrbit}>
          <group position={[0.88, 0, 0]}>
            <mesh ref={refs.moon} castShadow receiveShadow>
              <sphereGeometry args={[0.16, 40, 40]} />
              <meshPhysicalMaterial
                color={REMOTE_MOON_TINT}
                map={assets.moonSurfaceA.color}
                bumpMap={assets.moonSurfaceA.bump}
                bumpScale={0.11}
                roughnessMap={assets.moonSurfaceA.roughness}
                roughness={0.84}
                metalness={0}
                clearcoat={0}
                emissive="#000000"
                emissiveIntensity={0}
                envMapIntensity={0}
                specularIntensity={0}
              />
            </mesh>
            <sprite ref={refs.moonGlow} scale={[0.92, 0.92, 1]} visible={false}>
              <spriteMaterial
                map={assets.moonGlowSoftTex}
                color="#9dc0ff"
                transparent
                opacity={0.028}
                depthWrite={false}
                depthTest
                blending={THREE.AdditiveBlending}
                toneMapped={false}
              />
            </sprite>
            <points visible={false}>
              <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[assets.moonSparkPositions, 3]} />
              </bufferGeometry>
              <pointsMaterial
                ref={refs.moonSparkMat}
                map={assets.dustParticleTex}
                color="#dff4ff"
                transparent
                opacity={0.08}
                size={0.016}
                sizeAttenuation
                depthWrite={false}
                depthTest
                blending={THREE.AdditiveBlending}
                toneMapped={false}
              />
            </points>
          </group>
        </group>
      </group>
      <points frustumCulled={false} visible={false}>
        <bufferGeometry ref={refs.moonBDustWideGeom}>
          <bufferAttribute attach="attributes-position" args={[assets.moonBTrailWidePositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[assets.moonBTrailWideColors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={refs.moonBDustSoftMat}
          map={assets.dustParticleTex}
          transparent
          opacity={0.055}
          size={0.068}
          sizeAttenuation
          depthWrite={false}
          depthTest
          blending={THREE.NormalBlending}
          vertexColors
          toneMapped={false}
        />
      </points>
      <points frustumCulled={false} visible={false}>
        <bufferGeometry ref={refs.moonBDustGeom}>
          <bufferAttribute attach="attributes-position" args={[assets.moonBTrailPositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[assets.moonBTrailColors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={refs.moonBDustCoreMat}
          map={assets.dustParticleTex}
          transparent
          opacity={0.135}
          size={0.03}
          sizeAttenuation
          depthWrite={false}
          depthTest
          blending={THREE.AdditiveBlending}
          vertexColors
          toneMapped={false}
        />
      </points>
      <group ref={refs.moonOrbitB}>
        <group position={[-1.28, 0, 0]}>
          <mesh ref={refs.moonB} castShadow receiveShadow>
            <sphereGeometry args={[0.12, 34, 34]} />
            <meshPhysicalMaterial
              color={REMOTE_MOON_TINT}
              map={assets.moonSurfaceB.color}
              bumpMap={assets.moonSurfaceB.bump}
              bumpScale={0.1}
              roughnessMap={assets.moonSurfaceB.roughness}
              roughness={0.88}
              metalness={0}
              clearcoat={0}
              emissive="#000000"
              emissiveIntensity={0}
              envMapIntensity={0}
              specularIntensity={0}
            />
          </mesh>
          <sprite ref={refs.moonBGlow} scale={[0.68, 0.68, 1]} visible={false}>
            <spriteMaterial
              map={assets.moonGlowSoftTex}
              color="#ffc49a"
              transparent
              opacity={0.025}
              depthWrite={false}
              depthTest
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </sprite>
          <points visible={false}>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[assets.moonBSparkPositions, 3]} />
            </bufferGeometry>
            <pointsMaterial
              ref={refs.moonBSparkMat}
              map={assets.dustParticleTex}
              color="#ffd7b6"
              transparent
              opacity={0.07}
              size={0.013}
              sizeAttenuation
              depthWrite={false}
              depthTest
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </points>
        </group>
      </group>
      <points frustumCulled={false} visible={false}>
        <bufferGeometry ref={refs.moonCDustWideGeom}>
          <bufferAttribute attach="attributes-position" args={[assets.moonCTrailWidePositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[assets.moonCTrailWideColors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={refs.moonCDustSoftMat}
          map={assets.dustParticleTex}
          transparent
          opacity={0.052}
          size={0.058}
          sizeAttenuation
          depthWrite={false}
          depthTest
          blending={THREE.NormalBlending}
          vertexColors
          toneMapped={false}
        />
      </points>
      <points frustumCulled={false} visible={false}>
        <bufferGeometry ref={refs.moonCDustGeom}>
          <bufferAttribute attach="attributes-position" args={[assets.moonCTrailPositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[assets.moonCTrailColors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          ref={refs.moonCDustCoreMat}
          map={assets.dustParticleTex}
          transparent
          opacity={0.12}
          size={0.023}
          sizeAttenuation
          depthWrite={false}
          depthTest
          blending={THREE.AdditiveBlending}
          vertexColors
          toneMapped={false}
        />
      </points>
      <group ref={refs.moonOrbitC}>
        <group position={[1.22, 0, -1.22]}>
          <mesh ref={refs.moonC} castShadow receiveShadow>
            <sphereGeometry args={[0.085, 28, 28]} />
            <meshPhysicalMaterial
              color={REMOTE_MOON_TINT}
              map={assets.moonSurfaceC.color}
              bumpMap={assets.moonSurfaceC.bump}
              bumpScale={0.095}
              roughnessMap={assets.moonSurfaceC.roughness}
              roughness={0.8}
              metalness={0}
              clearcoat={0}
              emissive="#000000"
              emissiveIntensity={0}
              envMapIntensity={0}
              specularIntensity={0}
            />
          </mesh>
          <sprite ref={refs.moonCGlow} scale={[0.54, 0.54, 1]} visible={false}>
            <spriteMaterial
              map={assets.moonGlowSoftTex}
              color="#9ec1ff"
              transparent
              opacity={0.024}
              depthWrite={false}
              depthTest
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </sprite>
          <points visible={false}>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[assets.moonCSparkPositions, 3]} />
            </bufferGeometry>
            <pointsMaterial
              ref={refs.moonCSparkMat}
              map={assets.dustParticleTex}
              color="#c9d6ff"
              transparent
              opacity={0.06}
              size={0.011}
              sizeAttenuation
              depthWrite={false}
              depthTest
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </points>
        </group>
      </group>
    </group>
  )
}
