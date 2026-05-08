# Performance Baseline

Snapshot date: 2026-05-07

## Command

`npm run build`

## Current Result

- Build time: `~2.36s`
- Transformed modules: `643`
- Main app chunk: `dist/assets/index-C_Lafc6-.js` (`150.34 kB`, `49.14 kB gzip`)
- Largest vendor chunk: `dist/assets/three-CvZJ-m8b.js` (`719.05 kB`, `187.02 kB gzip`)

## Bundle Map

- App shell: `dist/assets/index-C_Lafc6-.js` (`150.34 kB`, `49.14 kB gzip`)
- Scene shell: `dist/assets/SpaceScene-C312KL1t.js` (`4.44 kB`, `1.76 kB gzip`)
- Scene chunks:
  - `dist/assets/scene-CosmicBackground-C0raTwSp.js` (`1.76 kB`, `0.90 kB gzip`)
  - `dist/assets/scene-ProceduralEnvironment-BrEag06E.js` (`2.05 kB`, `0.99 kB gzip`)
  - `dist/assets/scene-BurningSun-DCvePJnT.js` (`9.39 kB`, `3.15 kB gzip`)
  - `dist/assets/scene-DeepSpaceDecor-DuGE8x-i.js` (`30.44 kB`, `9.68 kB gzip`)
- Interaction chunks:
  - `dist/assets/Planets-DniUVX-3.js` (`70.71 kB`, `19.40 kB gzip`)
  - `dist/assets/Spaceship-D4Mc33-H.js` (`28.01 kB`, `8.94 kB gzip`)
  - `dist/assets/PlanetShowcasePanel-D9anGIJv.js` (`10.68 kB`, `3.78 kB gzip`)
- Vendor chunks:
  - `dist/assets/three-CvZJ-m8b.js` (`719.05 kB`, `187.02 kB gzip`)
  - `dist/assets/r3f-D0e8NdJ5.js` (`142.09 kB`, `46.22 kB gzip`)
  - `dist/assets/gsap-B5Zr7YxL.js` (`70.34 kB`, `27.76 kB gzip`)
  - `dist/assets/postprocessing-CxHyUmQz.js` (`66.09 kB`, `15.49 kB gzip`)

## Runtime Markers

Scene load/interactivity can be checked through `performance.mark` entries prefixed with `portfolio:scene`.

- `portfolio:scene:spaceSceneTreeMounted`
- `portfolio:scene:firstWebGlFrame`
- `portfolio:scene:interactiveSubtreeReady`
