import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { AdminShell } from '../components/AdminShell'
import { Field } from '../components/Field'
import { Modal } from '../components/Modal'
import type { Organization } from '../lib/types'

interface EditFormState {
  name: string
  businessRegNo: string
  contactPhone: string
}

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

const statusLabel: Record<Organization['status'], string> = {
  pending: '승인 대기',
  approved: '승인됨',
  rejected: '거부됨',
}

const statusBadgeClass: Record<Organization['status'], string> = {
  pending: 'bg-accent/15 text-accent',
  approved: 'bg-emerald-500/15 text-emerald-600',
  rejected: 'bg-destructive/15 text-destructive',
}

export default function AdminPartners() {
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [form, setForm] = useState<FormState>(initialForm)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [decidingId, setDecidingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null)
  const [editForm, setEditForm] = useState<EditFormState>({ name: '', businessRegNo: '', contactPhone: '' })
  const [editError, setEditError] = useState<string | null>(null)
  const [editSaving, setEditSaving] = useState(false)
  const [mainTab, setMainTab] = useState<'register' | 'list'>('list')
  const [statusTab, setStatusTab] = useState<'all' | Organization['status']>('all')
  const [search, setSearch] = useState('')

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

  const decide = async (orgId: string, action: 'approve' | 'reject') => {
    setDecidingId(orgId)
    setError(null)
    const { error: rpcError } = await supabase.rpc(
      action === 'approve' ? 'approve_partner_organization' : 'reject_partner_organization',
      { target_org_id: orgId },
    )
    setDecidingId(null)
    if (rpcError) {
      setError('처리 실패: ' + rpcError.message)
      return
    }
    loadOrgs()
  }

  const deleteOrg = async (org: Organization) => {
    if (!window.confirm(`"${org.name}" 파트너사를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) return

    setDeletingId(org.id)
    setError(null)
    const { error: deleteError } = await supabase.from('organizations').delete().eq('id', org.id)
    setDeletingId(null)

    if (deleteError) {
      if (deleteError.code === '23503') {
        setError('소속된 관리자/팀장 또는 주문 이력이 있어 삭제할 수 없습니다.')
      } else {
        setError('삭제 실패: ' + deleteError.message)
      }
      return
    }
    loadOrgs()
  }

  const statusCounts = useMemo(
    () => ({
      all: orgs.length,
      pending: orgs.filter((org) => org.status === 'pending').length,
      approved: orgs.filter((org) => org.status === 'approved').length,
      rejected: orgs.filter((org) => org.status === 'rejected').length,
    }),
    [orgs],
  )

  const filteredOrgs = useMemo(() => {
    const q = search.trim().toLowerCase()
    return orgs.filter((org) => {
      if (statusTab !== 'all' && org.status !== statusTab) return false
      if (!q) return true
      return (
        org.name.toLowerCase().includes(q) ||
        (org.business_reg_no ?? '').toLowerCase().includes(q) ||
        (org.contact_phone ?? '').toLowerCase().includes(q)
      )
    })
  }, [orgs, statusTab, search])

  const update = (key: keyof FormState) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const openEdit = (org: Organization) => {
    setEditingOrg(org)
    setEditForm({
      name: org.name,
      businessRegNo: org.business_reg_no ?? '',
      contactPhone: org.contact_phone ?? '',
    })
    setEditError(null)
  }

  const closeEdit = () => setEditingOrg(null)

  const updateEditForm = (key: keyof EditFormState) => (e: ChangeEvent<HTMLInputElement>) =>
    setEditForm((f) => ({ ...f, [key]: e.target.value }))

  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!editingOrg) return
    setEditSaving(true)
    setEditError(null)

    const { error: updateError } = await supabase
      .from('organizations')
      .update({
        name: editForm.name,
        business_reg_no: editForm.businessRegNo || null,
        contact_phone: editForm.contactPhone || null,
      })
      .eq('id', editingOrg.id)

    setEditSaving(false)

    if (updateError) {
      setEditError('수정 실패: ' + updateError.message)
      return
    }
    closeEdit()
    loadOrgs()
  }

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

  const emptyMessage = orgs.length === 0 ? '등록된 파트너사가 없습니다.' : '검색 결과가 없습니다.'

  const mainTabClass = (active: boolean) =>
    '-mb-px shrink-0 border-b-2 px-4 py-2.5 text-base font-semibold transition-colors ' +
    (active ? 'border-accent text-accent' : 'border-transparent text-muted-foreground hover:text-foreground')

  const statusTabClass = (active: boolean) =>
    'shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ' +
    (active
      ? 'bg-accent/15 text-accent'
      : 'border border-border text-muted-foreground hover:border-accent hover:text-accent')

  return (
    <AdminShell title="파트너사 관리">
      <div className="flex gap-2 overflow-x-auto overflow-y-hidden border-b border-border">
        <button type="button" onClick={() => setMainTab('register')} className={mainTabClass(mainTab === 'register')}>
          파트너사 등록
        </button>
        <button type="button" onClick={() => setMainTab('list')} className={mainTabClass(mainTab === 'list')}>
          목록 보기 ({orgs.length})
        </button>
      </div>

      {mainTab === 'register' && (
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
      )}

      {mainTab === 'list' && (
        <section className="rounded-2xl border border-border bg-surface/80 p-7 shadow-[0_22px_50px_-20px_rgba(0,0,0,0.35)] backdrop-blur">
          {error && <p className="mb-4 text-base text-destructive">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setStatusTab('all')} className={statusTabClass(statusTab === 'all')}>
              전체 ({statusCounts.all})
            </button>
            <button
              type="button"
              onClick={() => setStatusTab('pending')}
              className={statusTabClass(statusTab === 'pending')}
            >
              승인 대기 ({statusCounts.pending})
            </button>
            <button
              type="button"
              onClick={() => setStatusTab('approved')}
              className={statusTabClass(statusTab === 'approved')}
            >
              승인됨 ({statusCounts.approved})
            </button>
            <button
              type="button"
              onClick={() => setStatusTab('rejected')}
              className={statusTabClass(statusTab === 'rejected')}
            >
              거부됨 ({statusCounts.rejected})
            </button>
          </div>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="장례회사명, 사업자등록번호, 연락처 검색"
            className="mt-4 w-full rounded-lg border border-border bg-input px-4 py-2.5 text-base text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
          />

          <ul className="mt-4 divide-y divide-border md:hidden">
          {filteredOrgs.map((org) => (
            <li key={org.id} className="py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-base font-semibold text-foreground">
                  {org.name}
                  <span className={`ml-2 rounded-full px-2.5 py-0.5 text-sm font-medium ${statusBadgeClass[org.status]}`}>
                    {statusLabel[org.status]}
                  </span>
                </p>
              </div>
              <p className="text-base text-muted-foreground">
                {org.business_reg_no || '사업자번호 미입력'} · {org.contact_phone || '연락처 미입력'}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {org.status === 'pending' && (
                  <>
                    <button
                      onClick={() => decide(org.id, 'approve')}
                      disabled={decidingId === org.id}
                      className="rounded-lg bg-linear-to-r from-accent-light to-accent px-4 py-2 text-base font-semibold text-accent-foreground hover:brightness-105 disabled:opacity-50"
                    >
                      승인
                    </button>
                    <button
                      onClick={() => decide(org.id, 'reject')}
                      disabled={decidingId === org.id}
                      className="rounded-lg border border-border px-4 py-2 text-base font-semibold text-muted-foreground hover:border-destructive hover:text-destructive disabled:opacity-50"
                    >
                      거부
                    </button>
                  </>
                )}
                <button
                  onClick={() => openEdit(org)}
                  className="rounded-lg border border-border px-4 py-2 text-base font-semibold text-muted-foreground hover:border-accent hover:text-accent"
                >
                  수정
                </button>
                <button
                  onClick={() => deleteOrg(org)}
                  disabled={deletingId === org.id}
                  className="rounded-lg border border-border px-4 py-2 text-base font-semibold text-muted-foreground hover:border-destructive hover:text-destructive disabled:opacity-50"
                >
                  삭제
                </button>
              </div>
            </li>
          ))}
          {filteredOrgs.length === 0 && <li className="py-3 text-base text-muted-foreground">{emptyMessage}</li>}
        </ul>

        <div className="mt-4 hidden overflow-x-auto rounded-xl border border-border md:block">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-input/40 text-sm text-muted-foreground">
                <th className="px-4 py-3 font-medium">장례회사명</th>
                <th className="px-4 py-3 font-medium">사업자등록번호</th>
                <th className="px-4 py-3 font-medium">연락처</th>
                <th className="px-4 py-3 font-medium">상태</th>
                <th className="px-4 py-3 font-medium text-right">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredOrgs.map((org) => (
                <tr key={org.id}>
                  <td className="px-4 py-3 text-base font-semibold text-foreground">{org.name}</td>
                  <td className="px-4 py-3 text-base text-muted-foreground">{org.business_reg_no || '미입력'}</td>
                  <td className="px-4 py-3 text-base text-muted-foreground">{org.contact_phone || '미입력'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-sm font-medium ${statusBadgeClass[org.status]}`}>
                      {statusLabel[org.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      {org.status === 'pending' && (
                        <>
                          <button
                            onClick={() => decide(org.id, 'approve')}
                            disabled={decidingId === org.id}
                            className="rounded-lg bg-linear-to-r from-accent-light to-accent px-4 py-2 text-base font-semibold text-accent-foreground hover:brightness-105 disabled:opacity-50"
                          >
                            승인
                          </button>
                          <button
                            onClick={() => decide(org.id, 'reject')}
                            disabled={decidingId === org.id}
                            className="rounded-lg border border-border px-4 py-2 text-base font-semibold text-muted-foreground hover:border-destructive hover:text-destructive disabled:opacity-50"
                          >
                            거부
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => openEdit(org)}
                        className="rounded-lg border border-border px-4 py-2 text-base font-semibold text-muted-foreground hover:border-accent hover:text-accent"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => deleteOrg(org)}
                        disabled={deletingId === org.id}
                        className="rounded-lg border border-border px-4 py-2 text-base font-semibold text-muted-foreground hover:border-destructive hover:text-destructive disabled:opacity-50"
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredOrgs.length === 0 && (
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

      <Modal open={editingOrg !== null} onClose={closeEdit} title="파트너사 정보 수정">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <Field label="장례회사명" value={editForm.name} onChange={updateEditForm('name')} />
          <Field label="사업자등록번호" value={editForm.businessRegNo} onChange={updateEditForm('businessRegNo')} />
          <Field label="대표 연락처" value={editForm.contactPhone} onChange={updateEditForm('contactPhone')} />
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
