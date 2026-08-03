import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { MoonMark } from '../components/MoonMark'
import { ThemeToggle } from '../components/ThemeToggle'
import type { Product, ProductType } from '../lib/types'

const typeLabel: Record<ProductType, string> = {
  urn: '유골함',
  tablet: '위패',
  other: '기타',
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data, error: loadError } = await supabase
        .from('products')
        .select('id, category, type, name, model_code, spec, price, image_url, is_active')
        .eq('id', id)
        .single()

      if (loadError) {
        setError('상품 조회 실패: ' + loadError.message)
        setLoading(false)
        return
      }
      setProduct(data as Product)
      setLoading(false)
    }
    load()
  }, [id])

  return (
    <div className="min-h-screen bg-[radial-gradient(120%_100%_at_75%_0%,_var(--color-background-alt)_0%,_var(--color-background)_60%)] px-4 py-10">
      <ThemeToggle />
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center gap-3">
          <MoonMark className="h-9 w-9" />
          <div>
            <Link to="/products" className="text-base text-muted-foreground hover:text-accent hover:underline">
              ← 상품 목록으로
            </Link>
            <h1 className="font-serif-kr text-2xl font-bold text-foreground">상품 상세</h1>
          </div>
        </div>

        {loading && <p className="text-base text-muted-foreground">불러오는 중...</p>}
        {error && <p className="text-base text-destructive">{error}</p>}

        {product && (
          <section className="rounded-2xl border border-border bg-surface/80 p-7 shadow-[0_22px_50px_-20px_rgba(0,0,0,0.35)] backdrop-blur">
            <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-white">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="relative h-full w-full object-contain blur-[0.8px]"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-base text-muted-foreground">
                  사진 없음
                </div>
              )}
            </div>

            <h2 className="font-serif-kr mt-6 text-2xl font-bold text-foreground">{product.name}</h2>
            <p className="mt-1 text-base text-muted-foreground">
              {product.category} · {typeLabel[product.type]}
            </p>

            <dl className="mt-5 space-y-3 border-t border-border pt-5">
              <div className="flex justify-between text-base">
                <dt className="text-muted-foreground">모델코드</dt>
                <dd className="font-medium text-foreground">{product.model_code}</dd>
              </div>
              {product.spec && (
                <div className="flex justify-between gap-4 text-base">
                  <dt className="shrink-0 text-muted-foreground">규격</dt>
                  <dd className="text-right font-medium text-foreground">{product.spec}</dd>
                </div>
              )}
              <div className="flex justify-between text-base">
                <dt className="text-muted-foreground">가격</dt>
                <dd className="text-xl font-bold text-accent">{product.price.toLocaleString()}원</dd>
              </div>
            </dl>

            {(product.type === 'urn' || product.type === 'tablet') && (
              <Link
                to={`/orders/new?${product.type}=${product.id}`}
                className="mt-6 block rounded-lg bg-accent px-4 py-3 text-center text-base font-semibold text-accent-foreground hover:opacity-90"
              >
                이 상품으로 주문서 작성
              </Link>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
