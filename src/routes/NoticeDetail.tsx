import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { PageHeader } from '../components/PageHeader'
import type { Notice } from '../lib/types'

export default function NoticeDetail() {
  const { id } = useParams<{ id: string }>()
  const [notice, setNotice] = useState<Notice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    supabase
      .from('notices')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .then(({ data, error: loadError }) => {
        if (loadError || !data) {
          setError('공지사항을 찾을 수 없습니다.')
        } else {
          setNotice(data as Notice)
        }
        setLoading(false)
      })
  }, [id])

  return (
    <div className="min-h-screen bg-[radial-gradient(120%_100%_at_75%_0%,_var(--color-background-alt)_0%,_var(--color-background)_60%)] px-4 py-10">
      <PageHeader backTo={{ to: '/notices', label: '공지사항 목록' }} />
      <div className="mx-auto max-w-2xl">
        {loading && <p className="text-base text-muted-foreground">불러오는 중...</p>}
        {error && <p className="text-base text-destructive">{error}</p>}

        {notice && (
          <article className="rounded-2xl border border-border bg-surface/80 p-7 backdrop-blur">
            {notice.is_pinned && (
              <span className="mb-2 inline-block rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
                고정
              </span>
            )}
            <h1 className="font-serif-kr text-xl font-bold text-foreground">{notice.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {new Date(notice.created_at).toLocaleString('ko-KR')}
            </p>
            <p className="mt-5 whitespace-pre-wrap text-base leading-relaxed text-foreground">{notice.content}</p>
          </article>
        )}
      </div>
    </div>
  )
}
