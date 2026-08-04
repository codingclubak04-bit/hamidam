import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { MoonMark } from '../components/MoonMark'
import { ThemeToggle } from '../components/ThemeToggle'
import type { Product } from '../lib/types'

export default function Gallery() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data, error: loadError } = await supabase
        .from('products')
        .select('id, category, type, name, model_code, spec, price, image_url')
        .not('image_url', 'is', null)
        .order('category')
        .order('name')

      if (loadError) {
        setError('상품 조회 실패: ' + loadError.message)
        setLoading(false)
        return
      }
      setProducts((data as Product[]) ?? [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="min-h-screen bg-[radial-gradient(120%_100%_at_75%_0%,_var(--color-background-alt)_0%,_var(--color-background)_60%)] px-4 py-10">
      <ThemeToggle />
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 flex items-center gap-3">
          <MoonMark className="h-9 w-9" />
          <Link to="/" className="text-base text-muted-foreground hover:text-accent hover:underline">
            ← 대시보드로
          </Link>
        </div>

        <div className="mx-auto mb-14 max-w-xl text-center">
          <h1 className="font-serif-kr text-2xl font-bold text-foreground opacity-0 animate-[hamidam-fade-up_1s_ease-out_forwards]">
            하미담 갤러리
          </h1>
          <p
            className="mt-4 text-lg leading-relaxed text-muted-foreground opacity-0 animate-[hamidam-fade-up_1s_ease-out_forwards]"
            style={{ animationDelay: '0.3s' }}
          >
            남겨진 것은 유골이 아닙니다.
            <br />
            한 사람의 삶, 사랑, 그리고 가족의 추억입니다.
            <br />
            하미담은 단순한 보관이 아닌, 그 소중한 가치를 보존합니다.
          </p>
        </div>

        {loading && <p className="text-center text-base text-muted-foreground">불러오는 중...</p>}
        {error && <p className="text-center text-base text-destructive">{error}</p>}

        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p, i) => (
            <Link
              key={p.id}
              to={`/products/${p.id}`}
              className="block overflow-hidden rounded-2xl border border-border bg-white opacity-0 shadow-[0_18px_40px_-18px_rgba(0,0,0,0.35)] transition-transform duration-200 hover:-translate-y-1 animate-[hamidam-fade-up_0.8s_ease-out_forwards]"
              style={{ animationDelay: `${0.6 + Math.min(i, 12) * 0.06}s` }}
            >
              <div className="aspect-square bg-white p-3">
                <img
                  src={p.image_url ?? undefined}
                  alt={p.name}
                  className="h-full w-full object-contain blur-[0.8px]"
                />
              </div>
              <p className="px-3 pb-4 text-center text-base font-medium text-neutral-800">{p.name}</p>
            </Link>
          ))}
        </div>

        {!loading && !error && products.length === 0 && (
          <p className="text-center text-base text-muted-foreground">표시할 상품이 없습니다.</p>
        )}

        {!loading && (
          <div className="mt-12 text-center">
            <Link
              to="/products"
              className="inline-block rounded-lg border border-border px-5 py-3 text-base text-foreground hover:border-accent hover:text-accent"
            >
              전체 상품 검색·필터로 보기
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
