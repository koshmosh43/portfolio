import { useLayoutEffect, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'

function createCosmicBackgroundTexture() {
  const w = 512
  const h = 1024
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { alpha: false })
  const g = ctx.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, '#1a2233')
  g.addColorStop(0.12, '#151c2c')
  g.addColorStop(0.28, '#131a28')
  g.addColorStop(0.42, '#101824')
  g.addColorStop(0.52, '#121c2a')
  g.addColorStop(0.66, '#0e1522')
  g.addColorStop(0.82, '#0c111c')
  g.addColorStop(0.92, '#0a0e16')
  g.addColorStop(1, '#070910')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)

  const paintCloud = (x, y, rx, ry, color, alpha) => {
    ctx.save()
    ctx.translate(x * w, y * h)
    ctx.scale(rx * w, ry * h)
    const cloud = ctx.createRadialGradient(0, 0, 0, 0, 0, 1)
    cloud.addColorStop(0, color)
    cloud.addColorStop(0.38, color)
    cloud.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.globalAlpha = alpha
    ctx.fillStyle = cloud
    ctx.beginPath()
    ctx.arc(0, 0, 1, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  ctx.globalCompositeOperation = 'screen'
  paintCloud(0.28, 0.24, 0.52, 0.16, 'rgba(58, 76, 112, 1)', 0.055)
  paintCloud(0.74, 0.56, 0.58, 0.18, 'rgba(46, 64, 98, 1)', 0.04)
  paintCloud(0.46, 0.8, 0.42, 0.14, 'rgba(36, 58, 82, 1)', 0.032)

  ctx.globalCompositeOperation = 'multiply'
  paintCloud(0.42, 0.43, 0.68, 0.09, 'rgba(10, 12, 18, 1)', 0.2)
  paintCloud(0.68, 0.7, 0.52, 0.1, 'rgba(8, 10, 16, 1)', 0.14)
  ctx.globalCompositeOperation = 'source-over'

  const id = ctx.getImageData(0, 0, w, h)
  const d = id.data
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 6
    d[i] = Math.min(255, Math.max(0, d[i] + n))
    d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + n))
    d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + n))
  }
  ctx.putImageData(id, 0, 0)

  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.minFilter = THREE.LinearFilter
  tex.magFilter = THREE.LinearFilter
  tex.generateMipmaps = false
  tex.needsUpdate = true
  return tex
}

export function CosmicBackgroundRoot() {
  const { scene } = useThree()
  const map = useMemo(() => createCosmicBackgroundTexture(), [])
  useLayoutEffect(() => {
    const prev = scene.background
    scene.background = map
    return () => {
      scene.background = prev
      map.dispose()
    }
  }, [scene, map])
  return null
}
