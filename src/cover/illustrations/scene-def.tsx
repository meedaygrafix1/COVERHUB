import type { IllustrationDef } from './types'
import { Scene } from './scene'

/** Library icons matched to the title. Templates render it straight into their slot (see Cover.tsx). */
export const SCENE_ILLUSTRATION: IllustrationDef = {
  id: 'scene',
  name: 'Topic scene',
  group: 'Library',
  w: 560,
  h: 420,
  render: ({ p, scene }) => <Scene p={p} scene={scene} w={560} h={420} uid={`${p.ids.fade}-sc`} />,
}
