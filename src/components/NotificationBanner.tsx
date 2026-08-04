import { useEffect, useState } from 'react'
import { getExistingSubscription, isPushSupported, subscribeToPush } from '../lib/push'

export function NotificationBanner({ profileId }: { profileId: string }) {
  const [visible, setVisible] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [deniedMessage, setDeniedMessage] = useState(false)

  useEffect(() => {
    if (!isPushSupported()) return
    if (Notification.permission === 'denied') return

    getExistingSubscription().then((sub) => {
      if (!sub) setVisible(true)
    })
  }, [])

  if (!visible) return null

  const handleEnable = async () => {
    setRequesting(true)
    const result = await subscribeToPush(profileId)
    setRequesting(false)
    if (result === 'subscribed') {
      setVisible(false)
    } else if (result === 'denied') {
      setDeniedMessage(true)
    }
  }

  return (
    <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-accent/40 bg-accent/10 px-4 py-3">
      <div>
        <p className="text-sm font-medium text-foreground">알림을 켜면 주문 접수·상태 변경을 바로 알려드려요</p>
        {deniedMessage && (
          <p className="mt-1 text-xs text-muted-foreground">
            브라우저 알림 권한이 거부되어 있습니다. 기기 설정에서 알림 권한을 허용한 뒤 다시 시도해주세요.
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={handleEnable}
        disabled={requesting}
        className="shrink-0 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50"
      >
        {requesting ? '설정 중...' : '알림 켜기'}
      </button>
    </div>
  )
}
