import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { MoonMark } from '../components/MoonMark'
import { ThemeToggle } from '../components/ThemeToggle'
import { PageHeader } from '../components/PageHeader'
import { Field } from '../components/Field'
import { Select } from '../components/Select'
import { Modal } from '../components/Modal'
import { IconChevronRight } from '../components/DashboardIcons'
import { EngravePreview, type EngraveElement, type EngravePhoto } from '../components/EngravePreview'
import { ENGRAVE_FONTS, DEFAULT_ENGRAVE_FONT, type Product, type ProductType } from '../lib/types'
import {
  formatBirthEngrave,
  formatDeathEngrave,
  formatBirthEngraveDot,
  formatDeathEngraveDot,
  religionSymbol,
} from '../lib/engrave'

interface ElementOverride {
  xPct: number
  yPct: number
  fontPct: number
}

interface PhotoOverride {
  xPct: number
  yPct: number
  sizePct: number
}

interface EngraveOverride {
  fontFamily: string
  elements: Record<string, ElementOverride>
  photo?: PhotoOverride
}

const ENGRAVE_ELEMENT_KEYS = ['name', 'birth', 'death', 'religion'] as const
const ENGRAVE_ELEMENT_LABELS: Record<string, string> = {
  name: '이름',
  birth: '생년월일',
  death: '사망년월일',
  religion: '종교기호',
  photo: '사진',
}

function defaultEngraveOverride(product: Product, hasPhoto = false): EngraveOverride {
  // 위패에 사진이 없으면 사진이 차지하던 상단 공간만큼 종교기호/이름만 위로 당겨서
  // 세로 기준 중앙에 오도록 함(생년월일/사망년월일은 원래 위치 유지, 사진 있을 때
  // 좌표 대비 상대적 이동량).
  const noPhotoShift =
    product.type === 'tablet' && !hasPhoto
      ? product.engrave_religion_y_pct - product.engrave_photo_y_pct
      : 0
  const elements: Record<string, ElementOverride> = {
    name: {
      xPct: product.engrave_x_pct,
      yPct: product.engrave_y_pct - noPhotoShift,
      fontPct: product.engrave_font_pct,
    },
    birth: {
      xPct: product.engrave_birth_x_pct,
      yPct: product.engrave_birth_y_pct,
      fontPct: product.engrave_birth_font_pct,
    },
    death: {
      xPct: product.engrave_death_x_pct,
      yPct: product.engrave_death_y_pct,
      fontPct: product.engrave_death_font_pct,
    },
    religion: {
      xPct: product.engrave_religion_x_pct,
      yPct: product.engrave_religion_y_pct - noPhotoShift,
      fontPct: product.engrave_religion_font_pct,
    },
  }
  let photo: PhotoOverride | undefined
  if (product.type === 'tablet') {
    photo = {
      xPct: product.engrave_photo_x_pct,
      yPct: product.engrave_photo_y_pct,
      sizePct: product.engrave_photo_size_pct,
    }
  }
  return { fontFamily: DEFAULT_ENGRAVE_FONT, elements, photo }
}

