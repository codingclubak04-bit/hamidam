import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { AdminShell } from '../components/AdminShell'
import { Field } from '../components/Field'
import type { Organization } from '../lib/types'

interface FormState {
  orgName: string
  businessRegNo: string
  orgContactPhone: string
  adminName: string
  adminPhone: string
  adminEmail: string
  adminPassword: string
}

const initialForm: FormState = {
  orgName: '',
  businessRegNo: '',
  orgContactPhone: '',
  adminName: '',
  adminPhone: '',
  adminEmail: '',
  adminPassword: '',
}

export default function AdminPartners() {
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [form, setForm] = useState<FormState>(initialForm)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const loadOrgs = async () => {
    const { data, error: loadError } = await supabase
      .from('organizations')
      .select('*')
      .eq('type', 'partner_company')
      .order('created_at', { ascending: false })
    if (loadError) {
      console.error('파트너사 목록 조회 실패:', loadError.message)
      return
    }
    setOrgs(data ?? [])
  }

  useEffect(() => {
    loadOrgs()
  }, [])

  const update = (key: keyof FormState) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    const { data, error: invokeError } = await supabase.functions.invoke('admin-create-partner', {
      body: {
        orgName: form.orgName,
        businessRegNo: form.businessRegNo,
        orgContactPhone: form.orgContactPhone,
        adminName: form.adminName,
        adminPhone: form.adminPhone,
        adminEmail: form.adminEmail,
        adminPassword: form.adminPassword,
      },
    })

    setLoading(false)

    if (invokeError || data?.error) {
      setError('등록 실패: ' + (data?.error ?? invokeError?.message ?? '알 수 없는 오류'))
      return
    }

    setSuccess(`"${form.orgName}" 등록 및 담당자 계정 생성이 완료되었습니다.`)
    setForm(initialForm)
    loadOrgs()
  }

  return (
    <AdminShell title="파트너사 관리">
      <section className="rounded-2xl border border-border bg-surface/80 p-7 shadow-[0_22px_50px_-20px_rgba(0,0,0,0.35)] backdrop-blur">
        <h2 className="font-serif-kr text-xl font-bold text-foreground">신규 파트너사 등록</h2>
        <p className="mt-1 text-base text-muted-foreground">
          회사 정보와 담당자 로그인 정보를 함께 등록하면 즉시 사용 가능한 계정이 생성됩니다.
        </p>
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <Field label="장례회사명" value={form.orgName} onChange={update('orgName')} />
          <Field label="사업자등록번호" value={form.businessRegNo} onChange={update('businessRegNo')} />
          <Field label="대표 연락처" value={form.orgContactPhone} onChange={update('orgContactPhone')} />
          <Field label="담당자 성함" value={form.adminName} onChange={update('adminName')} />
          <Field label="담당자 연락처" value={form.adminPhone} onChange={update('adminPhone')} />
          <Field label="담당자 이메일(로그인 아이디)" type="email" value={form.adminEmail} onChange={update('adminEmail')} />
          <Field label="임시 비밀번호" type="password" value={form.adminPassword} onChange={update('adminPassword')} />
          {error && <p className="text-base text-destructive">{error}</p>}
          {success && <p className="text-base text-accent">{success}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gradient-to-r from-accent-light to-accent px-4 py-3 text-base font-semibold text-accent-foreground hover:brightness-105 disabled:opacity-50"
          >
            {loading ? '등록 중...' : '파트너사 등록'}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-border bg-surface/80 p-7 shadow-[0_22px_50px_-20px_rgba(0,0,0,0.35)] backdrop-blur">
        <h2 className="font-serif-kr text-xl font-bold text-foreground">등록된 파트너사 ({orgs.length})</h2>
        <ul className="mt-4 divide-y divide-border">
          {orgs.map((org) => (
            <li key={org.id} className="py-3">
              <p className="text-base font-semibold text-foreground">{org.name}</p>
              <p className="text-base text-muted-foreground">
                {org.business_reg_no || '사업자번호 미입력'} · {org.contact_phone || '연락처 미입력'}
              </p>
            </li>
          ))}
          {orgs.length === 0 && <li className="py-3 text-base text-muted-foreground">등록된 파트너사가 없습니다.</li>}
        </ul>
      </section>
    </AdminShell>
  )
}
