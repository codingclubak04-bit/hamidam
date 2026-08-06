import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { PageHeader } from '../components/PageHeader'
import { IconChevronRight } from '../components/DashboardIcons'
import type { Notice } from '../lib/types'
import { getNoticesLastViewed, isNoticeUnread, markNoticesViewed } from '../lib/notices'

export default function Notices() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastViewed] = useState(() => getNoticesLastViewed())

  useEffect(() => {
    const load = async () => {
      const { data, error: loadError } = await supabase
        .from('notices')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })

      if (loadError) {
        setError('공지사항 조회 실패: ' + loadError.message)
        setLoading(false)
        return
      }
      setNotices((data as Notice[]) ?? [])
      setLoading(false)
      markNoticesViewed()
    }
    load()
  }, [])

  return (
    <div className="min-h-screen bg-[radial-gradient(120%_100%_at_75%_0%,_var(--color-background-alt)_0%,_var(--color-background)_60%)] px-4 py-10">
      <PageHeader />
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 font-serif-kr text-2xl font-bold text-foreground">공지사항</h1>

        {loading && <p className="text-base text-muted-foreground">불러오는 중...</p>}
        {error && <p className="text-base text-destructive">{error}</p>}

        {!loading && !error && notices.length === 0 && (
          <p className="rounded-2xl border border-border bg-surface/80 p-7 text-center text-base text-muted-foreground">
            등록된 공지사항이 없습니다.
          </p>
        )}

        <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface/80 backdrop-blur">
          {notices.map((n) => (
            <Link
              key={n.id}
              to={`/notices/${n.id}`}
              className="flex items-center gap-3 px-5 py-4 transition hover:bg-input"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  {n.is_pinned && (
                    <span className="shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
                      고정
                    </span>
                  )}
                  {isNoticeUnread(n.created_at, lastViewed) && (
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-label="새 공지" />
                  )}
                  <p className="truncate text-base font-semibold text-foreground">{n.title}</p>
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {new Date(n.created_at).toLocaleDateString('ko-KR')}
                </p>
              </div>
              <IconChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
