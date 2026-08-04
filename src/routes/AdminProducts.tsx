import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { AdminShell } from '../components/AdminShell'
import type { Product, ProductType } from '../lib/types'

const typeLabel: Record<ProductType, string> = {
  urn: '유골함',
  tablet: '위패',
  other: '기타',
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const loadProducts = async () => {
    const { data, error: loadError } = await supabase
      .from('products')
      .select('id, category, type, name, model_code, spec, price, image_url, is_active')
      .order('category')
      .order('name')

    if (loadError) {
      setError('상품 목록 조회 실패: ' + loadError.message)
      setLoading(false)
      return
    }
    setProducts((data as Product[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const grouped = useMemo(() => {
    const map = new Map<string, Product[]>()
    for (const p of products) {
      const list = map.get(p.category) ?? []
      list.push(p)
      map.set(p.category, list)
    }
    return Array.from(map.entries())
  }, [products])

  const toggleButtonClass = (p: Product) =>
    'shrink-0 rounded-lg px-4 py-2 text-base font-semibold disabled:opacity-50 ' +
    (p.is_active
      ? 'border border-border text-muted-foreground hover:border-destructive hover:text-destructive'
      : 'bg-linear-to-r from-accent-light to-accent text-accent-foreground hover:brightness-105')

  const toggleActive = async (product: Product) => {
    setUpdatingId(product.id)
    const { error: updateError } = await supabase
      .from('products')
      .update({ is_active: !product.is_active })
      .eq('id', product.id)
    setUpdatingId(null)

    if (updateError) {
      setError('상태 변경 실패: ' + updateError.message)
      return
    }
    setError(null)
    loadProducts()
  }

  return (
    <AdminShell title="상품 관리">
      <div className="flex items-center justify-between">
        <p className="text-base text-muted-foreground">총 {products.length}개 상품</p>
        <Link
          to="/admin/products/new"
          className="rounded-lg bg-linear-to-r from-accent-light to-accent px-4 py-2.5 text-base font-semibold text-accent-foreground hover:brightness-105"
        >
          + 새 상품 등록
        </Link>
      </div>

      {error && <p className="text-base text-destructive">{error}</p>}
      {loading && <p className="text-base text-muted-foreground">불러오는 중...</p>}

      <div className="space-y-8">
        {grouped.map(([category, items]) => (
          <section key={category}>
            <h2 className="font-serif-kr mb-3 text-lg font-bold text-foreground">
              {category} <span className="text-base font-normal text-muted-foreground">({items.length})</span>
            </h2>
            <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface/80 backdrop-blur md:hidden">
              {items.map((p) => (
                <div key={p.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-input">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                        사진 없음
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold text-foreground">
                      {p.name}
                      {!p.is_active && (
                        <span className="ml-2 rounded-full bg-destructive/15 px-2.5 py-0.5 text-sm font-medium text-destructive">
                          비활성화됨
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {p.model_code} · {typeLabel[p.type]} · {p.price.toLocaleString()}원
                    </p>
                  </div>
                  <Link
                    to={`/admin/products/${p.id}/edit`}
                    className="shrink-0 rounded-lg border border-border px-4 py-2 text-base font-semibold text-muted-foreground hover:border-accent hover:text-accent"
                  >
                    수정
                  </Link>
                  <button onClick={() => toggleActive(p)} disabled={updatingId === p.id} className={toggleButtonClass(p)}>
                    {p.is_active ? '비활성화' : '활성화'}
                  </button>
                </div>
              ))}
            </div>

            <div className="hidden overflow-hidden rounded-2xl border border-border bg-surface/80 backdrop-blur md:block">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border bg-input/40 text-sm text-muted-foreground">
                    <th className="px-4 py-3 font-medium">사진</th>
                    <th className="px-4 py-3 font-medium">상품명</th>
                    <th className="px-4 py-3 font-medium">모델</th>
                    <th className="px-4 py-3 font-medium">유형</th>
                    <th className="px-4 py-3 font-medium">가격</th>
                    <th className="px-4 py-3 font-medium text-right">액션</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-3">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-input">
                          {p.image_url ? (
                            <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                              없음
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-base font-semibold text-foreground">
                        {p.name}
                        {!p.is_active && (
                          <span className="ml-2 rounded-full bg-destructive/15 px-2.5 py-0.5 text-sm font-medium text-destructive">
                            비활성화됨
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-base text-muted-foreground">{p.model_code}</td>
                      <td className="px-4 py-3 text-base text-muted-foreground">{typeLabel[p.type]}</td>
                      <td className="px-4 py-3 text-base text-muted-foreground">{p.price.toLocaleString()}원</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Link
                            to={`/admin/products/${p.id}/edit`}
                            className="shrink-0 rounded-lg border border-border px-4 py-2 text-base font-semibold text-muted-foreground hover:border-accent hover:text-accent"
                          >
                            수정
                          </Link>
                          <button onClick={() => toggleActive(p)} disabled={updatingId === p.id} className={toggleButtonClass(p)}>
                            {p.is_active ? '비활성화' : '활성화'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
        {!loading && grouped.length === 0 && (
          <p className="text-base text-muted-foreground">등록된 상품이 없습니다.</p>
        )}
      </div>
    </AdminShell>
  )
}
