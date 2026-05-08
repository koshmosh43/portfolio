import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import '../materials/vortexMaterial'

export function Vortex() {
  const layerA = useRef()
  const layerB = useRef()
  const matA = useRef()
  const matB = useRef()

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (matA.current) {
      matA.current.uTime = t
      matA.current.uLayer = 0
    }
    if (matB.current) {
      matB.current.uTime = t * 1.08
      matB.current.uLayer = 1
    }

    if (layerA.current) {
      layerA.current.rotation.z = t * 0.09
      layerA.current.scale.setScalar(1 + Math.sin(t * 0.85) * 0.035)
    }

    if (layerB.current) {
      layerB.current.rotation.z = -t * 0.07
      layerB.current.scale.setScalar(1.07 + Math.sin(t * 0.62 + 0.7) * 0.045)
    }
  })

  return (
    <>
      <mesh ref={layerA} position={[0, 0, -10]} frustumCulled={false}>
        <planeGeometry args={[90, 52, 1, 1]} />
        {/* depthWrite off: shader uses alpha 1 on the full quad, so otherwise it masks Stars/Nebula by depth when the camera moves off-axis */}
        <vortexMaterial ref={matA} depthWrite={false} />
      </mesh>
      <mesh ref={layerB} position={[0, 0, -9.8]} frustumCulled={false}>
        <planeGeometry args={[96, 56, 1, 1]} />
        <vortexMaterial ref={matB} transparent opacity={0.5} depthWrite={false} />
      </mesh>
    </>
  )
}