function EngraveEditor({
  label,
  product,
  texts,
  photoUrl,
  value,
  onChange,
}: {
  label: string
  product: Product
  texts: Record<string, string>
  photoUrl?: string | null
  value: EngraveOverride
  onChange: (v: EngraveOverride) => void
}) {
  const textKeys = ENGRAVE_ELEMENT_KEYS
  const showPhotoTab = product.type === 'tablet' && !!photoUrl
  const tabKeys: string[] = showPhotoTab ? [...textKeys, 'photo'] : [...textKeys]
  const [activeKey, setActiveKey] = useState<string>('name')
  const [modalOpen, setModalOpen] = useState(false)

  const elements: EngraveElement[] = textKeys.map((key) => ({
    key,
    text: texts[key] ?? '',
    xPct: value.elements[key]?.xPct ?? 50,
    yPct: value.elements[key]?.yPct ?? 50,
    fontPct: value.elements[key]?.fontPct ?? 6,
    color: product.engrave_color,
    fontFamily: value.fontFamily,
    vertical: true,
    anchor: key === 'birth' || key === 'death' ? 'top' : 'center',
  }))

  const photo: EngravePhoto | null =
    showPhotoTab && photoUrl
      ? {
          key: 'photo',
          url: photoUrl,
          xPct: value.photo?.xPct ?? 50,
          yPct: value.photo?.yPct ?? 24,
          sizePct: value.photo?.sizePct ?? 20,
        }
      : null

  const activeFontPct = value.elements[activeKey]?.fontPct ?? 6
  const activeSizePct = value.photo?.sizePct ?? 20

  const updateActive = (patch: Partial<ElementOverride>) => {
    onChange({
      ...value,
      elements: {
        ...value.elements,
        [activeKey]: { ...value.elements[activeKey], ...patch },
      },
    })
  }

  const updatePhoto = (patch: Partial<PhotoOverride>) => {
    onChange({
      ...value,
      photo: {
        xPct: value.photo?.xPct ?? 50,
        yPct: value.photo?.yPct ?? 24,
        sizePct: value.photo?.sizePct ?? 20,
        ...patch,
      },
    })
  }

  const handlePositionPick = (key: string, x: number, y: number) => {
    if (key === 'photo') {
      updatePhoto({ xPct: x, yPct: y })
      return
    }
    onChange({
      ...value,
      elements: { ...value.elements, [key]: { ...value.elements[key], xPct: x, yPct: y } },
    })
  }

  const renderPreview = (large: boolean) => (
    <div className={large ? 'mx-auto w-full max-w-[min(85vh,480px)]' : 'mx-auto w-full max-w-[280px]'}>
      <EngravePreview
        imageUrl={product.image_url}
        elements={elements}
        photo={photo}
        activeKey={activeKey}
        onPositionPick={handlePositionPick}
        onActivate={setActiveKey}
      />
      <p className="mt-1.5 text-center text-xs text-muted-foreground">
        텍스트나 사진을 드래그하거나 이미지를 클릭해 위치를 이동하세요
      </p>
    </div>
  )

  const renderControls = () => (
    <>
      {tabKeys.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {tabKeys.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveKey(key)}
              className={`rounded-full border px-3 py-1 text-xs ${
                activeKey === key
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border text-muted-foreground'
              }`}
            >
              {ENGRAVE_ELEMENT_LABELS[key]}
            </button>
          ))}
        </div>
      )}
      {activeKey === 'photo' ? (
        <div>
          <label className="block text-sm font-medium text-muted-foreground">
            사진 크기 ({activeSizePct.toFixed(1)}%)
          </label>
          <input
            type="range"
            min={8}
            max={45}
            step={0.5}
            value={activeSizePct}
            onChange={(e) => updatePhoto({ sizePct: Number(e.target.value) })}
            className="mt-1.5 w-full"
          />
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-muted-foreground">
            글자 크기 ({activeFontPct.toFixed(1)}%)
          </label>
          <input
            type="range"
            min={2}
            max={20}
            step={0.5}
            value={activeFontPct}
            onChange={(e) => updateActive({ fontPct: Number(e.target.value) })}
            className="mt-1.5 w-full"
          />
        </div>
      )}
      <Select
        label="글꼴"
        value={value.fontFamily}
        onChange={(e) => onChange({ ...value, fontFamily: e.target.value })}
      >
        {ENGRAVE_FONTS.map((f) => (
          <option key={f.value} value={f.value} style={{ fontFamily: `"${f.value}", serif` }}>
            {f.label}
          </option>
        ))}
      </Select>
      <button
        type="button"
        onClick={() => onChange(defaultEngraveOverride(product, showPhotoTab))}
        className="text-sm text-muted-foreground underline"
      >
        기본값으로 되돌리기
      </button>
    </>
  )

  return (
    <div className="space-y-3 rounded-xl border border-border p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-base font-semibold text-foreground">{label}</p>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="shrink-0 text-sm text-accent underline"
        >
          크게 보기
        </button>
      </div>
      {renderPreview(false)}
      {renderControls()}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={`${label} 각인 위치 조정`}>
        <div className="space-y-4">
          {renderPreview(true)}
          {renderControls()}
        </div>
      </Modal>
    </div>
  )
}

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

