import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { AdminShell } from '../components/AdminShell'
import { Field } from '../components/Field'
import { Select } from '../components/Select'
import type { ProductType } from '../lib/types'

interface FormState {
  category: string
  type: ProductType
  name: string
  model_code: string
  spec: string
  price: string
}

const initialForm: FormState = {
  category: '',
  type: 'urn',
  name: '',
  model_code: '',
  spec: '',
  price: '',
}

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

  useEffect(() => {
    if (!isEdit) return
    const load = async () => {
      const { data, error: loadError } = await supabase
        .from('products')
        .select('category, type, name, model_code, spec, price, image_url')
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
