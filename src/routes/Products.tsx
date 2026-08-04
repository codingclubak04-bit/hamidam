import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { MoonMark } from '../components/MoonMark'
import { ThemeToggle } from '../components/ThemeToggle'
import { Select } from '../components/Select'
import type { Product, ProductType } from '../lib/types'

const typeLabel: Record<ProductType, string> = {
  urn: '유골함',
  tablet: '위패',
  other: '기타',
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<'all' | ProductType>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  useEffect(() => {
    const load = async () => {
      const { data, error: loadError } = await supabase
        .from('products')
        .select('id, category, type, name, model_code, spec, price, image_url, is_active')
        .eq('is_active', true)
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
    load()
  }, [])

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category))),
    [products],
  )

  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          (typeFilter === 'all' || p.type === typeFilter) &&
          (categoryFilter === 'all' || p.category === categoryFilter),
      ),
    [products, typeFilter, categoryFilter],
  )

  const grouped = useMemo(() => {
    const map = new Map<string, Product[]>()
    for (const p of filtered) {
      const list = map.get(p.category) ?? []
      list.push(p)
      map.set(p.category, list)
    }
    return Array.from(map.entries())
  }, [filtered])

  return (
    <div className="min-h-screen bg-[radial-gradient(120%_100%_at_75%_0%,_var(--color-background-alt)_0%,_var(--color-background)_60%)] px-4 py-10">
      <ThemeToggle />
      <div className="mx-auto max-w-4xl lg:max-w-5xl xl:max-w-6xl">
        <div className="mb-6 flex items-center gap-3">
          <MoonMark className="h-9 w-9" />
          <div>
            <Link to="/" className="text-base text-muted-foreground hover:text-accent hover:underline">
              ← 대시보드로
            </Link>
            <h1 className="font-serif-kr text-2xl font-bold text-foreground">상품 목록</h1>
          </div>
        </div>

        <section className="mb-6 grid grid-cols-1 gap-4 rounded-2xl border border-border bg-surface/80 p-6 shadow-[0_22px_50px_-20px_rgba(0,0,0,0.35)] backdrop-blur sm:grid-cols-2">
          <Select label="분류" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as 'all' | ProductType)}>
            <option value="all">전체</option>
            <option value="urn">유골함</option>
            <option value="tablet">위패</option>
            <option value="other">기타</option>
          </Select>
          <Select label="카테고리" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">전체</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </section>

        {error && <p className="mb-4 text-base text-destructive">{error}</p>}
        {loading && <p className="text-base text-muted-foreground">불러오는 중...</p>}

        {!loading && !error && (
          <p className="mb-4 text-base text-muted-foreground">총 {filtered.length}개 상품</p>
        )}

        <div className="space-y-8">
          {grouped.map(([category, items]) => (
            <section key={category}>
              <h2 className="font-serif-kr mb-3 text-lg font-bold text-foreground">
                {category} <span className="text-base font-normal text-muted-foreground">({items.length})</span>
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {items.map((p) => (
                  <Link
                    key={p.id}
                    to={`/products/${p.id}`}
                    className="flex gap-4 rounded-2xl border border-border bg-surface/80 p-4 shadow-[0_12px_30px_-16px_rgba(0,0,0,0.35)] transition hover:border-accent"
                  >
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-input">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                          사진 없음
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-semibold text-foreground">{p.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {p.model_code} · {typeLabel[p.type]}
                      </p>
                      {p.spec && <p className="text-sm text-muted-foreground">{p.spec}</p>}
                      <p className="mt-1 text-base font-bold text-accent">{p.price.toLocaleString()}원</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
          {!loading && grouped.length === 0 && (
            <p className="text-base text-muted-foreground">조건에 맞는 상품이 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  )
}
