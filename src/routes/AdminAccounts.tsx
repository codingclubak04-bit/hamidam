import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { AdminShell } from '../components/AdminShell'
import { Field } from '../components/Field'
import { Select } from '../components/Select'

interface FormState {
  name: string
  phone: string
  email: string
  password: string
  role: 'super_admin' | 'org_admin'
  organizationId: string
}

interface PartnerOrg {
  id: string
  name: string
}

interface AdminRow {
  id: string
  role: 'super_admin' | 'org_admin'
  name: string
  phone: string | null
  status: string
  organizations: { name: string } | null
}

const initialForm: FormState = {
  name: '',
  phone: '',
  email: '',
  password: '',
  role: 'super_admin',
  organizationId: '',
}

export default function AdminAccounts() {
  const { profile } = useAuth()
  const [admins, setAdmins] = useState<AdminRow[]>([])
  const [orgs, setOrgs] = useState<PartnerOrg[]>([])
  const [form, setForm] = useState<FormState>(initialForm)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const loadAdmins = async () => {
    const { data, error: loadError } = await supabase
      .from('profiles')
      .select('id, role, name, phone, status, organizations!profiles_organization_id_fkey(name)')
      .in('role', ['super_admin', 'org_admin'])
      .order('role')
      .order('name')

    if (loadError) {
      console.error('관리자 목록 조회 실패:', loadError.message)
      return
    }
    setAdmins((data as unknown as AdminRow[]) ?? [])
  }

  useEffect(() => {
    loadAdmins()
    supabase.rpc('list_partner_organizations').then(({ data, error: rpcError }) => {
      if (rpcError) {
        console.error('회사 목록 조회 실패:', rpcError.message)
        return
      }
      setOrgs(data ?? [])
    })
  }, [])

  const update = (key: keyof FormState) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (form.role === 'org_admin' && !form.organizationId) {
      setError('조직관리자는 소속 회사를 선택해야 합니다.')
      return
    }

    setLoading(true)
    const { data, error: invokeError } = await supabase.functions.invoke('admin-create-admin', {
      body: {
        name: form.name,
        phone: form.phone,
        email: form.email,
        password: form.password,
        role: form.role,
        organizationId: form.role === 'org_admin' ? form.organizationId : undefined,
      },
    })

    setLoading(false)

    if (invokeError || data?.error) {
      setError('등록 실패: ' + (data?.error ?? invokeError?.message ?? '알 수 없는 오류'))
      return
    }

    setSuccess(`"${form.name}" 관리자 계정이 등록되었습니다.`)
    setForm(initialForm)
    loadAdmins()
  }

  const toggleStatus = async (row: AdminRow) => {
    setUpdatingId(row.id)
    const nextStatus = row.status === 'disabled' ? 'active' : 'disabled'
    const { error: updateError } = await supabase.from('profiles').update({ status: nextStatus }).eq('id', row.id)
    setUpdatingId(null)

    if (updateError) {
      setError('상태 변경 실패: ' + updateError.message)
      return
    }
    setError(null)
    loadAdmins()
  }

  const roleLabel = { super_admin: '슈퍼관리자', org_admin: '조직관리자' } as const

  return (
    <AdminShell title="관리자 계정 관리">
      <section className="rounded-2xl border border-border bg-surface/80 p-7 shadow-[0_22px_50px_-20px_rgba(0,0,0,0.35)] backdrop-blur">
        <h2 className="font-serif-kr text-xl font-bold text-foreground">신규 관리자 등록</h2>
        <p className="mt-1 text-base text-muted-foreground">
          슈퍼관리자 또는 특정 파트너사의 조직관리자 계정을 새로 발급합니다.
        </p>
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <Field label="성함" value={form.name} onChange={update('name')} />
          <Field label="연락처" value={form.phone} onChange={update('phone')} />
          <Field label="이메일(로그인 아이디)" type="email" value={form.email} onChange={update('email')} />
          <Field label="임시 비밀번호" type="password" value={form.password} onChange={update('password')} />
          <Select label="역할" value={form.role} onChange={update('role')}>
            <option value="super_admin">슈퍼관리자</option>
            <option value="org_admin">조직관리자</option>
          </Select>
          {form.role === 'org_admin' && (
            <Select label="소속 회사" value={form.organizationId} onChange={update('organizationId')}>
              <option value="">선택해주세요</option>
              {orgs.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </Select>
          )}
          {error && <p className="text-base text-destructive">{error}</p>}
          {success && <p className="text-base text-accent">{success}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-linear-to-r from-accent-light to-accent px-4 py-3 text-base font-semibold text-accent-foreground hover:brightness-105 disabled:opacity-50"
          >
            {loading ? '등록 중...' : '관리자 등록'}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-border bg-surface/80 p-7 shadow-[0_22px_50px_-20px_rgba(0,0,0,0.35)] backdrop-blur">
        <h2 className="font-serif-kr text-xl font-bold text-foreground">전체 관리자 ({admins.length})</h2>
        <ul className="mt-4 divide-y divide-border">
          {admins.map((row) => (
            <li key={row.id} className="flex items-center justify-between gap-4 py-3">
              <div>
                <p className="text-base font-semibold text-foreground">
                  {row.name}
                  <span className="ml-2 rounded-full bg-accent/15 px-2.5 py-0.5 text-sm font-medium text-accent">
                    {roleLabel[row.role]}
                  </span>
                  {row.status === 'disabled' && (
                    <span className="ml-2 rounded-full bg-destructive/15 px-2.5 py-0.5 text-sm font-medium text-destructive">
                      비활성화됨
                    </span>
                  )}
                </p>
                <p className="text-base text-muted-foreground">
                  {row.phone || '연락처 미입력'} · {row.organizations?.name ?? '소속 없음'}
                </p>
              </div>
              {row.id !== profile?.id && (
                <button
                  onClick={() => toggleStatus(row)}
                  disabled={updatingId === row.id}
                  className={
                    'shrink-0 rounded-lg px-4 py-2 text-base font-semibold disabled:opacity-50 ' +
                    (row.status === 'disabled'
                      ? 'bg-linear-to-r from-accent-light to-accent text-accent-foreground hover:brightness-105'
                      : 'border border-border text-muted-foreground hover:border-destructive hover:text-destructive')
                  }
                >
                  {row.status === 'disabled' ? '활성화' : '비활성화'}
                </button>
              )}
            </li>
          ))}
          {admins.length === 0 && <li className="py-3 text-base text-muted-foreground">등록된 관리자가 없습니다.</li>}
        </ul>
      </section>
    </AdminShell>
  )
}
