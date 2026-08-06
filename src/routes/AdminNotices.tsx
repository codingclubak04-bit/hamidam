import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { AdminShell } from '../components/AdminShell'
import { Modal } from '../components/Modal'
import { useAuth } from '../context/AuthContext'
import type { Notice } from '../lib/types'

interface FormState {
  title: string
  content: string
  isPinned: boolean
}

const emptyForm: FormState = { title: '', content: '', isPinned: false }

export default function AdminNotices() {
  const { profile } = useAuth()
  const [notices, setNotices] = useState<Notice[]>([])
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [editingNotice, setEditingNotice] = useState<Notice | 'new' | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const loadNotices = async () => {
    const { data, error: loadError } = await supabase
      .from('notices')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })

    if (loadError) {
      setError('공지사항 목록 조회 실패: ' + loadError.message)
      return
    }
    setNotices((data as Notice[]) ?? [])
  }

  useEffect(() => {
    loadNotices()
  }, [])

  const openCreate = () => {
    setForm(emptyForm)
    setFormError(null)
    setEditingNotice('new')
  }

  const openEdit = (notice: Notice) => {
    setForm({ title: notice.title, content: notice.content, isPinned: notice.is_pinned })
    setFormError(null)
    setEditingNotice(notice)
  }

  const closeForm = () => setEditingNotice(null)

  const updateField = (key: keyof FormState) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setSaving(true)
    setFormError(null)

    if (editingNotice === 'new') {
      const { error: insertError } = await supabase.from('notices').insert({
        title: form.title,
        content: form.content,
        is_pinned: form.isPinned,
        created_by: profile.id,
      })
      setSaving(false)
      if (insertError) {
        setFormError('등록 실패: ' + insertError.message)
        return
      }
    } else if (editingNotice) {
      const { error: updateError } = await supabase
        .from('notices')
        .update({
          title: form.title,
          content: form.content,
          is_pinned: form.isPinned,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingNotice.id)
      setSaving(false)
      if (updateError) {
        setFormError('수정 실패: ' + updateError.message)
        return
      }
    }

    closeForm()
    loadNotices()
  }

  const deleteNotice = async (notice: Notice) => {
    if (!window.confirm(`"${notice.title}" 공지사항을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) return

    setDeletingId(notice.id)
    setError(null)
    const { error: deleteError } = await supabase.from('notices').delete().eq('id', notice.id)
    setDeletingId(null)

    if (deleteError) {
      setError('삭제 실패: ' + deleteError.message)
      return
    }
    loadNotices()
  }

  return (
    <AdminShell title="공지사항 관리">
      <section className="rounded-2xl border border-border bg-surface/80 p-7 shadow-[0_22px_50px_-20px_rgba(0,0,0,0.35)] backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-serif-kr text-xl font-bold text-foreground">전체 공지사항 ({notices.length})</h2>
            <p className="mt-1 text-base text-muted-foreground">
              등록하면 전체 활성 사용자에게 푸시 알림이 즉시 발송됩니다.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="shrink-0 rounded-lg bg-linear-to-r from-accent-light to-accent px-4 py-2.5 text-base font-semibold text-accent-foreground hover:brightness-105"
          >
            새 공지 작성
          </button>
        </div>
        {error && <p className="mt-3 text-base text-destructive">{error}</p>}

        <ul className="mt-4 divide-y divide-border">
          {notices.map((notice) => (
            <li key={notice.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  {notice.is_pinned && (
                    <span className="shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
                      고정
                    </span>
                  )}
                  <p className="truncate text-base font-semibold text-foreground">{notice.title}</p>
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {new Date(notice.created_at).toLocaleString('ko-KR')}
                </p>
              </div>
              <div className="flex shrink-0 justify-end gap-2">
                <button
                  onClick={() => openEdit(notice)}
                  className="rounded-lg border border-border px-4 py-2 text-base font-semibold text-muted-foreground hover:border-accent hover:text-accent"
                >
                  수정
                </button>
                <button
                  onClick={() => deleteNotice(notice)}
                  disabled={deletingId === notice.id}
                  className="rounded-lg border border-border px-4 py-2 text-base font-semibold text-muted-foreground hover:border-destructive hover:text-destructive disabled:opacity-50"
                >
                  삭제
                </button>
              </div>
            </li>
          ))}
          {notices.length === 0 && <li className="py-3 text-base text-muted-foreground">등록된 공지사항이 없습니다.</li>}
        </ul>
      </section>

      <Modal open={editingNotice !== null} onClose={closeForm} title={editingNotice === 'new' ? '새 공지 작성' : '공지 수정'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-base font-medium text-muted-foreground">제목</label>
            <textarea
              required
              rows={2}
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.preventDefault()
              }}
              className="mt-1.5 w-full resize-none rounded-lg border border-border bg-input px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label className="block text-base font-medium text-muted-foreground">내용</label>
            <textarea
              required
              rows={8}
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              className="mt-1.5 w-full rounded-lg border border-border bg-input px-4 py-3 text-base text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <label className="flex items-center gap-2 text-base text-foreground">
            <input
              type="checkbox"
              checked={form.isPinned}
              onChange={updateField('isPinned')}
              className="h-4 w-4 rounded border-border accent-accent"
            />
            상단에 고정
          </label>
          {formError && <p className="text-base text-destructive">{formError}</p>}
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-linear-to-r from-accent-light to-accent px-4 py-3 text-base font-semibold text-accent-foreground hover:brightness-105 disabled:opacity-50"
          >
            {saving ? '저장 중...' : editingNotice === 'new' ? '등록' : '저장'}
          </button>
        </form>
      </Modal>
    </AdminShell>
  )
}
