import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
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

type Period = 'today' | 'week' | 'month' | 'all'

const periodLabel: Record<Period, string> = {
  today: '오늘',
  week: '이번주',
  month: '이번달',
  all: '전체',
}

type Source = 'all' | 'partner' | 'individual'

const sourceLabel: Record<Source, string> = {
  all: '전체',
  partner: '파트너사 주문',
  individual: '팀장 주문',
}

interface StatsOrderRow {
  id: string
  status: OrderStatus
  urn_price: number | null
  tablet_price: number | null
  created_at: string
  deceased_name: string | null
  customer_name: string
  organization: { name: string } | null
  sales_rep: { name: string; role: string } | null
  urn_product: { name: string } | null
  tablet_product: { name: string } | null
  order_items: { product_name: string; unit_price: number; quantity: number }[]
}

function periodStart(period: Period): Date | null {
  const now = new Date()
  if (period === 'today') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  }
  if (period === 'week') {
    const day = now.getDay()
    const diff = day === 0 ? 6 : day - 1
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff)
    return monday
  }
  if (period === 'month') {
    return new Date(now.getFullYear(), now.getMonth(), 1)
  }
  return null
}

const previousPeriodLabel: Record<Period, string> = {
  today: '어제',
  week: '지난주',
  month: '지난달',
  all: '',
}

function previousPeriodBounds(period: Period): { start: Date; end: Date } | null {
  const start = periodStart(period)
  if (!start) return null
  if (period === 'today') {
    return { start: new Date(start.getTime() - 24 * 60 * 60 * 1000), end: start }
  }
  if (period === 'week') {
    return { start: new Date(start.getTime() - 7 * 24 * 60 * 60 * 1000), end: start }
  }
  const prevMonthStart = new Date(start.getFullYear(), start.getMonth() - 1, 1)
  return { start: prevMonthStart, end: start }
}

type Trend = { direction: 'up' | 'down' | 'flat'; text: string }

function trendPercent(current: number, previous: number | null): Trend | null {
  if (previous === null) return null
  if (previous === 0) {
    if (current === 0) return { direction: 'flat', text: '변동 없음' }
    return { direction: 'up', text: '신규' }
  }
  const diff = current - previous
  if (diff === 0) return { direction: 'flat', text: '변동 없음' }
  const pct = Math.round((diff / previous) * 100)
  return { direction: diff > 0 ? 'up' : 'down', text: `${diff > 0 ? '+' : ''}${pct}%` }
}

function trendCount(current: number, previous: number | null): Trend | null {
  if (previous === null) return null
  const diff = current - previous
  if (diff === 0) return { direction: 'flat', text: '변동 없음' }
  return { direction: diff > 0 ? 'up' : 'down', text: `${diff > 0 ? '+' : ''}${diff}건` }
}

function TrendBadge({ trend }: { trend: Trend | null }) {
  if (!trend) return null
  const color =
    trend.direction === 'up'
      ? 'text-emerald-600 dark:text-emerald-400'
      : trend.direction === 'down'
        ? 'text-destructive'
        : 'text-muted-foreground'
  const arrow = trend.direction === 'up' ? '▲' : trend.direction === 'down' ? '▼' : '－'
  return (
    <p className={`mt-1 text-xs font-medium ${color}`}>
      {arrow} {trend.text}
    </p>
  )
}

function orderAmount(o: StatsOrderRow) {
  const itemsTotal = o.order_items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)
  return (o.urn_price ?? 0) + (o.tablet_price ?? 0) + itemsTotal
}

function formatWon(n: number) {
  return n.toLocaleString('ko-KR') + '원'
}

function productNames(o: StatsOrderRow) {
  const names = [o.urn_product?.name, o.tablet_product?.name, ...o.order_items.map((i) => i.product_name)].filter(
    Boolean,
  )
  return names.length > 0 ? names.join(' · ') : '-'
}

function salesRepRoleLabel(role: string | undefined) {
  if (role === 'org_admin') return '파트너'
  if (role === 'sales_rep') return '팀장'
  return '-'
}

type SortKey = 'created_at' | 'deceased_name' | 'organization' | 'sales_rep' | 'role' | 'amount' | 'status'
type SortDir = 'asc' | 'desc'

