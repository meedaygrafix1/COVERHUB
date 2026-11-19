import { FLOW_ILLUSTRATIONS } from './flows'
import { OBJECT_ILLUSTRATIONS } from './objects'
import type { IllustrationDef } from './types'
import { ABSTRACT_ILLUSTRATION } from './abstract'
import { SCENE_ILLUSTRATION } from './scene-def'

export type { IllusCtx, IllustrationDef } from './types'

export const ILLUSTRATIONS: IllustrationDef[] = [...FLOW_ILLUSTRATIONS, ...OBJECT_ILLUSTRATIONS, ABSTRACT_ILLUSTRATION, SCENE_ILLUSTRATION]

export const ILLUS_BY_ID: Record<string, IllustrationDef> = Object.fromEntries(ILLUSTRATIONS.map((i) => [i.id, i]))

export const ILLUSTRATION_GROUPS = ['Pipelines', 'Developer', 'Data', 'Product', 'Abstract'] as const
