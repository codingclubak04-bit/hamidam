import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { AdminShell } from '../components/AdminShell'
import { Field } from '../components/Field'
import { Select } from '../components/Select'
import { Modal } from '../components/Modal'
import { EngravePreview, type EngraveElement, type EngravePhoto } from '../components/EngravePreview'
import { formatBirthEngrave, formatDeathEngrave, religionSymbol } from '../lib/engrave'
import type { ProductType } from '../lib/types'

interface FormState {
  category: string
  type: ProductType
  name: string
  model_code: string
  spec: string
  price: string
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
  engrave_photo_x_pct: number
  engrave_photo_y_pct: number
  engrave_photo_size_pct: number
}

const SILHOUETTE_PHOTO_URL =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 130"><rect width="100" height="130" fill="#d9d9d9"/><circle cx="50" cy="45" r="24" fill="#a8a8a8"/><path d="M12 122c4-30 26-46 38-46s34 16 38 46z" fill="#a8a8a8"/></svg>`,
  )

const initialForm: FormState = {
  category: '',
  type: 'urn',
  name: '',
  model_code: '',
  spec: '',
  price: '',
  engrave_x_pct: 50,
  engrave_y_pct: 70,
  engrave_font_pct: 6,
  engrave_color: '#1a1a1a',
  engrave_birth_x_pct: 25,
  engrave_birth_y_pct: 55,
  engrave_birth_font_pct: 3,
  engrave_death_x_pct: 75,
  engrave_death_y_pct: 55,
  engrave_death_font_pct: 3,
  engrave_religion_x_pct: 50,
  engrave_religion_y_pct: 20,
  engrave_religion_font_pct: 8,
  engrave_photo_x_pct: 50,
  engrave_photo_y_pct: 24,
  engrave_photo_size_pct: 20,
}

const TABLET_ELEMENT_KEYS = ['name', 'birth', 'death', 'religion'] as const
type TabletElementKey = (typeof TABLET_ELEMENT_KEYS)[number]
type TabletTabKey = TabletElementKey | 'photo'
const TABLET_TAB_KEYS: readonly TabletTabKey[] = [...TABLET_ELEMENT_KEYS, 'photo']
const TABLET_ELEMENT_LABELS: Record<TabletTabKey, string> = {
  name: '이름',
  birth: '생년월일',
  death: '사망년월일',
  religion: '종교기호',
  photo: '사진',
}

const ELEMENT_FIELD_KEYS: Record<TabletElementKey, { x: keyof FormState; y: keyof FormState; font: keyof FormState }> = {
  name: { x: 'engrave_x_pct', y: 'engrave_y_pct', font: 'engrave_font_pct' },
  birth: { x: 'engrave_birth_x_pct', y: 'engrave_birth_y_pct', font: 'engrave_birth_font_pct' },
  death: { x: 'engrave_death_x_pct', y: 'engrave_death_y_pct', font: 'engrave_death_font_pct' },
  religion: { x: 'engrave_religion_x_pct', y: 'engrave_religion_y_pct', font: 'engrave_religion_font_pct' },
}

const SAMPLE_RELIGIONS = ['선택 안 함', '기독교', '천주교', '불교', '원불교'] as const

