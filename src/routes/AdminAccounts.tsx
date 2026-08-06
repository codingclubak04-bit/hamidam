import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { AdminShell } from '../components/AdminShell'
import { Field } from '../components/Field'
import { Select } from '../components/Select'
import { Modal } from '../components/Modal'

interface EditFormState {
  name: string
  phone: string
  role: 'super_admin' | 'org_admin'
  organizationId: string
}

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
  organization_id: string | null
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
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingAdmin, setEditingAdmin] = useState<AdminRow | null>(null)
  const [editForm, setEditForm] = useState<EditFormState>({ name: '', phone: '', role: 'super_admin', organizationId: '' })
  const [editError, setEditError] = useState<string | null>(null)
  const [editSaving, setEditSaving] = useState(false)
  const [mainTab, setMainTab] = useState<'register' | 'list'>('list')
  const [roleTab, setRoleTab] = useState<'all' | 'super_admin' | 'org_admin'>('all')
  const [search, setSearch] = useState('')

  const loadAdmins = async () => {
    const { data, error: loadError } = await supabase
      .from('profiles')
      .select('id, role, name, phone, status, organization_id, organizations!profiles_organization_id_fkey(name)')
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

  const roleCounts = useMemo(
    () => ({
      all: admins.length,
      super_admin: admins.filter((row) => row.role === 'super_admin').length,
      org_admin: admins.filter((row) => row.role === 'org_admin').length,
    }),
    [admins],
  )

  const filteredAdmins = useMemo(() => {
    const q = search.trim().toLowerCase()
    return admins.filter((row) => {
      if (roleTab !== 'all' && row.role !== roleTab) return false
      if (!q) return true
      return (
        row.name.toLowerCase().includes(q) ||
        (row.phone ?? '').toLowerCase().includes(q) ||
        (row.organizations?.name ?? '').toLowerCase().includes(q)
      )
    })
  }, [admins, roleTab, search])

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

  const deleteAdmin = async (row: AdminRow) => {
    if (!window.confirm(`"${row.name}" 관리자 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) return

    setDeletingId(row.id)
    setError(null)
    const { data, error: invokeError } = await supabase.functions.invoke('admin-delete-user', {
      body: { userId: row.id },
    })
    setDeletingId(null)

    if (invokeError || data?.error) {
      setError('삭제 실패: ' + (data?.error ?? invokeError?.message ?? '알 수 없는 오류'))
      return
    }
    loadAdmins()
  }

  const openEdit = (row: AdminRow) => {
    setEditingAdmin(row)
    setEditForm({
      name: row.name,
      phone: row.phone ?? '',
      role: row.role,
      organizationId: row.organization_id ?? '',
    })
    setEditError(null)
  }

  const closeEdit = () => setEditingAdmin(null)

  const updateEditForm = (key: keyof EditFormState) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setEditForm((f) => ({ ...f, [key]: e.target.value }))

  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!editingAdmin) return

    if (editForm.role === 'org_admin' && !editForm.organizationId) {
      setEditError('조직관리자는 소속 회사를 선택해야 합니다.')
      return
    }

    setEditSaving(true)
    setEditError(null)

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        name: editForm.name,
        phone: editForm.phone || null,
        role: editForm.role,
        organization_id: editForm.role === 'org_admin' ? editForm.organizationId : null,
      })
      .eq('id', editingAdmin.id)

    setEditSaving(false)

    if (updateError) {
      setEditError('수정 실패: ' + updateError.message)
      return
    }
    closeEdit()
    loadAdmins()
  }

  const roleLabel = { super_admin: '슈퍼관리자', org_admin: '조직관리자' } as const

  const toggleButtonClass = (row: AdminRow) =>
    'shrink-0 rounded-lg px-4 py-2 text-base font-semibold disabled:opacity-50 ' +
    (row.status === 'disabled'
      ? 'bg-linear-to-r from-accent-light to-accent text-accent-foreground hover:brightness-105'
      : 'border border-border text-muted-foreground hover:border-destructive hover:text-destructive')

  const mainTabClass = (active: boolean) =>
    '-mb-px shrink-0 border-b-2 px-4 py-2.5 text-base font-semibold transition-colors ' +
    (active ? 'border-accent text-accent' : 'border-transparent text-muted-foreground hover:text-foreground')

  const roleTabClass = (active: boolean) =>
    'shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ' +
    (active
      ? 'bg-accent/15 text-accent'
      : 'border border-border text-muted-foreground hover:border-accent hover:text-accent')

  const emptyMessage = admins.length === 0 ? '등록된 관리자가 없습니다.' : '검색 결과가 없습니다.'

  return (
    <AdminShell title="관리자 계정 관리">
      <div className="flex gap-2 overflow-x-auto overflow-y-hidden border-b border-border">
        <button type="button" onClick={() => setMainTab('register')} className={mainTabClass(mainTab === 'register')}>
          관리자 등록
        </button>
        <button type="button" onClick={() => setMainTab('list')} className={mainTabClass(mainTab === 'list')}>
          목록 보기 ({admins.length})
        </button>
      </div>

      {mainTab === 'register' && (
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
      )}

      {mainTab === 'list' && (
        <section className="rounded-2xl border border-border bg-surface/80 p-7 shadow-[0_22px_50px_-20px_rgba(0,0,0,0.35)] backdrop-blur">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setRoleTab('all')} className={roleTabClass(roleTab === 'all')}>
              전체 ({roleCounts.all})
            </button>
            <button
              type="button"
              onClick={() => setRoleTab('super_admin')}
              className={roleTabClass(roleTab === 'super_admin')}
            >
              슈퍼관리자 ({roleCounts.super_admin})
            </button>
            <button
              type="button"
              onClick={() => setRoleTab('org_admin')}
              className={roleTabClass(roleTab === 'org_admin')}
            >
              조직관리자 ({roleCounts.org_admin})
            </button>
          </div>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="이름, 연락처, 소속 회사 검색"
            className="mt-4 w-full rounded-lg border border-border bg-input px-4 py-2.5 text-base text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
          />

          <ul className="mt-4 divide-y divide-border md:hidden">
            {filteredAdmins.map((row) => (
              <li key={row.id} className="flex flex-col gap-3 py-3">
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
                  <div className="flex flex-wrap justify-end gap-2">
                    <button onClick={() => toggleStatus(row)} disabled={updatingId === row.id} className={toggleButtonClass(row)}>
                      {row.status === 'disabled' ? '활성화' : '비활성화'}
                    </button>
                    <button
                      onClick={() => openEdit(row)}
                      className="rounded-lg border border-border px-4 py-2 text-base font-semibold text-muted-foreground hover:border-accent hover:text-accent"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => deleteAdmin(row)}
                      disabled={deletingId === row.id}
                      className="rounded-lg border border-border px-4 py-2 text-base font-semibold text-muted-foreground hover:border-destructive hover:text-destructive disabled:opacity-50"
                    >
                      삭제
                    </button>
                  </div>
                )}
              </li>
            ))}
            {filteredAdmins.length === 0 && <li className="py-3 text-base text-muted-foreground">{emptyMessage}</li>}
          </ul>

          <div className="mt-4 hidden overflow-x-auto rounded-xl border border-border md:block">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-input/40 text-sm text-muted-foreground">
                  <th className="px-4 py-3 font-medium">이름</th>
                  <th className="px-4 py-3 font-medium">연락처</th>
                  <th className="px-4 py-3 font-medium">소속</th>
                  <th className="px-4 py-3 font-medium">역할</th>
                  <th className="px-4 py-3 font-medium text-right">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredAdmins.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-3 text-base font-semibold text-foreground">{row.name}</td>
                    <td className="px-4 py-3 text-base text-muted-foreground">{row.phone || '연락처 미입력'}</td>
                    <td className="px-4 py-3 text-base text-muted-foreground">{row.organizations?.name ?? '소속 없음'}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-sm font-medium text-accent">
                        {roleLabel[row.role]}
                      </span>
                      {row.status === 'disabled' && (
                        <span className="ml-2 rounded-full bg-destructive/15 px-2.5 py-0.5 text-sm font-medium text-destructive">
                          비활성화됨
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {row.id !== profile?.id && (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => toggleStatus(row)} disabled={updatingId === row.id} className={toggleButtonClass(row)}>
                            {row.status === 'disabled' ? '활성화' : '비활성화'}
                          </button>
                          <button
                            onClick={() => openEdit(row)}
                            className="shrink-0 rounded-lg border border-border px-4 py-2 text-base font-semibold text-muted-foreground hover:border-accent hover:text-accent"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => deleteAdmin(row)}
                            disabled={deletingId === row.id}
                            className="shrink-0 rounded-lg border border-border px-4 py-2 text-base font-semibold text-muted-foreground hover:border-destructive hover:text-destructive disabled:opacity-50"
                          >
                            삭제
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredAdmins.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-3 text-base text-muted-foreground">
                      {emptyMessage}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <Modal open={editingAdmin !== null} onClose={closeEdit} title="관리자 정보 수정">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <Field label="성함" value={editForm.name} onChange={updateEditForm('name')} />
          <Field label="연락처" value={editForm.phone} onChange={updateEditForm('phone')} />
          <Select label="역할" value={editForm.role} onChange={updateEditForm('role')}>
            <option value="super_admin">슈퍼관리자</option>
            <option value="org_admin">조직관리자</option>
          </Select>
          {editForm.role === 'org_admin' && (
            <Select label="소속 회사" value={editForm.organizationId} onChange={updateEditForm('organizationId')}>
              <option value="">선택해주세요</option>
              {orgs.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </Select>
          )}
          {editError && <p className="text-base text-destructive">{editError}</p>}
          <button
            type="submit"
            disabled={editSaving}
            className="w-full rounded-lg bg-linear-to-r from-accent-light to-accent px-4 py-3 text-base font-semibold text-accent-foreground hover:brightness-105 disabled:opacity-50"
          >
            {editSaving ? '저장 중...' : '저장'}
          </button>
        </form>
      </Modal>
    </AdminShell>
  )
}
