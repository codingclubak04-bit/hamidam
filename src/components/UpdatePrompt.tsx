import { createPortal } from 'react-dom'
import { useRegisterSW } from 'virtual:pwa-register/react'

const UPDATE_CHECK_INTERVAL_MS = 30 * 60 * 1000

export function UpdatePrompt() {
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return
      setInterval(() => registration.update(), UPDATE_CHECK_INTERVAL_MS)
    },
  })

  if (!needRefresh) return null

  const handleUpdate = () => {
    // vite-plugin-pwa의 자동 리로드는 Workbox의 controllerchange isUpdate 판정에
    // 의존해 누락되는 경우가 있어, 직접 리스너를 걸어 확실히 리로드한다.
    navigator.serviceWorker?.addEventListener('controllerchange', () => window.location.reload(), {
      once: true,
    })
    updateServiceWorker(true)
  }

  return createPortal(
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
      <div className="flex w-full max-w-md items-center justify-between gap-3 rounded-2xl border border-accent/40 bg-surface p-4 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.3)] backdrop-blur">
        <div>
          <p className="text-base font-semibold text-foreground">새 버전이 있습니다</p>
          <p className="mt-1 text-sm text-muted-foreground">업데이트를 눌러 최신 버전을 적용하세요.</p>
        </div>
        <button
          type="button"
          onClick={handleUpdate}
          className="shrink-0 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground hover:brightness-105"
        >
          업데이트
        </button>
      </div>
    </div>,
    document.body,
  )
}
