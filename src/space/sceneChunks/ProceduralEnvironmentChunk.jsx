import { useLayoutEffect } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { createNightGalaxyEquirectTexture } from '../../textures/createNightGalaxyEquirectTexture'

/**
 * Galaxy-style IBL: procedural equirect + PMREM — no HDR fetch, keeps cosmic reflections.
 */
export function ProceduralEnvironmentRoot({ intensity = 0.82, rotationY = 2.35 }) {
  const { gl, scene } = useThree()

  useLayoutEffect(() => {
    const sourceTex = createNightGalaxyEquirectTexture()
    const pmrem = new THREE.PMREMGenerator(gl)
    const rt = pmrem.fromEquirectangular(sourceTex)
    scene.environment = rt.texture
    scene.environmentIntensity = intensity
    scene.environmentRotation.y = rotationY
    sourceTex.dispose()
    pmrem.dispose()
    return () => {
      scene.environment = null
      rt.dispose()
    }
  }, [gl, scene, intensity, rotationY])

  return null
}
