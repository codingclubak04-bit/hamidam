import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { AdminShell } from '../components/AdminShell'

interface SalesRepRow {
  id: string
  name: string
  phone: string | null
  can_view_all_stats: boolean
  organizations: { name: string } | null
}

export default function AdminSalesReps() {
  const [reps, setReps] = useState<SalesRepRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const loadReps = async () => {
    const { data, error: loadError } = await supabase
      .from('profiles')
      .select('id, name, phone, can_view_all_stats, organizations!profiles_organization_id_fkey(name)')
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
  }, [])

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
            <li key={rep.id} className="flex items-center justify-between gap-4 py-3">
              <div>
                <p className="text-base font-semibold text-foreground">{rep.name}</p>
                <p className="text-base text-muted-foreground">
                  {rep.phone || '연락처 미입력'} · {rep.organizations?.name ?? '독립 팀장'}
                </p>
              </div>
              <button onClick={() => toggleStats(rep)} disabled={updatingId === rep.id} className={toggleButtonClass(rep)}>
                {rep.can_view_all_stats ? '전체 현황 열람 가능' : '전체 현황 열람 권한 부여'}
              </button>
            </li>
          ))}
          {reps.length === 0 && <li className="py-3 text-base text-muted-foreground">가입한 팀장이 없습니다.</li>}
        </ul>

        <div className="mt-4 hidden overflow-hidden rounded-xl border border-border md:block">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-input/40 text-sm text-muted-foreground">
                <th className="px-4 py-3 font-medium">이름</th>
                <th className="px-4 py-3 font-medium">연락처</th>
                <th className="px-4 py-3 font-medium">소속</th>
                <th className="px-4 py-3 font-medium text-right">전체 현황 열람</th>
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
                      {rep.can_view_all_stats ? '전체 현황 열람 가능' : '전체 현황 열람 권한 부여'}
                    </button>
                  </td>
                </tr>
              ))}
              {reps.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-base text-muted-foreground">
                    가입한 팀장이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  )
}
