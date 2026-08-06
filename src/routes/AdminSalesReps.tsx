import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { AdminShell } from '../components/AdminShell'
import { Field } from '../components/Field'
import { Select } from '../components/Select'
import { Modal } from '../components/Modal'

interface SalesRepRow {
  id: string
  name: string
  phone: string | null
  can_view_all_stats: boolean
  organization_id: string | null
  organizations: { name: string } | null
}

interface PartnerOrg {
  id: string
  name: string
}

interface EditFormState {
  name: string
  phone: string
  organizationId: string
}

export default function AdminSalesReps() {
  const [reps, setReps] = useState<SalesRepRow[]>([])
  const [orgs, setOrgs] = useState<PartnerOrg[]>([])
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingRep, setEditingRep] = useState<SalesRepRow | null>(null)
  const [editForm, setEditForm] = useState<EditFormState>({ name: '', phone: '', organizationId: '' })
  const [editEmail, setEditEmail] = useState<string | null>(null)
  const [editError, setEditError] = useState<string | null>(null)
  const [editSaving, setEditSaving] = useState(false)

  const loadReps = async () => {
    const { data, error: loadError } = await supabase
      .from('profiles')
      .select('id, name, phone, can_view_all_stats, organization_id, organizations!profiles_organization_id_fkey(name)')
      .eq('role', 'sales_rep')
      .order('name')

    if (loadError) {
      setError('팀장 목록 조회 실패: ' + loadError.message)
      return
    }
    setReps((data as unknown as SalesRepRow[]) ?? [])
  }

  useEffect(() => {
    loadReps()
    supabase.rpc('list_partner_organizations').then(({ data, error: rpcError }) => {
      if (rpcError) {
        console.error('회사 목록 조회 실패:', rpcError.message)
        return
      }
      setOrgs(data ?? [])
    })
  }, [])

  const openEdit = (rep: SalesRepRow) => {
    setEditingRep(rep)
    setEditForm({ name: rep.name, phone: rep.phone ?? '', organizationId: rep.organization_id ?? '' })
    setEditError(null)
    setEditEmail(null)
    supabase.rpc('admin_get_user_email', { target_id: rep.id }).then(({ data, error: rpcError }) => {
      if (rpcError) {
        console.error('이메일 조회 실패:', rpcError.message)
        return
      }
      setEditEmail(data ?? '알 수 없음')
    })
  }

  const closeEdit = () => {
    setEditingRep(null)
    setEditEmail(null)
  }

  const updateEditForm = (key: keyof EditFormState) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setEditForm((f) => ({ ...f, [key]: e.target.value }))

  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!editingRep) return
    setEditSaving(true)
    setEditError(null)

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        name: editForm.name,
        phone: editForm.phone || null,
        organization_id: editForm.organizationId || null,
      })
      .eq('id', editingRep.id)

    setEditSaving(false)

    if (updateError) {
      setEditError('수정 실패: ' + updateError.message)
      return
    }
    closeEdit()
    loadReps()
  }

  const toggleStats = async (rep: SalesRepRow) => {
    setUpdatingId(rep.id)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ can_view_all_stats: !rep.can_view_all_stats })
      .eq('id', rep.id)
    setUpdatingId(null)

    if (updateError) {
      setError('권한 변경 실패: ' + updateError.message)
      return
    }
    setError(null)
    loadReps()
  }

  const deleteRep = async (rep: SalesRepRow) => {
    if (!window.confirm(`"${rep.name}" 팀장 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) return

    setDeletingId(rep.id)
    setError(null)
    const { data, error: invokeError } = await supabase.functions.invoke('admin-delete-user', {
      body: { userId: rep.id },
    })
    setDeletingId(null)

    if (invokeError || data?.error) {
      setError('삭제 실패: ' + (data?.error ?? invokeError?.message ?? '알 수 없는 오류'))
      return
    }
    loadReps()
  }

  const toggleButtonClass = (rep: SalesRepRow) =>
    'shrink-0 rounded-lg px-4 py-2 text-base font-semibold disabled:opacity-50 ' +
    (rep.can_view_all_stats
      ? 'bg-gradient-to-r from-accent-light to-accent text-accent-foreground hover:brightness-105'
      : 'border border-border text-muted-foreground hover:border-accent hover:text-accent')

  return (
    <AdminShell title="팀장 관리">
      <section className="rounded-2xl border border-border bg-surface/80 p-7 shadow-[0_22px_50px_-20px_rgba(0,0,0,0.35)] backdrop-blur">
        <h2 className="font-serif-kr text-xl font-bold text-foreground">전체 팀장 ({reps.length})</h2>
        <p className="mt-1 text-base text-muted-foreground">
          "전체 판매 현황 열람"을 켜면 해당 팀장은 본인 실적 외에 전체 판매 현황을 열람만 할 수 있습니다.
        </p>
        {error && <p className="mt-3 text-base text-destructive">{error}</p>}
        <ul className="mt-4 divide-y divide-border md:hidden">
          {reps.map((rep) => (
            <li key={rep.id} className="flex flex-col gap-3 py-3">
              <div>
                <p className="text-base font-semibold text-foreground">{rep.name}</p>
                <p className="text-base text-muted-foreground">
                  {rep.phone || '연락처 미입력'} · {rep.organizations?.name ?? '독립 팀장'}
                </p>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <button onClick={() => toggleStats(rep)} disabled={updatingId === rep.id} className={toggleButtonClass(rep)}>
                  {rep.can_view_all_stats ? '열람 가능' : '권한 부여'}
                </button>
                <button
                  onClick={() => openEdit(rep)}
                  className="rounded-lg border border-border px-4 py-2 text-base font-semibold text-muted-foreground hover:border-accent hover:text-accent"
                >
                  수정
                </button>
                <button
                  onClick={() => deleteRep(rep)}
                  disabled={deletingId === rep.id}
                  className="rounded-lg border border-border px-4 py-2 text-base font-semibold text-muted-foreground hover:border-destructive hover:text-destructive disabled:opacity-50"
                >
                  삭제
                </button>
              </div>
            </li>
          ))}
          {reps.length === 0 && <li className="py-3 text-base text-muted-foreground">가입한 팀장이 없습니다.</li>}
        </ul>

        <div className="mt-4 hidden overflow-x-auto rounded-xl border border-border md:block">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-input/40 text-sm text-muted-foreground">
                <th className="px-4 py-3 font-medium">이름</th>
                <th className="px-4 py-3 font-medium">연락처</th>
                <th className="px-4 py-3 font-medium">소속</th>
                <th className="px-4 py-3 font-medium text-right">전체 현황 열람</th>
                <th className="px-4 py-3 font-medium text-right">액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {reps.map((rep) => (
                <tr key={rep.id}>
                  <td className="px-4 py-3 text-base font-semibold text-foreground">{rep.name}</td>
                  <td className="px-4 py-3 text-base text-muted-foreground">{rep.phone || '연락처 미입력'}</td>
                  <td className="px-4 py-3 text-base text-muted-foreground">{rep.organizations?.name ?? '독립 팀장'}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => toggleStats(rep)} disabled={updatingId === rep.id} className={toggleButtonClass(rep)}>
                      {rep.can_view_all_stats ? '열람 가능' : '권한 부여'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(rep)}
                        className="shrink-0 rounded-lg border border-border px-4 py-2 text-base font-semibold text-muted-foreground hover:border-accent hover:text-accent"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => deleteRep(rep)}
                        disabled={deletingId === rep.id}
                        className="shrink-0 rounded-lg border border-border px-4 py-2 text-base font-semibold text-muted-foreground hover:border-destructive hover:text-destructive disabled:opacity-50"
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {reps.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-3 text-base text-muted-foreground">
                    가입한 팀장이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Modal open={editingRep !== null} onClose={closeEdit} title="팀장 정보 수정">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-base font-medium text-muted-foreground">가입 이메일(로그인 아이디)</label>
            <p className="mt-1.5 rounded-lg border border-border bg-input/50 px-4 py-3 text-base text-foreground">
              {editEmail ?? '불러오는 중...'}
            </p>
          </div>
          <Field label="성함" value={editForm.name} onChange={updateEditForm('name')} />
          <Field label="연락처" value={editForm.phone} onChange={updateEditForm('phone')} />
          <Select label="소속 회사" value={editForm.organizationId} onChange={updateEditForm('organizationId')}>
            <option value="">독립 팀장</option>
            {orgs.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </Select>
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
