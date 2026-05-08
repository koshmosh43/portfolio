import { CentralGalaxy } from '../CentralGalaxy'
import { CosmicDustField } from '../CosmicDustField'
import { GalaxyNebulaHaze } from '../GalaxyNebulaHaze'
import { Stars } from '../Stars'
import { Vortex } from '../Vortex'

/** Vortex, dust, nebula, galaxy disk, star shell — split into its own async chunk. */
export function DeepSpaceDecorRoot() {
  return (
    <>
      <Vortex />
      <CosmicDustField />
      <GalaxyNebulaHaze />
      <CentralGalaxy />
      <Stars />
    </>
  )
}
