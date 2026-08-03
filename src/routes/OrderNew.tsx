import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { MoonMark } from '../components/MoonMark'
import { ThemeToggle } from '../components/ThemeToggle'
import { Field } from '../components/Field'
import { Select } from '../components/Select'
import type { Product, ProductType } from '../lib/types'

const religions = ['무교', '천주교', '기독교', '불교', 'SGI', '원불교'] as const
const dateTypes = ['음한자', '양한자', '음한글', '양한글'] as const
const crematoriums = [
  '서울시립승화원',
  '서울추모공원',
  '인천가족공원',
  '수원시연화장',
  '성남시영생원',
  '용인평온의숲',
  '함백산추모공원',
]
const CUSTOM_CREMATORIUM = '직접입력'

const productTypeLabel: Record<ProductType, string> = {
  urn: '유골함',
  tablet: '위패',
  other: '기타',
}

function ProductPicker({
  label,
  type,
  products,
  selectedId,
  onSelect,
}: {
  label: string
  type: 'urn' | 'tablet'
  products: Product[]
  selectedId: string | null
  onSelect: (product: Product | null) => void
}) {
  const [open, setOpen] = useState(false)
  const items = useMemo(() => products.filter((p) => p.type === type), [products, type])
  const selected = items.find((p) => p.id === selectedId) ?? null

  return (
    <div>
      <label className="block text-base font-medium text-muted-foreground">{label}</label>
      {selected ? (
        <div className="mt-1.5 flex items-center gap-3 rounded-lg border border-border bg-input px-4 py-3">
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded bg-white">
            {selected.image_url && (
              <img src={selected.image_url} alt={selected.name} className="h-full w-full object-contain" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold text-foreground">{selected.name}</p>
            <p className="text-sm text-muted-foreground">{selected.price.toLocaleString()}원</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="shrink-0 text-sm text-accent underline"
          >
            변경
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-1.5 w-full rounded-lg border border-dashed border-border px-4 py-3 text-base text-muted-foreground hover:border-accent hover:text-accent"
        >
          {label} 목록에서 고르기
        </button>
      )}

      {open && (
        <div className="mt-3 max-h-80 overflow-y-auto rounded-lg border border-border p-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {items.map((p) => (
              <button
                type="button"
                key={p.id}
                onClick={() => {
                  onSelect(p)
                  setOpen(false)
                }}
                className="flex flex-col items-start gap-1 rounded-lg border border-border p-2 text-left hover:border-accent"
              >
                <div className="aspect-square w-full overflow-hidden rounded bg-white">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="h-full w-full object-contain" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                      사진 없음
                    </div>
                  )}
                </div>
                <p className="line-clamp-2 text-sm font-medium text-foreground">{p.name}</p>
                <p className="text-sm text-accent">{p.price.toLocaleString()}원</p>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-3 text-sm text-muted-foreground underline"
          >
            닫기
          </button>
        </div>
      )}
    </div>
  )
}

