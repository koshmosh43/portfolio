import test from 'node:test'
import assert from 'node:assert/strict'
import {
  sceneInitialState,
  sceneStages,
  sceneTransition,
} from '../src/features/spaceScene/sceneFlow.js'

test('scene machine warms chunks before 3d stage', () => {
  const warming = sceneTransition(sceneInitialState, { type: 'WARM_START' })
  const warmed = sceneTransition(warming, { type: 'CHUNKS_WARMED' })

  assert.equal(warming.stage, sceneStages.warming)
  assert.equal(warmed.chunksWarmed, true)
  assert.equal(warmed.deferred3d, false)
})

test('scene machine reaches ready stage when deferred gate opens', () => {
  const ready = sceneTransition(sceneInitialState, { type: 'DEFERRED_3D_READY' })
  assert.equal(ready.stage, sceneStages.ready)
  assert.equal(ready.deferred3d, true)
})