function CollapsibleSection({
  title,
  summary,
  defaultOpen = true,
  children,
}: {
  title: string
  summary?: string
  defaultOpen?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="space-y-3 border-t border-border pt-4 first:border-t-0 first:pt-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3"
      >
        <span className="flex items-center gap-2">
          <IconChevronRight
            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-90' : ''}`}
          />
          <span className="text-base font-semibold text-foreground">{title}</span>
        </span>
        {!open && summary && <span className="truncate text-sm text-muted-foreground">{summary}</span>}
      </button>
      {open && <div className="space-y-3 pl-6">{children}</div>}
    </div>
  )
}

const extraProductTypeLabel: Record<ProductType, string> = {
  urn: '유골함',
  tablet: '위패',
  other: '기타',
}

interface CartItem {
  product: Product
  quantity: number
}

function ProductSearchGrid({
  products,
  fixedType,
  selectedIds = [],
  onSelect,
}: {
  products: Product[]
  fixedType?: ProductType
  selectedIds?: string[]
  onSelect: (product: Product) => void
}) {
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | ProductType>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const scoped = useMemo(
    () => (fixedType ? products.filter((p) => p.type === fixedType) : products),
    [products, fixedType],
  )
  const categories = useMemo(() => Array.from(new Set(scoped.map((p) => p.category))), [scoped])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return scoped.filter(
      (p) =>
        (fixedType || typeFilter === 'all' || p.type === typeFilter) &&
        (categoryFilter === 'all' || p.category === categoryFilter) &&
        (q === '' ||
          p.name.toLowerCase().includes(q) ||
          p.model_code.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)),
    )
  }, [scoped, fixedType, typeFilter, categoryFilter, query])

  return (
    <div className="space-y-3 rounded-lg border border-border p-3">
      <div className={`grid grid-cols-1 gap-2 ${fixedType ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="상품명, 모델코드로 검색"
          className="rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
        />
        {!fixedType && (
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'all' | ProductType)}
            className="rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="all">전체 분류</option>
            <option value="urn">유골함</option>
            <option value="tablet">위패</option>
            <option value="other">기타</option>
          </select>
        )}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="all">전체 카테고리</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="max-h-80 overflow-y-auto">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {filtered.map((p) => (
            <button
              type="button"
              key={p.id}
              onClick={() => onSelect(p)}
              className={`flex flex-col items-start gap-1 rounded-lg border p-2 text-left hover:border-accent ${
                selectedIds.includes(p.id) ? 'border-accent bg-accent/10' : 'border-border'
              }`}
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
              <p className="text-xs text-muted-foreground">
                {p.category} · {extraProductTypeLabel[p.type]}
              </p>
              <p className="text-sm text-accent">{p.price.toLocaleString()}원</p>
            </button>
          ))}
        </div>
        {filtered.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">조건에 맞는 상품이 없습니다.</p>
        )}
      </div>
    </div>
  )
}

function SingleProductSection({
  products,
  type,
  selectedId,
  onSelect,
}: {
  products: Product[]
  type: 'urn' | 'tablet'
  selectedId: string | null
  onSelect: (product: Product | null) => void
}) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const selected = products.find((p) => p.id === selectedId) ?? null

  if (selected && !pickerOpen) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-input px-4 py-3">
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
            onClick={() => setPickerOpen(true)}
            className="shrink-0 text-sm text-accent underline"
          >
            변경
          </button>
        </div>
        <button type="button" onClick={() => onSelect(null)} className="text-sm text-muted-foreground underline">
          선택 취소
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <ProductSearchGrid
        products={products}
        fixedType={type}
        selectedIds={selectedId ? [selectedId] : []}
        onSelect={(p) => {
          onSelect(p)
          setPickerOpen(false)
        }}
      />
      {selected && (
        <button type="button" onClick={() => setPickerOpen(false)} className="text-sm text-muted-foreground underline">
          닫기
        </button>
      )}
    </div>
  )
}

function ExtraItemsList({
  items,
  onChangeQuantity,
  onRemove,
}: {
  items: CartItem[]
  onChangeQuantity: (productId: string, quantity: number) => void
  onRemove: (productId: string) => void
}) {
  if (items.length === 0) return null
  const total = items.reduce((sum, it) => sum + it.product.price * it.quantity, 0)
  return (
    <div className="space-y-2">
      {items.map((it) => (
        <div
          key={it.product.id}
          className="flex items-center gap-3 rounded-lg border border-border bg-input px-4 py-3"
        >
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded bg-white">
            {it.product.image_url && (
              <img src={it.product.image_url} alt={it.product.name} className="h-full w-full object-contain" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{it.product.name}</p>
            <p className="text-sm text-muted-foreground">{it.product.price.toLocaleString()}원</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onChangeQuantity(it.product.id, Math.max(1, it.quantity - 1))}
              className="h-7 w-7 rounded-full border border-border text-muted-foreground hover:border-accent hover:text-accent"
            >
              −
            </button>
            <span className="w-6 text-center text-sm text-foreground">{it.quantity}</span>
            <button
              type="button"
              onClick={() => onChangeQuantity(it.product.id, it.quantity + 1)}
              className="h-7 w-7 rounded-full border border-border text-muted-foreground hover:border-accent hover:text-accent"
            >
              +
            </button>
          </div>
          <button
            type="button"
            onClick={() => onRemove(it.product.id)}
            className="shrink-0 text-sm text-muted-foreground underline"
          >
            삭제
          </button>
        </div>
      ))}
      <p className="text-right text-base font-semibold text-foreground">
        추가 상품 합계 {total.toLocaleString()}원
      </p>
    </div>
  )
}

export default function OrderNew() {
  const { profile } = useAuth()
  const [searchParams] = useSearchParams()

  const [products, setProducts] = useState<Product[]>([])
  const [urnId, setUrnId] = useState<string | null>(searchParams.get('urn'))
  const [tabletId, setTabletId] = useState<string | null>(searchParams.get('tablet'))
  const [extraItems, setExtraItems] = useState<CartItem[]>([])
  const [queryItemAdded, setQueryItemAdded] = useState(false)

  const [religion, setReligion] = useState<string>('')
  const [deceasedName, setDeceasedName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [birthDateType, setBirthDateType] = useState<string>('양한자')
  const [deathDate, setDeathDate] = useState('')
  const [deathDateType, setDeathDateType] = useState<string>('양한자')
  const [urnDateStyle, setUrnDateStyle] = useState<'hanja' | 'dot'>('hanja')
  const [tabletDateStyle, setTabletDateStyle] = useState<'hanja' | 'dot'>('hanja')

  const [funeralHome, setFuneralHome] = useState('')
  const [crematorium, setCrematorium] = useState('')
  const [crematoriumCustom, setCrematoriumCustom] = useState('')
  const [cremationDatetime, setCremationDatetime] = useState('')
  const [burialPlace, setBurialPlace] = useState('')

  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')

  const [hasSpecialNotes, setHasSpecialNotes] = useState(false)
  const [specialNotes, setSpecialNotes] = useState('')

  const [tabletPhotoFile, setTabletPhotoFile] = useState<File | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const tabletPhotoPreviewUrl = useMemo(
    () => (tabletPhotoFile ? URL.createObjectURL(tabletPhotoFile) : null),
    [tabletPhotoFile],
  )
  useEffect(() => {
    return () => {
      if (tabletPhotoPreviewUrl) URL.revokeObjectURL(tabletPhotoPreviewUrl)
    }
  }, [tabletPhotoPreviewUrl])

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('products')
        .select(
          'id, category, type, name, model_code, spec, price, image_url, is_active, engrave_x_pct, engrave_y_pct, engrave_font_pct, engrave_color, engrave_birth_x_pct, engrave_birth_y_pct, engrave_birth_font_pct, engrave_death_x_pct, engrave_death_y_pct, engrave_death_font_pct, engrave_religion_x_pct, engrave_religion_y_pct, engrave_religion_font_pct, engrave_photo_x_pct, engrave_photo_y_pct, engrave_photo_size_pct',
        )
        .eq('is_active', true)
        .order('category')
        .order('name')
      setProducts((data as Product[]) ?? [])
    }
    load()
  }, [])

  useEffect(() => {
    if (queryItemAdded || products.length === 0) return
    const itemId = searchParams.get('item')
    const product = itemId ? products.find((p) => p.id === itemId) : undefined
    if (product) {
      setExtraItems((prev) => [...prev, { product, quantity: 1 }])
    }
    setQueryItemAdded(true)
  }, [products, queryItemAdded, searchParams])

  const addExtraItem = (product: Product) => {
    setExtraItems((prev) => {
      const existing = prev.find((it) => it.product.id === product.id)
      if (existing) {
        return prev.map((it) => (it.product.id === product.id ? { ...it, quantity: it.quantity + 1 } : it))
      }
      return [...prev, { product, quantity: 1 }]
    })
  }
  const changeExtraItemQuantity = (productId: string, quantity: number) => {
    setExtraItems((prev) => prev.map((it) => (it.product.id === productId ? { ...it, quantity } : it)))
  }
  const removeExtraItem = (productId: string) => {
    setExtraItems((prev) => prev.filter((it) => it.product.id !== productId))
  }

  const urnProduct = products.find((p) => p.id === urnId) ?? null
  const tabletProduct = products.find((p) => p.id === tabletId) ?? null
  const extraItemsTotal = useMemo(
    () => extraItems.reduce((sum, it) => sum + it.product.price * it.quantity, 0),
    [extraItems],
  )

  const [urnEngrave, setUrnEngrave] = useState<EngraveOverride | null>(null)
  const [tabletEngrave, setTabletEngrave] = useState<EngraveOverride | null>(null)

  const engraveTexts = useMemo(
    () => ({
      name: deceasedName,
      birth: formatBirthEngrave(birthDate, birthDateType),
      death: formatDeathEngrave(deathDate, deathDateType, religion),
      religion: religionSymbol(religion),
    }),
    [deceasedName, birthDate, birthDateType, deathDate, deathDateType, religion],
  )

  const urnEngraveTexts = useMemo(
    () =>
      urnDateStyle === 'dot'
        ? {
            name: deceasedName,
            birth: formatBirthEngraveDot(birthDate),
            death: formatDeathEngraveDot(deathDate, religion),
            religion: religionSymbol(religion),
          }
        : engraveTexts,
    [urnDateStyle, engraveTexts, deceasedName, birthDate, deathDate, religion],
  )

  const tabletEngraveTexts = useMemo(
    () =>
      tabletDateStyle === 'dot'
        ? {
            name: deceasedName,
            birth: formatBirthEngraveDot(birthDate),
            death: formatDeathEngraveDot(deathDate, religion),
            religion: religionSymbol(religion),
          }
        : engraveTexts,
    [tabletDateStyle, engraveTexts, deceasedName, birthDate, deathDate, religion],
  )

  const hasTabletPhoto = !!tabletPhotoPreviewUrl

  useEffect(() => {
    setUrnEngrave(urnProduct ? defaultEngraveOverride(urnProduct) : null)
  }, [urnProduct?.id])

  useEffect(() => {
    setTabletEngrave(tabletProduct ? defaultEngraveOverride(tabletProduct, hasTabletPhoto) : null)
  }, [tabletProduct?.id, hasTabletPhoto])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!profile) return
    if (!urnId && !tabletId) {
      setError('유골함 또는 위패 중 하나 이상을 선택해주세요.')
      return
    }
    setSubmitting(true)
    setError(null)

    const finalCrematorium = crematorium === CUSTOM_CREMATORIUM ? crematoriumCustom : crematorium

    let tabletPhotoUrl: string | null = null
    if (tabletPhotoFile) {
      const ext = tabletPhotoFile.name.split('.').pop() ?? 'jpg'
      const path = `${profile.id}/${crypto.randomUUID()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('order-photos')
        .upload(path, tabletPhotoFile, { contentType: tabletPhotoFile.type })
      if (uploadError) {
        setSubmitting(false)
        setError('사진 업로드 실패: ' + uploadError.message)
        return
      }
      const { data: signedData, error: signError } = await supabase.storage
        .from('order-photos')
        .createSignedUrl(path, 60 * 60 * 24 * 365 * 10)
      if (signError || !signedData) {
        setSubmitting(false)
        setError('사진 URL 생성 실패: ' + (signError?.message ?? ''))
        return
      }
      tabletPhotoUrl = signedData.signedUrl
    }

    const { data: insertedOrder, error: insertError } = await supabase.from('orders').insert({
      sales_rep_id: profile.id,
      organization_id: profile.organization_id,
      urn_product_id: urnId,
      urn_price: urnProduct?.price ?? null,
      tablet_product_id: tabletId,
      tablet_price: tabletProduct?.price ?? null,
      urn_engrave_x_pct: urnEngrave?.elements.name?.xPct ?? null,
      urn_engrave_y_pct: urnEngrave?.elements.name?.yPct ?? null,
      urn_engrave_font_pct: urnEngrave?.elements.name?.fontPct ?? null,
      urn_engrave_font_family: urnEngrave?.fontFamily ?? null,
      urn_birth_x_pct: urnEngrave?.elements.birth?.xPct ?? null,
      urn_birth_y_pct: urnEngrave?.elements.birth?.yPct ?? null,
      urn_birth_font_pct: urnEngrave?.elements.birth?.fontPct ?? null,
      urn_death_x_pct: urnEngrave?.elements.death?.xPct ?? null,
      urn_death_y_pct: urnEngrave?.elements.death?.yPct ?? null,
      urn_death_font_pct: urnEngrave?.elements.death?.fontPct ?? null,
      urn_religion_x_pct: urnEngrave?.elements.religion?.xPct ?? null,
      urn_religion_y_pct: urnEngrave?.elements.religion?.yPct ?? null,
      urn_religion_font_pct: urnEngrave?.elements.religion?.fontPct ?? null,
      urn_date_style: urnDateStyle,
      tablet_engrave_x_pct: tabletEngrave?.elements.name?.xPct ?? null,
      tablet_engrave_y_pct: tabletEngrave?.elements.name?.yPct ?? null,
      tablet_engrave_font_pct: tabletEngrave?.elements.name?.fontPct ?? null,
      tablet_engrave_font_family: tabletEngrave?.fontFamily ?? null,
      tablet_birth_x_pct: tabletEngrave?.elements.birth?.xPct ?? null,
      tablet_birth_y_pct: tabletEngrave?.elements.birth?.yPct ?? null,
      tablet_birth_font_pct: tabletEngrave?.elements.birth?.fontPct ?? null,
      tablet_death_x_pct: tabletEngrave?.elements.death?.xPct ?? null,
      tablet_death_y_pct: tabletEngrave?.elements.death?.yPct ?? null,
      tablet_death_font_pct: tabletEngrave?.elements.death?.fontPct ?? null,
      tablet_religion_x_pct: tabletEngrave?.elements.religion?.xPct ?? null,
      tablet_religion_y_pct: tabletEngrave?.elements.religion?.yPct ?? null,
      tablet_religion_font_pct: tabletEngrave?.elements.religion?.fontPct ?? null,
      tablet_date_style: tabletDateStyle,
      tablet_photo_url: tabletPhotoUrl,
      tablet_photo_x_pct: tabletPhotoUrl ? tabletEngrave?.photo?.xPct ?? null : null,
      tablet_photo_y_pct: tabletPhotoUrl ? tabletEngrave?.photo?.yPct ?? null : null,
      tablet_photo_size_pct: tabletPhotoUrl ? tabletEngrave?.photo?.sizePct ?? null : null,
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
    }).select('id').single()

    if (insertError || !insertedOrder) {
      setSubmitting(false)
      setError('주문서 저장 실패: ' + (insertError?.message ?? ''))
      return
    }

    if (extraItems.length > 0) {
      const { error: itemsError } = await supabase.from('order_items').insert(
        extraItems.map((it) => ({
          order_id: insertedOrder.id,
          product_id: it.product.id,
          product_name: it.product.name,
          unit_price: it.product.price,
          quantity: it.quantity,
        })),
      )
      if (itemsError) {
        setSubmitting(false)
        setError('추가 상품 저장 실패: ' + itemsError.message)
        return
      }
    }

    setSubmitting(false)
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
      <PageHeader />
      <div className="mx-auto max-w-2xl lg:max-w-4xl xl:max-w-5xl">
        <h1 className="mb-6 font-serif-kr text-2xl font-bold text-foreground">주문서 작성</h1>

        <form onSubmit={handleSubmit} className="lg:grid lg:grid-cols-[1fr_340px] lg:items-start lg:gap-6">
        <div className="space-y-8 rounded-2xl border border-border bg-surface/80 p-7 shadow-[0_22px_50px_-20px_rgba(0,0,0,0.35)] backdrop-blur">
          <section className="space-y-4">
            <h2 className="font-serif-kr text-lg font-bold text-foreground">상품 선택</h2>

            <CollapsibleSection title="유골함" summary={urnProduct ? urnProduct.name : '미선택'}>
              <p className="text-sm text-muted-foreground">위패와 최소 1개는 선택해야 합니다.</p>
              <SingleProductSection
                products={products}
                type="urn"
                selectedId={urnId}
                onSelect={(p) => setUrnId(p?.id ?? null)}
              />
            </CollapsibleSection>

            <CollapsibleSection title="위패" summary={tabletProduct ? tabletProduct.name : '미선택'}>
              <p className="text-sm text-muted-foreground">유골함과 최소 1개는 선택해야 합니다.</p>
              <SingleProductSection
                products={products}
                type="tablet"
                selectedId={tabletId}
                onSelect={(p) => {
                  setTabletId(p?.id ?? null)
                  if (!p) setTabletPhotoFile(null)
                }}
              />
              {tabletProduct && (
                <div>
                  <label className="block text-base font-medium text-muted-foreground">
                    고인 사진 (선택, 위패 각인 미리보기용)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setTabletPhotoFile(e.target.files?.[0] ?? null)}
                    className="mt-1.5 w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-accent file:px-3 file:py-2 file:text-sm file:font-medium file:text-accent-foreground"
                  />
                  {tabletPhotoFile && (
                    <button
                      type="button"
                      onClick={() => setTabletPhotoFile(null)}
                      className="mt-1.5 text-sm text-muted-foreground underline"
                    >
                      사진 제거
                    </button>
                  )}
                </div>
              )}
            </CollapsibleSection>

            <CollapsibleSection
              title="기타 (추가 상품)"
              summary={extraItems.length > 0 ? `${extraItems.length}개 · ${extraItemsTotal.toLocaleString()}원` : '없음'}
            >
              <ExtraItemsList
                items={extraItems}
                onChangeQuantity={changeExtraItemQuantity}
                onRemove={removeExtraItem}
              />
              <ProductSearchGrid products={products} fixedType="other" onSelect={addExtraItem} />
            </CollapsibleSection>
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

            {urnProduct && (
              <div>
                <label className="block text-base font-medium text-muted-foreground">
                  유골함 표기 스타일
                </label>
                <div className="mt-1.5 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setUrnDateStyle('hanja')}
                    className={`flex-1 rounded-lg border px-4 py-3 text-base ${
                      urnDateStyle === 'hanja'
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-border text-muted-foreground'
                    }`}
                  >
                    한자 병기
                  </button>
                  <button
                    type="button"
                    onClick={() => setUrnDateStyle('dot')}
                    className={`flex-1 rounded-lg border px-4 py-3 text-base ${
                      urnDateStyle === 'dot'
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-border text-muted-foreground'
                    }`}
                  >
                    점 표기 간단
                  </button>
                </div>
              </div>
            )}

            {tabletProduct && (
              <div>
                <label className="block text-base font-medium text-muted-foreground">
                  위패 표기 스타일
                </label>
                <div className="mt-1.5 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setTabletDateStyle('hanja')}
                    className={`flex-1 rounded-lg border px-4 py-3 text-base ${
                      tabletDateStyle === 'hanja'
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-border text-muted-foreground'
                    }`}
                  >
                    한자 병기
                  </button>
                  <button
                    type="button"
                    onClick={() => setTabletDateStyle('dot')}
                    className={`flex-1 rounded-lg border px-4 py-3 text-base ${
                      tabletDateStyle === 'dot'
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-border text-muted-foreground'
                    }`}
                  >
                    점 표기 간단
                  </button>
                </div>
              </div>
            )}

            {(urnProduct || tabletProduct) && (
              <div className="space-y-3 lg:hidden">
                <p className="text-base font-medium text-muted-foreground">
                  각인 미리보기 — 위치·크기·글꼴을 조정할 수 있습니다
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {urnProduct && urnEngrave && (
                    <EngraveEditor
                      label="유골함"
                      product={urnProduct}
                      texts={urnEngraveTexts}
                      value={urnEngrave}
                      onChange={setUrnEngrave}
                    />
                  )}
                  {tabletProduct && tabletEngrave && (
                    <EngraveEditor
                      label="위패"
                      product={tabletProduct}
                      texts={tabletEngraveTexts}
                      photoUrl={tabletPhotoPreviewUrl}
                      value={tabletEngrave}
                      onChange={setTabletEngrave}
                    />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  실제 각인 위치는 상품 제작 시 미세하게 달라질 수 있습니다.
                </p>
              </div>
            )}

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
        </div>

        {(urnProduct || tabletProduct) && (
          <div className="hidden space-y-3 lg:sticky lg:top-10 lg:block">
            <p className="text-base font-medium text-muted-foreground">
              각인 미리보기 — 위치·크기·글꼴을 조정할 수 있습니다
            </p>
            <div className="space-y-4">
              {urnProduct && urnEngrave && (
                <EngraveEditor
                  label="유골함"
                  product={urnProduct}
                  texts={urnEngraveTexts}
                  value={urnEngrave}
                  onChange={setUrnEngrave}
                />
              )}
              {tabletProduct && tabletEngrave && (
                <EngraveEditor
                  label="위패"
                  product={tabletProduct}
                  texts={tabletEngraveTexts}
                  photoUrl={tabletPhotoPreviewUrl}
                  value={tabletEngrave}
                  onChange={setTabletEngrave}
                />
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              실제 각인 위치는 상품 제작 시 미세하게 달라질 수 있습니다.
            </p>
          </div>
        )}
      </form>
      </div>
    </div>
  )
}