export default function AdminProductForm() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [form, setForm] = useState<FormState>(initialForm)
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sampleName, setSampleName] = useState('홍길동')
  const [sampleReligion, setSampleReligion] = useState<string>('기독교')
  const [activeKey, setActiveKey] = useState<TabletTabKey>('name')
  const [modalOpen, setModalOpen] = useState(false)

  const filePreviewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])
  useEffect(() => {
    return () => {
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl)
    }
  }, [filePreviewUrl])

  const previewImageUrl = filePreviewUrl ?? existingImageUrl

  const previewTexts: Record<TabletElementKey, string> = useMemo(() => {
    const religion = sampleReligion === '선택 안 함' ? '' : sampleReligion
    return {
      name: sampleName,
      birth: formatBirthEngrave('1950-01-01', '양한자'),
      death: formatDeathEngrave('2026-01-01', '양한자', religion),
      religion: religionSymbol(religion),
    }
  }, [sampleName, sampleReligion])

  const hasEngraveTabs = form.type !== 'other'

  const previewElements: EngraveElement[] = useMemo(() => {
    const keys: readonly TabletElementKey[] = hasEngraveTabs ? TABLET_ELEMENT_KEYS : ['name']
    return keys.map((key) => {
      const fields = ELEMENT_FIELD_KEYS[key]
      return {
        key,
        text: previewTexts[key],
        xPct: form[fields.x] as number,
        yPct: form[fields.y] as number,
        fontPct: form[fields.font] as number,
        color: form.engrave_color,
        vertical: hasEngraveTabs,
        anchor: key === 'birth' || key === 'death' ? 'top' : 'center',
      }
    })
  }, [form, previewTexts, hasEngraveTabs])

  const effectiveKey: TabletTabKey =
    hasEngraveTabs && (form.type === 'tablet' || activeKey !== 'photo') ? activeKey : 'name'
  const isPhotoActive = effectiveKey === 'photo'
  const activeFontPct = isPhotoActive
    ? 0
    : (form[ELEMENT_FIELD_KEYS[effectiveKey as TabletElementKey].font] as number)

  const previewPhoto: EngravePhoto | null =
    form.type === 'tablet'
      ? {
          key: 'photo',
          url: SILHOUETTE_PHOTO_URL,
          xPct: form.engrave_photo_x_pct,
          yPct: form.engrave_photo_y_pct,
          sizePct: form.engrave_photo_size_pct,
        }
      : null

  const renderEngraveControls = (large: boolean) => (
    <>
      <div className={large ? 'mx-auto w-full max-w-[min(85vh,520px)]' : 'max-w-xs'}>
        <EngravePreview
          imageUrl={previewImageUrl}
          elements={previewElements}
          photo={previewPhoto}
          activeKey={effectiveKey}
          onPositionPick={(key, x, y) => {
            if (key === 'photo') {
              setForm((f) => ({ ...f, engrave_photo_x_pct: x, engrave_photo_y_pct: y }))
              return
            }
            const fields = ELEMENT_FIELD_KEYS[key as TabletElementKey]
            setForm((f) => ({ ...f, [fields.x]: x, [fields.y]: y }))
          }}
          onActivate={(key) => setActiveKey(key as TabletTabKey)}
        />
      </div>
      {hasEngraveTabs && (
        <div className="flex flex-wrap gap-1.5">
          {(form.type === 'tablet' ? TABLET_TAB_KEYS : TABLET_ELEMENT_KEYS).map((key) => (
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
              {TABLET_ELEMENT_LABELS[key]}
            </button>
          ))}
        </div>
      )}
      {form.type === 'tablet' && activeKey === 'photo' && (
        <p className="text-xs text-muted-foreground">
          실루엣 아이콘은 위치 조정용 샘플입니다. 실제 각인 시에는 주문서에서 업로드한 고인 사진이
          여기에 표시됩니다.
        </p>
      )}
      <Field label="미리보기용 이름" value={sampleName} onChange={(e) => setSampleName(e.target.value)} />
      {hasEngraveTabs && (
        <Select label="미리보기용 종교" value={sampleReligion} onChange={(e) => setSampleReligion(e.target.value)}>
          {SAMPLE_RELIGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>
      )}
      {isPhotoActive ? (
        <div>
          <label className="block text-base font-medium text-muted-foreground">
            사진 크기 ({form.engrave_photo_size_pct}%)
          </label>
          <input
            type="range"
            min={8}
            max={45}
            step={0.5}
            value={form.engrave_photo_size_pct}
            onChange={(e) => setForm((f) => ({ ...f, engrave_photo_size_pct: Number(e.target.value) }))}
            className="mt-1.5 w-full"
          />
        </div>
      ) : (
        <div>
          <label className="block text-base font-medium text-muted-foreground">
            글자 크기 ({activeFontPct}%)
          </label>
          <input
            type="range"
            min={2}
            max={20}
            step={0.5}
            value={activeFontPct}
            onChange={(e) => {
              const fields = ELEMENT_FIELD_KEYS[effectiveKey as TabletElementKey]
              setForm((f) => ({ ...f, [fields.font]: Number(e.target.value) }))
            }}
            className="mt-1.5 w-full"
          />
        </div>
      )}
      <div className="flex items-center gap-3">
        <label className="text-base font-medium text-muted-foreground">글자 색상</label>
        <input
          type="color"
          value={form.engrave_color}
          onChange={(e) => setForm((f) => ({ ...f, engrave_color: e.target.value }))}
          className="h-10 w-16 rounded border border-border bg-input"
        />
      </div>
    </>
  )

  useEffect(() => {
    if (!isEdit) return
    const load = async () => {
      const { data, error: loadError } = await supabase
        .from('products')
        .select(
          'category, type, name, model_code, spec, price, image_url, engrave_x_pct, engrave_y_pct, engrave_font_pct, engrave_color, engrave_birth_x_pct, engrave_birth_y_pct, engrave_birth_font_pct, engrave_death_x_pct, engrave_death_y_pct, engrave_death_font_pct, engrave_religion_x_pct, engrave_religion_y_pct, engrave_religion_font_pct, engrave_photo_x_pct, engrave_photo_y_pct, engrave_photo_size_pct',
        )
        .eq('id', id)
        .single()

      if (loadError || !data) {
        setError('상품 조회 실패: ' + (loadError?.message ?? '알 수 없는 오류'))
        setLoading(false)
        return
      }

      setForm({
        category: data.category,
        type: data.type,
        name: data.name,
        model_code: data.model_code,
        spec: data.spec ?? '',
        price: String(data.price),
        engrave_x_pct: data.engrave_x_pct,
        engrave_y_pct: data.engrave_y_pct,
        engrave_font_pct: data.engrave_font_pct,
        engrave_color: data.engrave_color,
        engrave_birth_x_pct: data.engrave_birth_x_pct,
        engrave_birth_y_pct: data.engrave_birth_y_pct,
        engrave_birth_font_pct: data.engrave_birth_font_pct,
        engrave_death_x_pct: data.engrave_death_x_pct,
        engrave_death_y_pct: data.engrave_death_y_pct,
        engrave_death_font_pct: data.engrave_death_font_pct,
        engrave_religion_x_pct: data.engrave_religion_x_pct,
        engrave_religion_y_pct: data.engrave_religion_y_pct,
        engrave_religion_font_pct: data.engrave_religion_font_pct,
        engrave_photo_x_pct: data.engrave_photo_x_pct,
        engrave_photo_y_pct: data.engrave_photo_y_pct,
        engrave_photo_size_pct: data.engrave_photo_size_pct,
      })
      setExistingImageUrl(data.image_url)
      setLoading(false)
    }
    load()
  }, [id, isEdit])

  const update = (key: keyof FormState) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    const price = Number(form.price)
    if (!Number.isFinite(price) || price < 0) {
      setError('가격을 올바르게 입력해주세요.')
      return
    }

    setSaving(true)

    let imageUrl = existingImageUrl
    if (file) {
      const path = `${crypto.randomUUID()}-${file.name}`
      const { error: uploadError } = await supabase.storage.from('product-images').upload(path, file)
      if (uploadError) {
        setSaving(false)
        setError('이미지 업로드 실패: ' + uploadError.message)
        return
      }
      imageUrl = supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl
    }

    const payload = {
      category: form.category,
      type: form.type,
      name: form.name,
      model_code: form.model_code,
      spec: form.spec || null,
      price,
      image_url: imageUrl,
      engrave_x_pct: form.engrave_x_pct,
      engrave_y_pct: form.engrave_y_pct,
      engrave_font_pct: form.engrave_font_pct,
      engrave_color: form.engrave_color,
      engrave_birth_x_pct: form.engrave_birth_x_pct,
      engrave_birth_y_pct: form.engrave_birth_y_pct,
      engrave_birth_font_pct: form.engrave_birth_font_pct,
      engrave_death_x_pct: form.engrave_death_x_pct,
      engrave_death_y_pct: form.engrave_death_y_pct,
      engrave_death_font_pct: form.engrave_death_font_pct,
      engrave_religion_x_pct: form.engrave_religion_x_pct,
      engrave_religion_y_pct: form.engrave_religion_y_pct,
      engrave_religion_font_pct: form.engrave_religion_font_pct,
      engrave_photo_x_pct: form.engrave_photo_x_pct,
      engrave_photo_y_pct: form.engrave_photo_y_pct,
      engrave_photo_size_pct: form.engrave_photo_size_pct,
    }

    const { error: saveError } = isEdit
      ? await supabase.from('products').update(payload).eq('id', id)
      : await supabase.from('products').insert(payload)

    setSaving(false)

    if (saveError) {
      setError('저장 실패: ' + saveError.message)
      return
    }

    navigate('/admin/products')
  }

  if (loading) {
    return (
      <AdminShell title={isEdit ? '상품 수정' : '새 상품 등록'}>
        <p className="text-base text-muted-foreground">불러오는 중...</p>
      </AdminShell>
    )
  }

  return (
    <AdminShell title={isEdit ? '상품 수정' : '새 상품 등록'}>
      <section className="rounded-2xl border border-border bg-surface/80 p-7 shadow-[0_22px_50px_-20px_rgba(0,0,0,0.35)] backdrop-blur">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="카테고리" value={form.category} onChange={update('category')} />
          <Select label="분류" value={form.type} onChange={update('type')}>
            <option value="urn">유골함</option>
            <option value="tablet">위패</option>
            <option value="other">기타</option>
          </Select>
          <Field label="상품명" value={form.name} onChange={update('name')} />
          <Field label="모델코드" value={form.model_code} onChange={update('model_code')} />
          <div>
            <label className="block text-base font-medium text-muted-foreground">규격 (선택)</label>
            <input
              type="text"
              value={form.spec}
              onChange={(e) => setForm((f) => ({ ...f, spec: e.target.value }))}
              className="mt-1.5 w-full rounded-lg border border-border bg-input px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <Field label="가격" type="number" value={form.price} onChange={update('price')} />

          <div>
            <label className="block text-base font-medium text-muted-foreground">상품 이미지</label>
            {existingImageUrl && !file && (
              <img src={existingImageUrl} alt="현재 이미지" className="mt-2 h-24 w-24 rounded-lg object-cover" />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="mt-1.5 w-full text-base text-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-accent/15 file:px-4 file:py-2 file:text-base file:font-semibold file:text-accent hover:file:bg-accent/25"
            />
          </div>

          {previewImageUrl && (
            <div className="space-y-3 border-t border-border pt-4">
              <div className="flex items-center justify-between gap-2">
                <label className="block text-base font-medium text-muted-foreground">
                  각인 위치 조정 (텍스트를 드래그하거나 이미지를 클릭해 위치를 지정하세요)
                </label>
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="shrink-0 text-sm text-accent underline"
                >
                  크게 보기
                </button>
              </div>
              {renderEngraveControls(false)}
            </div>
          )}

          <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="각인 위치 조정">
            <div className="space-y-4">{renderEngraveControls(true)}</div>
          </Modal>

          {error && <p className="text-base text-destructive">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-linear-to-r from-accent-light to-accent px-4 py-3 text-base font-semibold text-accent-foreground hover:brightness-105 disabled:opacity-50"
          >
            {saving ? '저장 중...' : isEdit ? '수정 저장' : '상품 등록'}
          </button>
        </form>
      </section>
    </AdminShell>
  )
}
