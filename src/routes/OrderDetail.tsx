import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { MoonMark } from '../components/MoonMark'
import { ThemeToggle } from '../components/ThemeToggle'
import { Select } from '../components/Select'
import { useAuth } from '../context/AuthContext'
import type { OrderStatus } from '../lib/types'

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
  created_at: string
  urn_product: { name: string; image_url: string | null } | null
  tablet_product: { name: string; image_url: string | null } | null
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
           urn_product:urn_product_id(name, image_url),
           tablet_product:tablet_product_id(name, image_url),
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

  return (
    <div className="min-h-screen bg-[radial-gradient(120%_100%_at_75%_0%,_var(--color-background-alt)_0%,_var(--color-background)_60%)] px-4 py-10">
      <ThemeToggle />
      <div className="mx-auto max-w-2xl">
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
        )}
      </div>
    </div>
  )
}
