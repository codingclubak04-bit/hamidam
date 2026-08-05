import { useRef } from 'react'
import { religionIconFromSymbol } from '../lib/engrave'

export interface EngraveElement {
  key: string
  text: string
  xPct: number
  yPct: number
  fontPct: number
  color: string
  fontFamily?: string
  vertical?: boolean
  /** 'top'이면 yPct를 텍스트 블록의 맨 위 시작점으로 사용(글자 수가 달라도 시작 높이가 항상 일치). 기본은 'center'. */
  anchor?: 'center' | 'top'
}

export interface EngravePhoto {
  key: string
  url: string
  xPct: number
  yPct: number
  sizePct: number
}

interface EngravePreviewProps {
  imageUrl: string | null
  elements: EngraveElement[]
  photo?: EngravePhoto | null
  activeKey?: string
  onPositionPick?: (key: string, xPct: number, yPct: number) => void
  onActivate?: (key: string) => void
  className?: string
}

export function EngravePreview({
  imageUrl,
  elements,
  photo,
  activeKey,
  onPositionPick,
  onActivate,
  className = '',
}: EngravePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const suppressClickRef = useRef(false)

  const pctFromPoint = (clientX: number, clientY: number) => {
    const rect = containerRef.current!.getBoundingClientRect()
    return {
      x: Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100)),
      y: Math.min(100, Math.max(0, ((clientY - rect.top) / rect.height) * 100)),
    }
  }

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false
      return
    }
    if (!onPositionPick) return
    const targetKey = activeKey ?? elements[0]?.key
    if (!targetKey) return
    const { x, y } = pctFromPoint(e.clientX, e.clientY)
    onPositionPick(targetKey, x, y)
  }

  const startDrag = (
    e: React.PointerEvent<Element>,
    key: string,
    xPct: number,
    yPct: number,
  ) => {
    if (!onPositionPick) return
    e.preventDefault()
    onActivate?.(key)

    const start = pctFromPoint(e.clientX, e.clientY)
    const offsetX = xPct - start.x
    const offsetY = yPct - start.y
    const target = e.currentTarget
    let moved = false
    target.setPointerCapture(e.pointerId)

    const handleMove = (moveEvent: PointerEvent) => {
      moved = true
      const { x, y } = pctFromPoint(moveEvent.clientX, moveEvent.clientY)
      onPositionPick(
        key,
        Math.min(100, Math.max(0, x + offsetX)),
        Math.min(100, Math.max(0, y + offsetY)),
      )
    }
    const handleUp = (upEvent: PointerEvent) => {
      target.removeEventListener('pointermove', handleMove as EventListener)
      target.removeEventListener('pointerup', handleUp as EventListener)
      target.releasePointerCapture(upEvent.pointerId)
      if (moved) suppressClickRef.current = true
    }
    target.addEventListener('pointermove', handleMove as EventListener)
    target.addEventListener('pointerup', handleUp as EventListener)
  }

  return (
    <div
      ref={containerRef}
      onClick={handleContainerClick}
      className={`relative aspect-square w-full overflow-hidden rounded-lg bg-white ${
        onPositionPick ? 'cursor-crosshair' : ''
      } ${className}`}
      style={{ containerType: 'inline-size' }}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          draggable={false}
          className="pointer-events-none h-full w-full select-none object-contain"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
          사진 없음
        </div>
      )}
      {photo ? (
        <div
          onPointerDown={(e) => startDrag(e, photo.key, photo.xPct, photo.yPct)}
          className={`absolute -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[50%] border border-black/30 bg-white/80 shadow-sm ${
            onPositionPick ? 'touch-none cursor-grab active:cursor-grabbing' : 'pointer-events-none'
          } ${photo.key === activeKey ? 'outline outline-2 outline-dashed outline-accent/70' : ''}`}
          style={{
            left: `${photo.xPct}%`,
            top: `${photo.yPct}%`,
            width: `${photo.sizePct}%`,
            aspectRatio: '3 / 4',
          }}
        >
          <img
            src={photo.url}
            alt=""
            draggable={false}
            className="pointer-events-none h-full w-full select-none object-cover"
          />
        </div>
      ) : null}
      {elements.map((el) => {
        if (!el.text) return null
        const icon = religionIconFromSymbol(el.text)
        const positionClassName = `absolute -translate-x-1/2 whitespace-nowrap ${
          el.anchor === 'top' ? '' : '-translate-y-1/2'
        } ${
          onPositionPick ? 'touch-none cursor-grab active:cursor-grabbing' : 'pointer-events-none'
        } ${
          elements.length > 1 && el.key === activeKey
            ? 'outline outline-1 outline-dashed outline-accent/70'
            : ''
        }`

        // 종교 기호는 웹폰트 글리프에 의존하면 기기별 폴백 폰트로 대체되어 모양이
        // 달라지므로(PC/iOS 불일치), 고정 SVG path로 그려 모든 기기에서 동일하게 렌더링한다.
        if (icon) {
          return (
            <svg
              key={el.key}
              viewBox="0 0 100 100"
              onPointerDown={(e) => startDrag(e, el.key, el.xPct, el.yPct)}
              className={positionClassName}
              style={{
                left: `${el.xPct}%`,
                top: `${el.yPct}%`,
                width: `${el.fontPct}cqw`,
                height: `${el.fontPct}cqw`,
              }}
            >
              <path d={icon.path} fill={el.color} fillRule={icon.fillRule} />
            </svg>
          )
        }

        return (
          <span
            key={el.key}
            onPointerDown={(e) => startDrag(e, el.key, el.xPct, el.yPct)}
            className={positionClassName}
            style={{
              left: `${el.xPct}%`,
              top: `${el.yPct}%`,
              fontSize: `${el.fontPct}cqw`,
              color: el.color,
              fontFamily: el.fontFamily ? `"${el.fontFamily}", serif` : 'var(--font-serif-kr)',
              fontWeight: 700,
              writingMode: el.vertical ? 'vertical-rl' : undefined,
              textOrientation: el.vertical ? 'upright' : undefined,
            }}
          >
            {el.text}
          </span>
        )
      })}
    </div>
  )
}
