export type ArtPattern =
  | 'mesh'
  | 'flow'
  | 'contours'
  | 'halftone'
  | 'isometric'
  | 'rings'
  | 'ridges'
  | 'truchet'
  | 'bauhaus'
  | 'constellation'
  | 'blobs'
  | 'rays'

export type ArtPalette = 'brand' | 'ocean' | 'aurora' | 'mono'
export type ArtTone = 'light' | 'dark' | 'brand'
export type ArtFrame = 'card' | 'circle' | 'soft'

export interface ArtConfig {
  pattern: ArtPattern
  seed: number
  /** 0–1: how many elements */
  density: number
  /** 0–1: feature size */
  scale: number
  /** degrees */
  rotation: number
  /** 0–1: contrast, stroke weight, opacity */
  intensity: number
  /** 0–1: blur */
  softness: number
  palette: ArtPalette
  tone: ArtTone
  grain: boolean
  /** keep the text side calm when used as a background */
  fade: boolean
  /** how the art sits when used as the illustration */
  frame: ArtFrame
}

export const ART_PATTERNS: { id: ArtPattern; name: string; rotates: boolean }[] = [
  { id: 'mesh', name: 'Mesh glow', rotates: false },
  { id: 'flow', name: 'Flow field', rotates: true },
  { id: 'contours', name: 'Topography', rotates: true },
  { id: 'halftone', name: 'Halftone', rotates: true },
  { id: 'isometric', name: 'Isometric', rotates: false },
  { id: 'rings', name: 'Orbits', rotates: true },
  { id: 'ridges', name: 'Ridgelines', rotates: false },
  { id: 'truchet', name: 'Truchet', rotates: true },
  { id: 'bauhaus', name: 'Bauhaus', rotates: true },
  { id: 'constellation', name: 'Constellation', rotates: false },
  { id: 'blobs', name: 'Glass blobs', rotates: false },
  { id: 'rays', name: 'Sunburst', rotates: true },
]

export const DEFAULT_ART: ArtConfig = {
  pattern: 'flow',
  seed: 7,
  density: 0.55,
  scale: 0.5,
  rotation: 0,
  intensity: 0.6,
  softness: 0,
  palette: 'brand',
  tone: 'light',
  grain: false,
  fade: true,
  frame: 'card',
}
