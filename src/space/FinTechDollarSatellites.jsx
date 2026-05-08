import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'

const SAT_A_POS = [0.66, 0.03, 0.28]
const SAT_B_POS = [-0.64, -0.03, -0.42]

export function FinTechDollarSatellites({ satelliteRefs, assets }) {
  const orbitARef = useRef()
  const orbitBRef = useRef()

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (orbitARef.current) {
      orbitARef.current.rotation.y += 0.02
      orbitARef.current.rotation.x = 0.18 + Math.sin(t * 0.3 + 0.6) * 0.028
      orbitARef.current.rotation.z = 0.08 + Math.sin(t * 0.76 + 0.3) * 0.055
    }
    if (orbitBRef.current) {
      orbitBRef.current.rotation.y -= 0.0135
      orbitBRef.current.rotation.x = -0.24 + Math.sin(t * 0.32 + 1.4) * 0.03
      orbitBRef.current.rotation.z = -0.12 + Math.sin(t * 0.68 + 0.9) * 0.058
    }
    if (satelliteRefs[0]?.current) satelliteRefs[0].current.rotation.y += 0.026
    if (satelliteRefs[1]?.current) {
      satelliteRefs[1].current.rotation.y += 0.029
      satelliteRefs[1].current.rotation.z = Math.sin(t * 1.05 + 0.9) * 0.065
    }
  })

  return (
    <>
      <group ref={orbitARef} rotation={[0.18, 0, 0.08]}>
        <group position={SAT_A_POS}>
          <mesh ref={satelliteRefs[0]} castShadow receiveShadow>
            <sphereGeometry args={[0.085, 28, 30]} />
            <meshPhysicalMaterial
              color="#d7a7ff"
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
        </group>
      </group>

      <group ref={orbitBRef} rotation={[-0.24, Math.PI * 0.72, -0.12]}>
        <group position={SAT_B_POS}>
          <mesh ref={satelliteRefs[1]} castShadow receiveShadow>
            <sphereGeometry args={[0.1, 28, 34]} />
            <meshPhysicalMaterial
              color="#8ff3ff"
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
        </group>
      </group>
    </>
  )
}
