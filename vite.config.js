import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 800,
    /** Fewer eager preload edges for secondary chunks — improves “unused JS” on cold Lighthouse traces. */
    modulePreload: { polyfill: false },
    rollupOptions: {
      output: {
        manualChunks(id) {
          const sceneChunk = id.match(/\/src\/space\/sceneChunks\/([^/]+)\./)
          if (sceneChunk) {
            return `scene-${sceneChunk[1].replace(/Chunk$/, '')}`
          }
          if (id.includes('node_modules/three/examples')) return 'three-examples'
          if (id.includes('node_modules/three')) return 'three'
          if (id.includes('node_modules/@react-three/fiber')) return 'r3f'
          if (id.includes('node_modules/@react-three/postprocessing')) return 'r3f-post'
          if (id.includes('node_modules/postprocessing')) return 'postprocessing'
          if (id.includes('node_modules/gsap')) return 'gsap'
        },
      },
    },
  },
}))
