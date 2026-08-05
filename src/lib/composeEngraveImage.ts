import type { EngraveElement, EngravePhoto } from '../components/EngravePreview'
import { religionIconFromSymbol } from './engrave'

const DEFAULT_SIZE = 1200

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('이미지를 불러올 수 없습니다.'))
    img.src = url
  })
}

// EngravePreview의 object-contain 렌더링과 동일한 배치를 재현
function drawContain(ctx: CanvasRenderingContext2D, img: HTMLImageElement, size: number) {
  const ratio = img.naturalWidth / img.naturalHeight
  const drawW = ratio > 1 ? size : size * ratio
  const drawH = ratio > 1 ? size / ratio : size
  ctx.drawImage(img, (size - drawW) / 2, (size - drawH) / 2, drawW, drawH)
}

// EngravePreview의 object-cover 렌더링과 동일한 배치를 재현
function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const imgRatio = img.naturalWidth / img.naturalHeight
  const boxRatio = w / h
  let sx: number, sy: number, sw: number, sh: number
  if (imgRatio > boxRatio) {
    sh = img.naturalHeight
    sw = sh * boxRatio
    sx = (img.naturalWidth - sw) / 2
    sy = 0
  } else {
    sw = img.naturalWidth
    sh = sw / boxRatio
    sx = 0
    sy = (img.naturalHeight - sh) / 2
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h)
}

async function ensureFontsLoaded(elements: EngraveElement[]) {
  const families = Array.from(new Set(elements.map((el) => el.fontFamily).filter(Boolean))) as string[]
  await Promise.all(families.map((f) => document.fonts.load(`700 100px "${f}"`).catch(() => {})))
  await document.fonts.ready
}

// writing-mode: vertical-rl + text-orientation: upright 을 문자 단위 세로 배치로 재현
function drawVerticalText(ctx: CanvasRenderingContext2D, el: EngraveElement, size: number) {
  const fontSizePx = (el.fontPct / 100) * size
  ctx.font = `700 ${fontSizePx}px "${el.fontFamily ?? 'Noto Serif KR'}", serif`
  ctx.fillStyle = el.color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const chars = Array.from(el.text)
  const step = fontSizePx
  const totalHeight = step * chars.length
  const x = (el.xPct / 100) * size
  const topY = el.anchor === 'top' ? (el.yPct / 100) * size : (el.yPct / 100) * size - totalHeight / 2
  chars.forEach((ch, i) => {
    ctx.fillText(ch, x, topY + step * (i + 0.5))
  })
}

function drawHorizontalText(ctx: CanvasRenderingContext2D, el: EngraveElement, size: number) {
  const fontSizePx = (el.fontPct / 100) * size
  ctx.font = `700 ${fontSizePx}px "${el.fontFamily ?? 'Noto Serif KR'}", serif`
  ctx.fillStyle = el.color
  ctx.textAlign = 'center'
  ctx.textBaseline = el.anchor === 'top' ? 'top' : 'middle'
  ctx.fillText(el.text, (el.xPct / 100) * size, (el.yPct / 100) * size)
}

// 종교 기호는 폰트 글리프 대신 고정 SVG path(viewBox 0 0 100 100)로 그려, 화면
// 미리보기(EngravePreview)와 완전히 동일한 모양이 기기와 무관하게 나오도록 한다.
function drawReligionIcon(
  ctx: CanvasRenderingContext2D,
  el: EngraveElement,
  size: number,
  path: string,
  fillRule: CanvasFillRule,
) {
  const boxSize = (el.fontPct / 100) * size
  const cx = (el.xPct / 100) * size
  const topY = el.anchor === 'top' ? (el.yPct / 100) * size : (el.yPct / 100) * size - boxSize / 2
  ctx.save()
  ctx.fillStyle = el.color
  ctx.translate(cx - boxSize / 2, topY)
  ctx.scale(boxSize / 100, boxSize / 100)
  ctx.fill(new Path2D(path), fillRule)
  ctx.restore()
}

interface ComposeEngraveImageParams {
  imageUrl: string | null
  elements: EngraveElement[]
  photo?: EngravePhoto | null
  size?: number
}

export async function composeEngraveImage({
  imageUrl,
  elements,
  photo,
  size = DEFAULT_SIZE,
}: ComposeEngraveImageParams): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('캔버스를 생성할 수 없습니다.')

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, size, size)

  if (imageUrl) {
    const img = await loadImage(imageUrl)
    drawContain(ctx, img, size)
  }

  if (photo) {
    const photoImg = await loadImage(photo.url)
    const w = (photo.sizePct / 100) * size
    const h = (w * 4) / 3
    const cx = (photo.xPct / 100) * size
    const cy = (photo.yPct / 100) * size
    ctx.save()
    ctx.beginPath()
    ctx.ellipse(cx, cy, w / 2, h / 2, 0, 0, Math.PI * 2)
    ctx.clip()
    drawCover(ctx, photoImg, cx - w / 2, cy - h / 2, w, h)
    ctx.restore()
    ctx.beginPath()
    ctx.ellipse(cx, cy, w / 2, h / 2, 0, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'
    ctx.lineWidth = Math.max(1, size * 0.0015)
    ctx.stroke()
  }

  await ensureFontsLoaded(elements)

  for (const el of elements) {
    if (!el.text) continue
    const icon = religionIconFromSymbol(el.text)
    if (icon) {
      drawReligionIcon(ctx, el, size, icon.path, icon.fillRule ?? 'nonzero')
    } else if (el.vertical) {
      drawVerticalText(ctx, el, size)
    } else {
      drawHorizontalText(ctx, el, size)
    }
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('이미지 생성에 실패했습니다.'))
    }, 'image/png')
  })
}
