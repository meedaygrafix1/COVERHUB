import { forwardRef, useEffect, useId, useMemo } from 'react'
import type { BrandSettings, CoverConfig, UploadedAsset } from '../lib/types'
import { BG_BY_ID, BACKGROUNDS } from './backgrounds'
import { ILLUS_BY_ID } from './illustrations'
import { Scene } from './illustrations/scene'
import { BUILT_IN_ICONS } from './illustrations/scene-illustrated'
import { useIcons } from '../library/catalog'
import { buildPalette } from './palette'
import { SharedDefs } from './primitives'
import { TONE_TO_BG } from './generative'
import { TEMPLATE_BY_ID, TEMPLATES, type ArtAlign, type Box, type LayoutCtx, type TextReport } from './templates'

const NO_ICONS: string[] = []

export const COVER_W = 1200
export const coverHeight = (size: CoverConfig['size']) => (size === '1600x900' ? 675 : 630)
export const exportDims = (size: CoverConfig['size']) => (size === '1600x900' ? { w: 1600, h: 900 } : { w: 1200, h: 630 })

interface CoverProps {
  config: CoverConfig
  brand: BrandSettings
  assets: UploadedAsset[]
  className?: string
  onReport?: (r: TextReport) => void
  /** Render a label for screen readers */
  label?: string
}

export const Cover = forwardRef<SVGSVGElement, CoverProps>(function Cover({ config, brand, assets, className, onReport, label }, ref) {
  const rawId = useId()
  const uid = 'c' + rawId.replace(/[^a-zA-Z0-9]/g, '')
  const W = COVER_W
  const H = coverHeight(config.size)
  const sceneIcons = config.illustration === 'scene' ? [...config.scene.items.map((i) => i.icon), ...BUILT_IN_ICONS] : NO_ICONS
  const iconsVersion = useIcons(sceneIcons)

  const { node, report } = useMemo(() => {
    const bg = BG_BY_ID[config.background] ?? BACKGROUNDS[0]
    // abstract art takes its text and card colours from its tone
    const paletteBg = bg.id === 'generative' ? TONE_TO_BG[config.art.tone] : bg.id
    const p = buildPalette(brand, paletteBg, uid)
    const tpl = TEMPLATE_BY_ID[config.template] ?? TEMPLATES[0]
    const report: TextReport = { titleTruncated: false, titleShrunk: false, subtitleTruncated: false }

    const art = (box: Box, opts?: { align?: ArtAlign; clipR?: number }) => {
      const align = opts?.align ?? 'xMidYMid'
      if (config.illustration.startsWith('upload:')) {
        const a = assets.find((x) => `upload:${x.id}` === config.illustration)
        if (!a) return null
        return <image href={a.dataUrl} x={box.x} y={box.y} width={box.w} height={box.h} preserveAspectRatio={`${align} meet`} />
      }
      if (config.illustration === 'none') return null
      if (config.illustration === 'scene') {
        // scenes lay themselves out in the slot; keep them on the canvas even where templates bleed art off the edge
        const x = Math.max(box.x, 16)
        const y = Math.max(box.y, 16)
        const w = Math.min(box.x + box.w, W - 24) - x
        const h = Math.min(box.y + box.h, H - 24) - y
        return (
          <g transform={`translate(${x} ${y})`}>
            <Scene p={p} scene={config.scene} w={w} h={h} uid={`${uid}-sc`} />
          </g>
        )
      }
      const def = ILLUS_BY_ID[config.illustration] ?? ILLUS_BY_ID['geometric']
      return (
        <svg x={box.x} y={box.y} width={box.w} height={box.h} viewBox={`0 0 ${def.w} ${def.h}`} preserveAspectRatio={`${align} meet`} overflow="visible">
          {def.render({ p, title: config.title, context: `${config.title} ${config.subtitle} ${config.eyebrow}`, lang: config.codeLang, art: config.art, scene: config.scene })}
        </svg>
      )
    }

    const ctx: LayoutCtx = { cfg: config, W, H, p, brand, uid, report, art }
    const node = (
      <>
        <SharedDefs p={p} />
        {bg.render({ W, H, p, decor: config.decor, uid, art: config.art, zone: tpl.textZone })}
        {tpl.render(ctx)}
      </>
    )
    return { node, report }
    // iconsVersion: re-render when library icons finish loading
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, brand, assets, uid, W, H, iconsVersion])

  useEffect(() => {
    onReport?.(report)
  }, [report, onReport])

  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      viewBox={`0 0 ${W} ${H}`}
      className={className}
      role="img"
      aria-label={label ?? config.title}
      style={{ display: 'block' }}
    >
      {node}
    </svg>
  )
})