const sortableColumns: { key: SortKey; label: string }[] = [
  { key: 'created_at', label: '접수일' },
  { key: 'deceased_name', label: '고인명' },
  { key: 'organization', label: '소속' },
  { key: 'sales_rep', label: '담당자' },
  { key: 'role', label: '역할' },
  { key: 'amount', label: '금액' },
  { key: 'status', label: '상태' },
]

export default function OrderStats() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<StatsOrderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState<Period>('month')
  const [source, setSource] = useState<Source>('all')
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    if (!fullscreen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [fullscreen])

  useEffect(() => {
    const load = async () => {
      const { data, error: loadError } = await supabase
        .from('orders')
        .select(
          `id, status, urn_price, tablet_price, created_at, deceased_name, customer_name,
           organization:organization_id(name),
           sales_rep:sales_rep_id(name, role),
           urn_product:urn_product_id(name),
           tablet_product:tablet_product_id(name),
           order_items(product_name, unit_price, quantity)`,
        )
        .order('created_at', { ascending: false })

      if (loadError) {
        setError('통계 데이터 조회 실패: ' + loadError.message)
        setLoading(false)
        return
      }
      setOrders((data as unknown as StatsOrderRow[]) ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    const start = periodStart(period)
    return orders.filter((o) => {
      if (start && new Date(o.created_at) < start) return false
      if (source === 'partner' && o.sales_rep?.role !== 'org_admin') return false
      if (source === 'individual' && o.sales_rep?.role !== 'sales_rep') return false
      return true
    })
  }, [orders, period, source])

  const statusCounts = useMemo(() => {
    const counts: Record<OrderStatus, number> = { received: 0, processing: 0, completed: 0, cancelled: 0 }
    for (const o of filtered) counts[o.status]++
    return counts
  }, [filtered])

  const revenue = useMemo(() => {
    return filtered.filter((o) => o.status !== 'cancelled').reduce((sum, o) => sum + orderAmount(o), 0)
  }, [filtered])

  const previousFiltered = useMemo(() => {
    const bounds = previousPeriodBounds(period)
    if (!bounds) return null
    return orders.filter((o) => {
      const t = new Date(o.created_at)
      if (t < bounds.start || t >= bounds.end) return false
      if (source === 'partner' && o.sales_rep?.role !== 'org_admin') return false
      if (source === 'individual' && o.sales_rep?.role !== 'sales_rep') return false
      return true
    })
  }, [orders, period, source])

  const previousStatusCounts = useMemo(() => {
    if (!previousFiltered) return null
    const counts: Record<OrderStatus, number> = { received: 0, processing: 0, completed: 0, cancelled: 0 }
    for (const o of previousFiltered) counts[o.status]++
    return counts
  }, [previousFiltered])

  const previousRevenue = useMemo(() => {
    if (!previousFiltered) return null
    return previousFiltered.filter((o) => o.status !== 'cancelled').reduce((sum, o) => sum + orderAmount(o), 0)
  }, [previousFiltered])

  const byOrganization = useMemo(() => {
    const map = new Map<string, { name: string; count: number; revenue: number }>()
    for (const o of filtered) {
      if (o.status === 'cancelled') continue
      const key = o.organization?.name ?? '개인 주문'
      const entry = map.get(key) ?? { name: key, count: 0, revenue: 0 }
      entry.count += 1
      entry.revenue += orderAmount(o)
      map.set(key, entry)
    }
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue)
  }, [filtered])

  const bySalesRep = useMemo(() => {
    const map = new Map<string, { name: string; count: number; revenue: number }>()
    for (const o of filtered) {
      if (o.status === 'cancelled') continue
      const key = o.sales_rep?.name ?? '미지정'
      const entry = map.get(key) ?? { name: key, count: 0, revenue: 0 }
      entry.count += 1
      entry.revenue += orderAmount(o)
      map.set(key, entry)
    }
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue)
  }, [filtered])

  const topProducts = useMemo(() => {
    const map = new Map<string, number>()
    for (const o of filtered) {
      if (o.status === 'cancelled') continue
      if (o.urn_product) map.set(o.urn_product.name, (map.get(o.urn_product.name) ?? 0) + 1)
      if (o.tablet_product) map.set(o.tablet_product.name, (map.get(o.tablet_product.name) ?? 0) + 1)
    }
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [filtered])

  const sortedOrders = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1
    const rows = [...filtered]
    rows.sort((a, b) => {
      switch (sortKey) {
        case 'created_at':
          return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir
        case 'deceased_name':
          return (a.deceased_name ?? a.customer_name).localeCompare(b.deceased_name ?? b.customer_name) * dir
        case 'organization':
          return (a.organization?.name ?? '').localeCompare(b.organization?.name ?? '') * dir
        case 'sales_rep':
          return (a.sales_rep?.name ?? '').localeCompare(b.sales_rep?.name ?? '') * dir
        case 'role':
          return salesRepRoleLabel(a.sales_rep?.role).localeCompare(salesRepRoleLabel(b.sales_rep?.role)) * dir
        case 'amount':
          return (orderAmount(a) - orderAmount(b)) * dir
        case 'status':
          return a.status.localeCompare(b.status) * dir
        default:
          return 0
      }
    })
    return rows
  }, [filtered, sortKey, sortDir])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'created_at' || key === 'amount' ? 'desc' : 'asc')
    }
  }

  if (loading) {
    return <p className="text-base text-muted-foreground">불러오는 중...</p>
  }

  if (error) {
    return <p className="text-base text-destructive">{error}</p>
  }

  const renderOrdersTable = () =>
    sortedOrders.length === 0 ? (
      <p className="mt-3 text-base text-muted-foreground">주문 데이터가 없습니다.</p>
    ) : (
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left">
          <thead>
            <tr className="border-b border-border text-sm text-muted-foreground">
              {sortableColumns.map(({ key, label }) => (
                <th
                  key={key}
                  onClick={() => toggleSort(key)}
                  className="cursor-pointer select-none whitespace-nowrap px-3 py-2.5 font-medium hover:text-accent"
                >
                  {label}
                  {sortKey === key && (sortDir === 'asc' ? ' ▲' : ' ▼')}
                </th>
              ))}
              <th className="whitespace-nowrap px-3 py-2.5 font-medium">상품</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sortedOrders.map((o) => (
              <tr
                key={o.id}
                onClick={() => navigate(`/orders/${o.id}`)}
                className="cursor-pointer text-base transition hover:bg-input"
              >
                <td className="whitespace-nowrap px-3 py-3 text-sm text-muted-foreground">
                  {new Date(o.created_at).toLocaleDateString('ko-KR')}
                </td>
                <td className="px-3 py-3 font-semibold text-foreground">{o.deceased_name || o.customer_name}</td>
                <td className="px-3 py-3 text-sm text-muted-foreground">{o.organization?.name ?? '개인 주문'}</td>
                <td className="px-3 py-3 text-sm text-muted-foreground">{o.sales_rep?.name ?? '-'}</td>
                <td className="px-3 py-3 text-sm text-muted-foreground">{salesRepRoleLabel(o.sales_rep?.role)}</td>
                <td className="whitespace-nowrap px-3 py-3 font-semibold text-accent">{formatWon(orderAmount(o))}</td>
                <td className="px-3 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-sm font-medium ${statusBadgeClass[o.status]}`}>
                    {statusLabel[o.status]}
                  </span>
                </td>
                <td className="px-3 py-3 text-sm text-muted-foreground">{productNames(o)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {(Object.keys(periodLabel) as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={
              'shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ' +
              (period === p
                ? 'bg-gradient-to-r from-accent-light to-accent text-accent-foreground'
                : 'border border-border text-muted-foreground hover:border-accent hover:text-accent')
            }
          >
            {periodLabel[p]}
          </button>
        ))}

        <div className="mx-1 h-6 w-px shrink-0 bg-border" />

        {(Object.keys(sourceLabel) as Source[]).map((s) => (
          <button
            key={s}
            onClick={() => setSource(s)}
            className={
              'shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ' +
              (source === s
                ? 'bg-accent/15 text-accent'
                : 'border border-border text-muted-foreground hover:border-accent hover:text-accent')
            }
          >
            {sourceLabel[s]}
          </button>
        ))}
      </div>

      <div>
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-bold text-foreground">
            핵심 지표 ({periodLabel[period]}
            {source !== 'all' ? ` · ${sourceLabel[source]}` : ''})
          </h2>
          {previousPeriodLabel[period] && (
            <span className="text-sm text-muted-foreground">{previousPeriodLabel[period]} 대비</span>
          )}
        </div>
        <div className="mt-3 @container">
          <div className="grid grid-cols-2 gap-3 @sm:grid-cols-3 @4xl:grid-cols-5">
            <div className="col-span-2 rounded-2xl border border-accent/40 bg-surface/80 p-5 text-center backdrop-blur @sm:col-span-1">
              <span className="inline-block rounded-full bg-accent/15 px-2.5 py-1 text-sm font-medium text-accent">
                매출
              </span>
              <p className="mt-2 text-xl font-bold text-foreground">{formatWon(revenue)}</p>
              <TrendBadge trend={trendPercent(revenue, previousRevenue)} />
            </div>
            {(Object.keys(statusLabel) as OrderStatus[]).map((s) => (
              <div key={s} className="rounded-2xl border border-border bg-surface/80 p-5 text-center backdrop-blur">
                <span className={`inline-block rounded-full px-2.5 py-1 text-sm font-medium ${statusBadgeClass[s]}`}>
                  {statusLabel[s]}
                </span>
                <p className="mt-2 text-2xl font-bold text-foreground">{statusCounts[s]}건</p>
                <TrendBadge trend={trendCount(statusCounts[s], previousStatusCounts?.[s] ?? null)} />
              </div>
            ))}
          </div>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">취소 건은 매출 집계에서 제외됩니다.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <StatTable title="조직별 판매 현황" rows={byOrganization} emptyText="주문 데이터가 없습니다." />
        <StatTable
          title={source === 'partner' ? '파트너사 담당자별 판매 실적' : '팀장별 판매 실적'}
          rows={bySalesRep}
          emptyText="주문 데이터가 없습니다."
        />
      </div>

      <div className="rounded-2xl border border-border bg-surface/80 p-6 backdrop-blur">
        <h2 className="text-lg font-bold text-foreground">상품별 판매 순위 Top 5</h2>
        {topProducts.length === 0 ? (
          <p className="mt-3 text-base text-muted-foreground">주문 데이터가 없습니다.</p>
        ) : (
          <ol className="mt-3 divide-y divide-border">
            {topProducts.map((p, i) => (
              <li key={p.name} className="flex items-center justify-between py-2.5 text-base">
                <span className="text-foreground">
                  <span className="mr-2 text-muted-foreground">{i + 1}.</span>
                  {p.name}
                </span>
                <span className="font-semibold text-accent">{p.count}건</span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-surface/80 p-6 backdrop-blur">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-bold text-foreground">전체 주문 내역</h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">총 {sortedOrders.length}건</span>
            <button
              type="button"
              onClick={() => setFullscreen(true)}
              className="rounded-full border border-border px-3 py-1 text-sm font-medium text-muted-foreground transition-colors hover:border-accent hover:text-accent"
            >
              전체화면
            </button>
          </div>
        </div>
        {renderOrdersTable()}
      </div>

      {fullscreen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background/95 p-4 backdrop-blur-sm sm:p-8">
          <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">전체 주문 내역</h2>
                <span className="text-sm text-muted-foreground">총 {sortedOrders.length}건</span>
              </div>
              <button
                type="button"
                onClick={() => setFullscreen(false)}
                aria-label="닫기"
                className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-input hover:text-foreground"
              >
                닫기 ✕
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">{renderOrdersTable()}</div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatTable({
  title,
  rows,
  emptyText,
}: {
  title: string
  rows: { name: string; count: number; revenue: number }[]
  emptyText: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface/80 p-6 backdrop-blur">
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-base text-muted-foreground">{emptyText}</p>
      ) : (
        <ul className="mt-3 divide-y divide-border">
          {rows.map((r) => (
            <li key={r.name} className="flex items-center justify-between gap-3 py-2.5 text-base">
              <span className="min-w-0 truncate text-foreground">{r.name}</span>
              <span className="shrink-0 text-right">
                <span className="block font-semibold text-accent">{formatWon(r.revenue)}</span>
                <span className="block text-sm text-muted-foreground">{r.count}건</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
