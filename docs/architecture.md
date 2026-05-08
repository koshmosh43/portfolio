# Architecture Overview

The project keeps a small feature-oriented shape: one app shell, two flow modules, shared config/UI, and the existing `space` rendering layer.

## Source Layout

- `src/App.jsx` - top-level composition, lazy boundaries, and app chrome.
- `src/features/portfolio/portfolioFlow.js` - portfolio state machine, timing effects, and selected showcase view.
- `src/features/spaceScene/sceneFlow.js` - scene warmup/deferred WebGL state machine.
- `src/shared/config` - static portfolio content.
- `src/shared/ui` - small reusable presentation primitives.
- `src/space` - R3F scene implementation and async scene chunks.

## Boundary Rules

- `App.jsx` coordinates features, but does not own transition logic.
- Feature modules expose one public flow file each; avoid nested `controllers/hooks/components` folders unless a feature becomes large enough to justify them.
- `shared` stays dependency-light and domain-neutral.
- `src/space/sceneChunks` is intentionally split by runtime cost, not by visual taxonomy.
