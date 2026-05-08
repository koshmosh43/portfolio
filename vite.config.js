import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/** GitHub Pages project site: https://<user>.github.io/<repo>/ */
const GITHUB_PAGES_BASE = '/portfolio/'

function publicBase() {
  if (process.env.VITE_BASE_PATH) {
    const b = process.env.VITE_BASE_PATH
    return b.endsWith('/') ? b : `${b}/`
  }
  return process.env.GITHUB_ACTIONS === 'true' ? GITHUB_PAGES_BASE : '/'
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const base = publicBase()

  return {
    base,
    plugins: [
      react(),
      {
        name: 'portfolio-base-in-html-and-fonts',
        transformIndexHtml(html) {
          const prefix = base === '/' ? '/' : base.endsWith('/') ? base : `${base}/`
          return html.replace(/%BASE_URL%/g, prefix)
        },
        transform(src, id) {
          if (!id.endsWith('.css')) return null
          if (!src.includes('url("/fonts/')) return null
          if (base === '/' || base === '') return null
          const root = base.endsWith('/') ? base.slice(0, -1) : base
          return src.replace(/url\("\/fonts\//g, `url("${root}/fonts/`)
        },
      },
    ],
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
  }
})
