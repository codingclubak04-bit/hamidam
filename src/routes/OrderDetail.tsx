import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { MoonMark } from '../components/MoonMark'
import { ThemeToggle } from '../components/ThemeToggle'
import { Select } from '../components/Select'
import { Modal } from '../components/Modal'
import { EngravePreview, type EngraveElement, type EngravePhoto } from '../components/EngravePreview'
import { composeEngraveImage } from '../lib/composeEngraveImage'
import { useAuth } from '../context/AuthContext'
import { DEFAULT_ENGRAVE_FONT, type OrderStatus } from '../lib/types'
import {
  formatBirthEngrave,
  formatDeathEngrave,
  formatBirthEngraveDot,
  formatDeathEngraveDot,
  religionSymbol,
} from '../lib/engrave'

const statusLabel: Record<OrderStatus, string> = {
  received: '접수',
  processing: '처리중',
  completed: '완료',
  cancelled: '취소',
}

const statusBadgeClass: Record<OrderStatus, string> = {
  received: 'bg-accent/15 text-accent',
  processing: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  completed: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  cancelled: 'bg-destructive/15 text-destructive',
}

interface OrderDetailData {
  id: string
  status: OrderStatus
  religion: string | null
  deceased_name: string | null
  birth_date: string | null
  birth_date_type: string | null
  death_date: string | null
  death_date_type: string | null
  funeral_home: string | null
  crematorium: string | null
  cremation_datetime: string | null
  burial_place: string | null
  customer_name: string
  customer_phone: string | null
  has_special_notes: boolean
  special_notes: string | null
  urn_price: number | null
  tablet_price: number | null
  urn_engrave_x_pct: number | null
  urn_engrave_y_pct: number | null
  urn_engrave_font_pct: number | null
  urn_engrave_font_family: string | null
  urn_birth_x_pct: number | null
  urn_birth_y_pct: number | null
  urn_birth_font_pct: number | null
  urn_death_x_pct: number | null
  urn_death_y_pct: number | null
  urn_death_font_pct: number | null
  urn_religion_x_pct: number | null
  urn_religion_y_pct: number | null
  urn_religion_font_pct: number | null
  urn_date_style: string
  tablet_engrave_x_pct: number | null
  tablet_engrave_y_pct: number | null
  tablet_engrave_font_pct: number | null
  tablet_engrave_font_family: string | null
  tablet_birth_x_pct: number | null
  tablet_birth_y_pct: number | null
  tablet_birth_font_pct: number | null
  tablet_death_x_pct: number | null
  tablet_death_y_pct: number | null
  tablet_death_font_pct: number | null
  tablet_religion_x_pct: number | null
  tablet_religion_y_pct: number | null
  tablet_religion_font_pct: number | null
  tablet_date_style: string
  tablet_photo_url: string | null
  tablet_photo_x_pct: number | null
  tablet_photo_y_pct: number | null
  tablet_photo_size_pct: number | null
  created_at: string
  urn_product: {
    name: string
    image_url: string | null
    engrave_x_pct: number
    engrave_y_pct: number
    engrave_font_pct: number
    engrave_color: string
    engrave_birth_x_pct: number
    engrave_birth_y_pct: number
    engrave_birth_font_pct: number
    engrave_death_x_pct: number
    engrave_death_y_pct: number
    engrave_death_font_pct: number
    engrave_religion_x_pct: number
    engrave_religion_y_pct: number
    engrave_religion_font_pct: number
  } | null
  tablet_product: {
    engrave_photo_y_pct: number
    name: string
    image_url: string | null
    engrave_x_pct: number
    engrave_y_pct: number
    engrave_font_pct: number
    engrave_color: string
    engrave_birth_x_pct: number
    engrave_birth_y_pct: number
    engrave_birth_font_pct: number
    engrave_death_x_pct: number
    engrave_death_y_pct: number
    engrave_death_font_pct: number
    engrave_religion_x_pct: number
    engrave_religion_y_pct: number
    engrave_religion_font_pct: number
  } | null
  sales_rep: { name: string } | null
  organization: { name: string } | null
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="flex justify-between gap-4 text-base">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium text-foreground">{value}</dd>
    </div>
  )
}

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>()
  const { profile } = useAuth()
  const [order, setOrder] = useState<OrderDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusDraft, setStatusDraft] = useState<OrderStatus>('received')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [zoomedProduct, setZoomedProduct] = useState<'urn' | 'tablet' | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const canChangeStatus = profile?.role === 'org_admin' || profile?.role === 'super_admin'

  useEffect(() => {
    const load = async () => {
      const { data, error: loadError } = await supabase
        .from('orders')
        .select(
          `id, status, religion, deceased_name, birth_date, birth_date_type,
           death_date, death_date_type, funeral_home, crematorium, cremation_datetime,
           burial_place, customer_name, customer_phone, has_special_notes, special_notes,
           urn_price, tablet_price, created_at,
           urn_engrave_x_pct, urn_engrave_y_pct, urn_engrave_font_pct, urn_engrave_font_family,
           urn_birth_x_pct, urn_birth_y_pct, urn_birth_font_pct,
           urn_death_x_pct, urn_death_y_pct, urn_death_font_pct,
           urn_religion_x_pct, urn_religion_y_pct, urn_religion_font_pct, urn_date_style,
           tablet_engrave_x_pct, tablet_engrave_y_pct, tablet_engrave_font_pct, tablet_engrave_font_family,
           tablet_birth_x_pct, tablet_birth_y_pct, tablet_birth_font_pct,
           tablet_death_x_pct, tablet_death_y_pct, tablet_death_font_pct,
           tablet_religion_x_pct, tablet_religion_y_pct, tablet_religion_font_pct, tablet_date_style,
           tablet_photo_url, tablet_photo_x_pct, tablet_photo_y_pct, tablet_photo_size_pct,
           urn_product:urn_product_id(name, image_url, engrave_x_pct, engrave_y_pct, engrave_font_pct, engrave_color, engrave_birth_x_pct, engrave_birth_y_pct, engrave_birth_font_pct, engrave_death_x_pct, engrave_death_y_pct, engrave_death_font_pct, engrave_religion_x_pct, engrave_religion_y_pct, engrave_religion_font_pct),
           tablet_product:tablet_product_id(name, image_url, engrave_x_pct, engrave_y_pct, engrave_font_pct, engrave_color, engrave_birth_x_pct, engrave_birth_y_pct, engrave_birth_font_pct, engrave_death_x_pct, engrave_death_y_pct, engrave_death_font_pct, engrave_religion_x_pct, engrave_religion_y_pct, engrave_religion_font_pct, engrave_photo_y_pct),
           sales_rep:sales_rep_id(name),
           organization:organization_id(name)`,
        )
        .eq('id', id)
        .single()

      if (loadError) {
        setError('주문 조회 실패: ' + loadError.message)
        setLoading(false)
        return
      }
      const loaded = data as unknown as OrderDetailData
      setOrder(loaded)
      setStatusDraft(loaded.status)
      setLoading(false)
    }
    load()
  }, [id])

  const handleStatusSave = async () => {
    if (!order || statusDraft === order.status) return
    setSaving(true)
    setSaveError(null)
    setSaveSuccess(false)

    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: statusDraft })
      .eq('id', order.id)

    if (updateError) {
      setSaveError('상태 변경 실패: ' + updateError.message)
      setSaving(false)
      return
    }

    setOrder({ ...order, status: statusDraft })
    setSaving(false)
    setSaveSuccess(true)
  }

  const urnElements: EngraveElement[] = useMemo(() => {
    if (!order?.urn_product || !order.deceased_name) return []
    const p = order.urn_product
    const fontFamily = order.urn_engrave_font_family ?? DEFAULT_ENGRAVE_FONT
    const isDotStyle = order.urn_date_style === 'dot'
    return [
      {
        key: 'name',
        text: order.deceased_name,
        xPct: order.urn_engrave_x_pct ?? p.engrave_x_pct,
        yPct: order.urn_engrave_y_pct ?? p.engrave_y_pct,
        fontPct: order.urn_engrave_font_pct ?? p.engrave_font_pct,
        color: p.engrave_color,
        fontFamily,
        vertical: true,
      },
      {
        key: 'birth',
        text: isDotStyle
          ? formatBirthEngraveDot(order.birth_date)
          : formatBirthEngrave(order.birth_date, order.birth_date_type),
        xPct: order.urn_birth_x_pct ?? p.engrave_birth_x_pct,
        yPct: order.urn_birth_y_pct ?? p.engrave_birth_y_pct,
        fontPct: order.urn_birth_font_pct ?? p.engrave_birth_font_pct,
        color: p.engrave_color,
        fontFamily,
        vertical: true,
        anchor: 'top',
      },
      {
        key: 'death',
        text: isDotStyle
          ? formatDeathEngraveDot(order.death_date, order.religion)
          : formatDeathEngrave(order.death_date, order.death_date_type, order.religion),
        xPct: order.urn_death_x_pct ?? p.engrave_death_x_pct,
        yPct: order.urn_death_y_pct ?? p.engrave_death_y_pct,
        fontPct: order.urn_death_font_pct ?? p.engrave_death_font_pct,
        color: p.engrave_color,
        fontFamily,
        vertical: true,
        anchor: 'top',
      },
      {
        key: 'religion',
        text: religionSymbol(order.religion),
        xPct: order.urn_religion_x_pct ?? p.engrave_religion_x_pct,
        yPct: order.urn_religion_y_pct ?? p.engrave_religion_y_pct,
        fontPct: order.urn_religion_font_pct ?? p.engrave_religion_font_pct,
        color: p.engrave_color,
        fontFamily,
        vertical: true,
      },
    ]
  }, [order])

  const tabletElements: EngraveElement[] = useMemo(() => {
    if (!order?.tablet_product || !order.deceased_name) return []
    const p = order.tablet_product
    const fontFamily = order.tablet_engrave_font_family ?? DEFAULT_ENGRAVE_FONT
    const isDotStyle = order.tablet_date_style === 'dot'
    // 사진이 없는 주문은 사진이 차지하던 상단 공간만큼 이름/종교기호만 위로 당겨 세로
    // 기준 중앙에 오도록 함(생년월일/사망년월일은 원래 위치 유지, 제품 기본좌표 대비
    // 상대적 이동량).
    const noPhotoShift = !order.tablet_photo_url ? p.engrave_religion_y_pct - p.engrave_photo_y_pct : 0
    return [
      {
        key: 'name',
        text: order.deceased_name,
        xPct: order.tablet_engrave_x_pct ?? p.engrave_x_pct,
        yPct: order.tablet_engrave_y_pct ?? p.engrave_y_pct - noPhotoShift,
        fontPct: order.tablet_engrave_font_pct ?? p.engrave_font_pct,
        color: p.engrave_color,
        fontFamily,
        vertical: true,
      },
      {
        key: 'birth',
        text: isDotStyle
          ? formatBirthEngraveDot(order.birth_date)
          : formatBirthEngrave(order.birth_date, order.birth_date_type),
        xPct: order.tablet_birth_x_pct ?? p.engrave_birth_x_pct,
        yPct: order.tablet_birth_y_pct ?? p.engrave_birth_y_pct,
        fontPct: order.tablet_birth_font_pct ?? p.engrave_birth_font_pct,
        color: p.engrave_color,
        fontFamily,
        vertical: true,
        anchor: 'top',
      },
      {
        key: 'death',
        text: isDotStyle
          ? formatDeathEngraveDot(order.death_date, order.religion)
          : formatDeathEngrave(order.death_date, order.death_date_type, order.religion),
        xPct: order.tablet_death_x_pct ?? p.engrave_death_x_pct,
        yPct: order.tablet_death_y_pct ?? p.engrave_death_y_pct,
        fontPct: order.tablet_death_font_pct ?? p.engrave_death_font_pct,
        color: p.engrave_color,
        fontFamily,
        vertical: true,
        anchor: 'top',
      },
      {
        key: 'religion',
        text: religionSymbol(order.religion),
        xPct: order.tablet_religion_x_pct ?? p.engrave_religion_x_pct,
        yPct: order.tablet_religion_y_pct ?? p.engrave_religion_y_pct - noPhotoShift,
        fontPct: order.tablet_religion_font_pct ?? p.engrave_religion_font_pct,
        color: p.engrave_color,
        fontFamily,
        vertical: true,
      },
    ]
  }, [order])

  const tabletPhoto: EngravePhoto | null = useMemo(() => {
    if (!order?.tablet_photo_url) return null
    return {
      key: 'photo',
      url: order.tablet_photo_url,
      xPct: order.tablet_photo_x_pct ?? 50,
      yPct: order.tablet_photo_y_pct ?? 24,
      sizePct: order.tablet_photo_size_pct ?? 20,
    }
  }, [order])

  const handleDownload = async (kind: 'urn' | 'tablet') => {
    const product = kind === 'urn' ? order?.urn_product : order?.tablet_product
    if (!order || !product) return
    setDownloading(true)
    setDownloadError(null)
    try {
      const blob = await composeEngraveImage({
        imageUrl: product.image_url,
        elements: kind === 'urn' ? urnElements : tabletElements,
        photo: kind === 'tablet' ? tabletPhoto : null,
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${order.deceased_name ?? '주문'}_${kind === 'urn' ? '유골함' : '위패'}_각인.png`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      setDownloadError('이미지 생성에 실패했습니다. ' + (err instanceof Error ? err.message : ''))
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(120%_100%_at_75%_0%,_var(--color-background-alt)_0%,_var(--color-background)_60%)] px-4 py-10">
      <ThemeToggle />
      <div className="mx-auto max-w-2xl lg:max-w-4xl xl:max-w-5xl">
        <div className="mb-6 flex items-center gap-3">
          <MoonMark className="h-9 w-9" />
          <div>
            <Link to="/orders" className="text-base text-muted-foreground hover:text-accent hover:underline">
              ← 주문 목록으로
            </Link>
            <h1 className="font-serif-kr text-2xl font-bold text-foreground">주문 상세</h1>
          </div>
        </div>

        {loading && <p className="text-base text-muted-foreground">불러오는 중...</p>}
        {error && <p className="text-base text-destructive">{error}</p>}

        {order && (
          <div className="lg:grid lg:grid-cols-[1fr_340px] lg:items-start lg:gap-6">
          <div className="space-y-6 rounded-2xl border border-border bg-surface/80 p-7 shadow-[0_22px_50px_-20px_rgba(0,0,0,0.35)] backdrop-blur">
            <div className="flex items-center justify-between">
              <h2 className="font-serif-kr text-xl font-bold text-foreground">
                {order.deceased_name ?? '고인명 미입력'}
              </h2>
              <span
                className={`rounded-full px-3 py-1 text-sm font-medium ${statusBadgeClass[order.status]}`}
              >
                {statusLabel[order.status]}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              접수일 {new Date(order.created_at).toLocaleString('ko-KR')}
              {(order.organization || order.sales_rep) && (
                <>
                  {' · '}
                  {order.organization?.name && `${order.organization.name} · `}
                  {order.sales_rep?.name}
                </>
              )}
            </p>

            {canChangeStatus && (
              <section className="space-y-3 border-t border-border pt-5">
                <h3 className="font-serif-kr text-base font-bold text-foreground">상태 변경</h3>
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <Select
                      label="주문 상태"
                      value={statusDraft}
                      onChange={(e) => {
                        setStatusDraft(e.target.value as OrderStatus)
                        setSaveSuccess(false)
                      }}
                    >
                      <option value="received">접수</option>
                      <option value="processing">처리중</option>
                      <option value="completed">완료</option>
                      <option value="cancelled">취소</option>
                    </Select>
                  </div>
                  <button
                    type="button"
                    onClick={handleStatusSave}
                    disabled={saving || statusDraft === order.status}
                    className="rounded-lg bg-accent px-5 py-3 text-base font-medium text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? '저장 중...' : '저장'}
                  </button>
                </div>
                {saveError && <p className="text-sm text-destructive">{saveError}</p>}
                {saveSuccess && <p className="text-sm text-emerald-600 dark:text-emerald-400">상태가 변경되었습니다.</p>}
              </section>
            )}

            <section className="space-y-3 border-t border-border pt-5">
              <h3 className="font-serif-kr text-base font-bold text-foreground">상품</h3>
              <dl className="space-y-2">
                <Row
                  label="유골함"
                  value={order.urn_product ? `${order.urn_product.name} (${order.urn_price?.toLocaleString() ?? '-'}원)` : null}
                />
                <Row
                  label="위패"
                  value={order.tablet_product ? `${order.tablet_product.name} (${order.tablet_price?.toLocaleString() ?? '-'}원)` : null}
                />
              </dl>
              {order.deceased_name && (order.urn_product || order.tablet_product) && (
                <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2 lg:hidden">
                  {order.urn_product && (
                    <div className="mx-auto w-full max-w-[240px]">
                      <EngravePreview imageUrl={order.urn_product.image_url} elements={urnElements} />
                      <div className="mt-1 flex items-center justify-center gap-2">
                        <p className="text-sm text-muted-foreground">유골함 각인</p>
                        <button
                          type="button"
                          onClick={() => setZoomedProduct('urn')}
                          className="text-sm text-accent underline"
                        >
                          크게 보기
                        </button>
                      </div>
                    </div>
                  )}
                  {order.tablet_product && (
                    <div className="mx-auto w-full max-w-[240px]">
                      <EngravePreview
                        imageUrl={order.tablet_product.image_url}
                        elements={tabletElements}
                        photo={tabletPhoto}
                      />
                      <div className="mt-1 flex items-center justify-center gap-2">
                        <p className="text-sm text-muted-foreground">위패 각인</p>
                        <button
                          type="button"
                          onClick={() => setZoomedProduct('tablet')}
                          className="text-sm text-accent underline"
                        >
                          크게 보기
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            <section className="space-y-3 border-t border-border pt-5">
              <h3 className="font-serif-kr text-base font-bold text-foreground">고인 정보</h3>
              <dl className="space-y-2">
                <Row label="종교" value={order.religion} />
                <Row
                  label="생년월일"
                  value={order.birth_date ? `${order.birth_date} (${order.birth_date_type ?? ''})` : null}
                />
                <Row
                  label="사망년월일"
                  value={order.death_date ? `${order.death_date} (${order.death_date_type ?? ''})` : null}
                />
              </dl>
            </section>

            <section className="space-y-3 border-t border-border pt-5">
              <h3 className="font-serif-kr text-base font-bold text-foreground">장례정보</h3>
              <dl className="space-y-2">
                <Row label="장례식장" value={order.funeral_home} />
                <Row label="화장장" value={order.crematorium} />
                <Row
                  label="화장 날짜 및 시간"
                  value={order.cremation_datetime ? new Date(order.cremation_datetime).toLocaleString('ko-KR') : null}
                />
                <Row label="장지" value={order.burial_place} />
              </dl>
            </section>

            <section className="space-y-3 border-t border-border pt-5">
              <h3 className="font-serif-kr text-base font-bold text-foreground">주문자 정보</h3>
              <dl className="space-y-2">
                <Row label="성함" value={order.customer_name} />
                <Row label="전화번호" value={order.customer_phone} />
              </dl>
            </section>

            <section className="space-y-3 border-t border-border pt-5">
              <h3 className="font-serif-kr text-base font-bold text-foreground">특이사항</h3>
              <p className="text-base text-foreground">
                {order.has_special_notes ? order.special_notes || '(내용 없음)' : '무'}
              </p>
            </section>
          </div>

          {order.deceased_name && (order.urn_product || order.tablet_product) && (
            <div className="hidden space-y-4 lg:sticky lg:top-10 lg:block">
              <p className="text-base font-medium text-muted-foreground">각인 미리보기</p>
              {order.urn_product && (
                <div className="mx-auto w-full max-w-[240px]">
                  <EngravePreview imageUrl={order.urn_product.image_url} elements={urnElements} />
                  <div className="mt-1 flex items-center justify-center gap-2">
                    <p className="text-sm text-muted-foreground">유골함 각인</p>
                    <button
                      type="button"
                      onClick={() => setZoomedProduct('urn')}
                      className="text-sm text-accent underline"
                    >
                      크게 보기
                    </button>
                  </div>
                </div>
              )}
              {order.tablet_product && (
                <div className="mx-auto w-full max-w-[240px]">
                  <EngravePreview
                    imageUrl={order.tablet_product.image_url}
                    elements={tabletElements}
                    photo={tabletPhoto}
                  />
                  <div className="mt-1 flex items-center justify-center gap-2">
                    <p className="text-sm text-muted-foreground">위패 각인</p>
                    <button
                      type="button"
                      onClick={() => setZoomedProduct('tablet')}
                      className="text-sm text-accent underline"
                    >
                      크게 보기
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <Modal
            open={zoomedProduct !== null}
            onClose={() => setZoomedProduct(null)}
            title={zoomedProduct === 'urn' ? '유골함 각인 미리보기' : '위패 각인 미리보기'}
          >
            {zoomedProduct === 'urn' && order.urn_product && (
              <div className="mx-auto w-full max-w-[min(85vh,480px)] space-y-3">
                <EngravePreview imageUrl={order.urn_product.image_url} elements={urnElements} />
                <button
                  type="button"
                  onClick={() => handleDownload('urn')}
                  disabled={downloading}
                  className="w-full rounded-lg border border-accent px-4 py-2.5 text-sm font-medium text-accent disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {downloading ? '이미지 생성 중...' : '이미지 다운로드'}
                </button>
                {downloadError && <p className="text-sm text-destructive">{downloadError}</p>}
              </div>
            )}
            {zoomedProduct === 'tablet' && order.tablet_product && (
              <div className="mx-auto w-full max-w-[min(85vh,480px)] space-y-3">
                <EngravePreview
                  imageUrl={order.tablet_product.image_url}
                  elements={tabletElements}
                  photo={tabletPhoto}
                />
                <button
                  type="button"
                  onClick={() => handleDownload('tablet')}
                  disabled={downloading}
                  className="w-full rounded-lg border border-accent px-4 py-2.5 text-sm font-medium text-accent disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {downloading ? '이미지 생성 중...' : '이미지 다운로드'}
                </button>
                {downloadError && <p className="text-sm text-destructive">{downloadError}</p>}
              </div>
            )}
          </Modal>
          </div>
        )}
      </div>
    </div>
  )
}
