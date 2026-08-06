import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISSED_KEY = 'hamidam-install-dismissed'
const SHOW_DELAY_MS = 3000

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [platform, setPlatform] = useState<'android' | 'ios' | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true

    const isDismissed = () => !!localStorage.getItem(DISMISSED_KEY)

    let timer: ReturnType<typeof setTimeout> | undefined

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setPlatform('android')
      if (!isDismissed() && !isStandalone) {
        timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS)
      }
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)

    if (/iphone|ipad|ipod/i.test(window.navigator.userAgent)) {
      setPlatform('ios')
      if (!isDismissed() && !isStandalone) {
        timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS)
      }
    }

    const onInstalled = () => {
      localStorage.setItem(DISMISSED_KEY, '1')
      setVisible(false)
    }
    window.addEventListener('appinstalled', onInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onInstalled)
      if (timer) clearTimeout(timer)
    }
  }, [])

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1')
    setVisible(false)
  }

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    if (choice.outcome === 'accepted') {
      localStorage.setItem(DISMISSED_KEY, '1')
    }
    setDeferredPrompt(null)
    setVisible(false)
  }

  if (!visible || !platform) return null

  return createPortal(
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-4 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.3)] backdrop-blur sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-base font-semibold text-foreground">홈 화면에 하미담 앱 추가</p>
            <p className="mt-1 text-sm text-muted-foreground">
              홈 화면에 추가하면 앱처럼 바로 실행하고, 주문·상태 변경 알림도 놓치지 않아요.
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="닫기"
            className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-input hover:text-foreground"
          >
            ✕
          </button>
        </div>

        {platform === 'android' ? (
          <button
            type="button"
            onClick={handleInstall}
            className="mt-3 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground hover:brightness-105"
          >
            홈 화면에 추가
          </button>
        ) : (
          <div className="mt-3 rounded-lg bg-input/60 px-3.5 py-3 text-sm text-foreground">
            <p className="flex items-center gap-1.5">
              하단 공유 버튼 <ShareIcon className="h-4 w-4 shrink-0" /> 을 누른 뒤
            </p>
            <p className="mt-1 flex items-center gap-1.5">
              <PlusSquareIcon className="h-4 w-4 shrink-0" /> "홈 화면에 추가"를 선택하세요.
            </p>
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0-12 4 4m-4-4-4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
    </svg>
  )
}

function PlusSquareIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path strokeLinecap="round" d="M12 8v8M8 12h8" />
    </svg>
  )
}
