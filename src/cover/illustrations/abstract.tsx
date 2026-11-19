import { ArtTile } from '../generative'
import type { IllustrationDef } from './types'

/** The current abstract-art settings, framed as an illustration. Never runs out. */
export const ABSTRACT_ILLUSTRATION: IllustrationDef = {
  id: 'abstract',
  name: 'Abstract art',
  group: 'Abstract',
  w: 600,
  h: 450,
  render: ({ p, art }) => <ArtTile art={art} w={600} h={450} uid={`${p.ids.fade}-art`} primary={p.primary} />,
}
