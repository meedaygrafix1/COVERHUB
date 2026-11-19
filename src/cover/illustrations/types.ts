import type { ReactNode } from 'react'
import type { CodeLang, SceneConfig } from '../../lib/types'
import type { Palette } from '../palette'
import type { ArtConfig } from '../generative/types'

export interface IllusCtx {
  p: Palette
  title: string
  /** title + subtitle + label, for illustrations that react to wording */
  context: string
  lang: CodeLang
  art: ArtConfig
  scene: SceneConfig
}

export interface IllustrationDef {
  id: string
  name: string
  /** visual library group */
  group: 'Pipelines' | 'Developer' | 'Data' | 'Product' | 'Abstract' | 'Library'
  w: number
  h: number
  render: (c: IllusCtx) => ReactNode
}
