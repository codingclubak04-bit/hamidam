import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISSED_KEY = 'hamidam-install-dismissed'
const SHOW_DELAY_MS = 3000

interface InstallPromptContextValue {
  platform: 'android' | 'ios' | null
  isStandalone: boolean
  visible: boolean
  show: () => void
  dismiss: () => void
  install: () => Promise<void>
}

const InstallPromptContext = createContext<InstallPromptContextValue | null>(null)

export function InstallPromptProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [platform, setPlatform] = useState<'android' | 'ios' | null>(null)
  const [visible, setVisible] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    setIsStandalone(standalone)

    const isDismissed = () => !!localStorage.getItem(DISMISSED_KEY)
    let timer: ReturnType<typeof setTimeout> | undefined

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setPlatform('android')
      if (!isDismissed() && !standalone) {
        timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS)
      }
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)

    if (/iphone|ipad|ipod/i.test(window.navigator.userAgent)) {
      setPlatform('ios')
      if (!isDismissed() && !standalone) {
        timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS)
      }
    }

    const onInstalled = () => {
      localStorage.setItem(DISMISSED_KEY, '1')
      setVisible(false)
      setIsStandalone(true)
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

  const show = () => setVisible(true)

  const install = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    if (choice.outcome === 'accepted') {
      localStorage.setItem(DISMISSED_KEY, '1')
    }
    setDeferredPrompt(null)
    setVisible(false)
  }

  return (
    <InstallPromptContext.Provider value={{ platform, isStandalone, visible, show, dismiss, install }}>
      {children}
    </InstallPromptContext.Provider>
  )
}

export function useInstallPrompt() {
  const ctx = useContext(InstallPromptContext)
  if (!ctx) throw new Error('useInstallPrompt must be used within InstallPromptProvider')
  return ctx
}
