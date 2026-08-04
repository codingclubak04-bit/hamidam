import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { MoonMark } from '../components/MoonMark'
import { ThemeToggle } from '../components/ThemeToggle'
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

interface OrderRow {
  id: string
  status: OrderStatus
  deceased_name: string | null
  customer_name: string
  created_at: string
  urn_product: { name: string } | null
  tablet_product: { name: string } | null
  sales_rep: { name: string } | null
  organization: { name: string } | null
}

export default function Orders() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const load = async () => {
      const { data, error: loadError } = await supabase
        .from('orders')
        .select(
          `id, status, deceased_name, customer_name, created_at,
           urn_product:urn_product_id(name),
           tablet_product:tablet_product_id(name),
           sales_rep:sales_rep_id(name),
           organization:organization_id(name)`,
        )
        .order('created_at', { ascending: false })

      if (loadError) {
        setError('주문 목록 조회 실패: ' + loadError.message)
        setLoading(false)
        return
      }
      setOrders((data as unknown as OrderRow[]) ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter && o.status !== statusFilter) return false
      if (search) {
        const keyword = search.trim()
        const hay = `${o.deceased_name ?? ''} ${o.customer_name}`
        if (!hay.includes(keyword)) return false
      }
      return true
    })
  }, [orders, statusFilter, search])

  return (
    <div className="min-h-screen bg-[radial-gradient(120%_100%_at_75%_0%,_var(--color-background-alt)_0%,_var(--color-background)_60%)] px-4 py-10">
      <ThemeToggle />
      <div className="mx-auto max-w-3xl md:max-w-4xl lg:max-w-5xl">
        <div className="mb-6 flex items-center gap-3">
          <MoonMark className="h-9 w-9" />
          <div>
            <Link to="/" className="text-base text-muted-foreground hover:text-accent hover:underline">
              ← 대시보드로
            </Link>
            <h1 className="font-serif-kr text-2xl font-bold text-foreground">주문 목록</h1>
          </div>
        </div>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="고인명 또는 주문자명 검색"
            className="flex-1 rounded-lg border border-border bg-input px-4 py-2.5 text-base text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-border bg-input px-4 py-2.5 text-base text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="">전체 상태</option>
            <option value="received">접수</option>
            <option value="processing">처리중</option>
            <option value="completed">완료</option>
            <option value="cancelled">취소</option>
          </select>
        </div>

        {loading && <p className="text-base text-muted-foreground">불러오는 중...</p>}
        {error && <p className="text-base text-destructive">{error}</p>}

        {!loading && !error && filtered.length === 0 && (
          <p className="rounded-2xl border border-border bg-surface/80 p-7 text-center text-base text-muted-foreground md:hidden">
            조회할 주문이 없습니다.
          </p>
        )}

        <div className="space-y-3 md:hidden">
          {filtered.map((o) => (
            <Link
              key={o.id}
              to={`/orders/${o.id}`}
              className="block rounded-xl border border-border bg-surface/80 p-5 shadow-[0_12px_30px_-18px_rgba(0,0,0,0.35)] backdrop-blur hover:border-accent"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-base font-semibold text-foreground">
                    {o.deceased_name ?? '고인명 미입력'}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    주문자 {o.customer_name} · {o.urn_product?.name ?? '유골함 미선택'}
                    {o.tablet_product && ` · ${o.tablet_product.name}`}
                  </p>
                  {(o.sales_rep || o.organization) && (
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {o.organization?.name && `${o.organization.name} · `}
                      {o.sales_rep?.name}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span
                    className={`rounded-full px-2.5 py-1 text-sm font-medium ${statusBadgeClass[o.status]}`}
                  >
                    {statusLabel[o.status]}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(o.created_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="hidden overflow-hidden rounded-2xl border border-border bg-surface/80 backdrop-blur md:block">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-input/40 text-sm text-muted-foreground">
                <th className="px-5 py-3 font-medium">고인명</th>
                <th className="px-5 py-3 font-medium">주문자 / 상품</th>
                <th className="px-5 py-3 font-medium">소속 · 담당자</th>
                <th className="px-5 py-3 font-medium">상태</th>
                <th className="px-5 py-3 font-medium">접수일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((o) => (
                <tr
                  key={o.id}
                  onClick={() => navigate(`/orders/${o.id}`)}
                  className="cursor-pointer transition hover:bg-input"
                >
                  <td className="px-5 py-4 text-base font-semibold text-foreground">
                    {o.deceased_name ?? '고인명 미입력'}
                  </td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">
                    {o.customer_name} · {o.urn_product?.name ?? '유골함 미선택'}
                    {o.tablet_product && ` · ${o.tablet_product.name}`}
                  </td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">
                    {o.organization?.name && `${o.organization.name} · `}
                    {o.sales_rep?.name ?? '-'}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-sm font-medium ${statusBadgeClass[o.status]}`}
                    >
                      {statusLabel[o.status]}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">
                    {new Date(o.created_at).toLocaleDateString('ko-KR')}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-center text-base text-muted-foreground">
                    조회할 주문이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