export default function OrderNew() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [products, setProducts] = useState<Product[]>([])
  const [urnId, setUrnId] = useState<string | null>(searchParams.get('urn'))
  const [tabletId, setTabletId] = useState<string | null>(searchParams.get('tablet'))

  const [religion, setReligion] = useState<string>('')
  const [deceasedName, setDeceasedName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [birthDateType, setBirthDateType] = useState<string>('양한글')
  const [deathDate, setDeathDate] = useState('')
  const [deathDateType, setDeathDateType] = useState<string>('양한글')

  const [funeralHome, setFuneralHome] = useState('')
  const [crematorium, setCrematorium] = useState('')
  const [crematoriumCustom, setCrematoriumCustom] = useState('')
  const [cremationDatetime, setCremationDatetime] = useState('')
  const [burialPlace, setBurialPlace] = useState('')

  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')

  const [hasSpecialNotes, setHasSpecialNotes] = useState(false)
  const [specialNotes, setSpecialNotes] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('products')
        .select('id, category, type, name, model_code, spec, price, image_url, is_active')
        .eq('is_active', true)
        .order('category')
        .order('name')
      setProducts((data as Product[]) ?? [])
    }
    load()
  }, [])

  const urnProduct = products.find((p) => p.id === urnId) ?? null

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!profile) return
    if (!urnId) {
      setError('유골함을 선택해주세요.')
      return
    }
    setSubmitting(true)
    setError(null)

    const tabletProduct = products.find((p) => p.id === tabletId) ?? null
    const finalCrematorium = crematorium === CUSTOM_CREMATORIUM ? crematoriumCustom : crematorium

    const { error: insertError } = await supabase.from('orders').insert({
      sales_rep_id: profile.id,
      organization_id: profile.organization_id,
      urn_product_id: urnId,
      urn_price: urnProduct?.price ?? null,
      tablet_product_id: tabletId,
      tablet_price: tabletProduct?.price ?? null,
      religion: religion || null,
      deceased_name: deceasedName || null,
      birth_date: birthDate || null,
      birth_date_type: birthDate ? birthDateType : null,
      death_date: deathDate || null,
      death_date_type: deathDate ? deathDateType : null,
      funeral_home: funeralHome || null,
      crematorium: finalCrematorium || null,
      cremation_datetime: cremationDatetime || null,
      burial_place: burialPlace || null,
      customer_name: customerName,
      customer_phone: customerPhone || null,
      has_special_notes: hasSpecialNotes,
      special_notes: hasSpecialNotes ? specialNotes : null,
    })

    setSubmitting(false)
    if (insertError) {
      setError('주문서 저장 실패: ' + insertError.message)
      return
    }
    setSuccess(true)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[radial-gradient(120%_100%_at_75%_0%,_var(--color-background-alt)_0%,_var(--color-background)_60%)] px-4 py-10">
        <ThemeToggle />
        <div className="mx-auto max-w-md">
          <MoonMark className="mx-auto mb-6 h-12 w-12" />
          <div className="space-y-4 rounded-2xl border border-border bg-surface/80 p-7 text-center shadow-[0_22px_50px_-20px_rgba(0,0,0,0.35)] backdrop-blur">
            <h1 className="font-serif-kr text-xl font-bold text-foreground">주문서가 접수되었습니다</h1>
            <p className="text-base text-muted-foreground">소중한 마음을 담아 준비하겠습니다.</p>
            <div className="flex justify-center gap-4">
              <Link to="/orders" className="inline-block text-base text-accent underline">
                주문 목록 보기
              </Link>
              <Link to="/" className="inline-block text-base text-accent underline">
                대시보드로 돌아가기
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(120%_100%_at_75%_0%,_var(--color-background-alt)_0%,_var(--color-background)_60%)] px-4 py-10">
      <ThemeToggle />
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center gap-3">
          <MoonMark className="h-9 w-9" />
          <div>
            <Link to="/" className="text-base text-muted-foreground hover:text-accent hover:underline">
              ← 대시보드로
            </Link>
            <h1 className="font-serif-kr text-2xl font-bold text-foreground">주문서 작성</h1>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-8 rounded-2xl border border-border bg-surface/80 p-7 shadow-[0_22px_50px_-20px_rgba(0,0,0,0.35)] backdrop-blur"
        >
          <section className="space-y-4">
            <h2 className="font-serif-kr text-lg font-bold text-foreground">상품 선택</h2>
            <ProductPicker
              label="유골함 선택"
              type="urn"
              products={products}
              selectedId={urnId}
              onSelect={(p) => setUrnId(p?.id ?? null)}
            />
            <ProductPicker
              label="위패 선택 (선택 사항)"
              type="tablet"
              products={products}
              selectedId={tabletId}
              onSelect={(p) => setTabletId(p?.id ?? null)}
            />
            {tabletId && (
              <button
                type="button"
                onClick={() => setTabletId(null)}
                className="text-sm text-muted-foreground underline"
              >
                위패 선택 취소
              </button>
            )}
          </section>

          <section className="space-y-4 border-t border-border pt-6">
            <h2 className="font-serif-kr text-lg font-bold text-foreground">고인 정보</h2>
            <Select label="종교" value={religion} onChange={(e) => setReligion(e.target.value)}>
              <option value="">선택 안 함</option>
              {religions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
            <Field label="고인명" value={deceasedName} onChange={(e) => setDeceasedName(e.target.value)} />

            <div>
              <label className="block text-base font-medium text-muted-foreground">생년월일</label>
              <div className="mt-1.5 flex gap-2">
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="flex-1 rounded-lg border border-border bg-input px-4 py-3 text-base text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <select
                  value={birthDateType}
                  onChange={(e) => setBirthDateType(e.target.value)}
                  className="rounded-lg border border-border bg-input px-3 py-3 text-base text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  {dateTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-base font-medium text-muted-foreground">사망년월일</label>
              <div className="mt-1.5 flex gap-2">
                <input
                  type="date"
                  value={deathDate}
                  onChange={(e) => setDeathDate(e.target.value)}
                  className="flex-1 rounded-lg border border-border bg-input px-4 py-3 text-base text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <select
                  value={deathDateType}
                  onChange={(e) => setDeathDateType(e.target.value)}
                  className="rounded-lg border border-border bg-input px-3 py-3 text-base text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  {dateTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="space-y-4 border-t border-border pt-6">
            <h2 className="font-serif-kr text-lg font-bold text-foreground">장례정보</h2>
            <Field
              label="장례식장"
              value={funeralHome}
              onChange={(e) => setFuneralHome(e.target.value)}
            />

            <Select label="화장장" value={crematorium} onChange={(e) => setCrematorium(e.target.value)}>
              <option value="">선택 안 함</option>
              {crematoriums.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              <option value={CUSTOM_CREMATORIUM}>{CUSTOM_CREMATORIUM}</option>
            </Select>
            {crematorium === CUSTOM_CREMATORIUM && (
              <Field
                label="화장장 직접입력"
                value={crematoriumCustom}
                onChange={(e) => setCrematoriumCustom(e.target.value)}
              />
            )}

            <div>
              <label className="block text-base font-medium text-muted-foreground">화장 날짜 및 시간</label>
              <input
                type="datetime-local"
                value={cremationDatetime}
                onChange={(e) => setCremationDatetime(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-border bg-input px-4 py-3 text-base text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <Field label="장지" value={burialPlace} onChange={(e) => setBurialPlace(e.target.value)} />
          </section>

          <section className="space-y-4 border-t border-border pt-6">
            <h2 className="font-serif-kr text-lg font-bold text-foreground">주문자 정보</h2>
            <Field label="성함" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            <Field
              label="전화번호"
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
            />
          </section>

          <section className="space-y-4 border-t border-border pt-6">
            <h2 className="font-serif-kr text-lg font-bold text-foreground">특이사항</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setHasSpecialNotes(false)}
                className={`flex-1 rounded-lg border px-4 py-3 text-base ${
                  !hasSpecialNotes
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border text-muted-foreground'
                }`}
              >
                무
              </button>
              <button
                type="button"
                onClick={() => setHasSpecialNotes(true)}
                className={`flex-1 rounded-lg border px-4 py-3 text-base ${
                  hasSpecialNotes
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border text-muted-foreground'
                }`}
              >
                유
              </button>
            </div>
            {hasSpecialNotes && (
              <textarea
                value={specialNotes}
                onChange={(e) => setSpecialNotes(e.target.value)}
                placeholder="입력해주세요"
                rows={4}
                className="w-full rounded-lg border border-border bg-input px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
              />
            )}
          </section>

          {error && <p className="text-base text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-accent px-4 py-3 text-base font-semibold text-accent-foreground disabled:opacity-60"
          >
            {submitting ? '저장 중...' : '주문서보내기'}
          </button>
        </form>
      </div>
    </div>
  )
}
