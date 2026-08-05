import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { getPushStatus, isPushSupported, subscribeToPush, unsubscribeFromPush, type PushStatus } from '../lib/push'

export function NotificationToggleButton() {
  const { profile } = useAuth()
  const [status, setStatus] = useState<PushStatus | 'loading'>('loading')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!profile) return
    let active = true
    getPushStatus(profile.id).then((s) => {
      if (active) setStatus(s)
    })
    return () => {
      active = false
    }
  }, [profile])

  if (!profile || !isPushSupported() || status === 'loading' || status === 'unsupported') return null

  const handleToggle = async () => {
    if (busy) return
    setBusy(true)
    if (status === 'on') {
      await unsubscribeFromPush(profile.id)
      setStatus('off')
    } else {
      const result = await subscribeToPush(profile.id)
      setStatus(result === 'subscribed' ? 'on' : await getPushStatus(profile.id))
    }
    setBusy(false)
  }

  return (
    <div className="px-4 py-2.5 text-sm text-foreground">
      <div className="flex items-center justify-between">
        알림
        <button
          type="button"
          onClick={handleToggle}
          disabled={busy || status === 'denied'}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition disabled:opacity-50 ${
            status === 'on'
              ? 'bg-accent text-accent-foreground'
              : 'bg-input text-muted-foreground hover:text-foreground'
          }`}
        >
          {status === 'on' ? '켜짐' : '꺼짐'}
        </button>
      </div>
      {status === 'denied' && (
        <p className="mt-1 text-xs text-muted-foreground">
          브라우저 알림 권한이 차단되어 있습니다. 기기 설정에서 허용해주세요.
        </p>
      )}
    </div>
  )
}
