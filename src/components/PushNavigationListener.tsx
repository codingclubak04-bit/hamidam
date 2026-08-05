import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function PushNavigationListener() {
  const navigate = useNavigate()

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === 'navigate' && typeof event.data.url === 'string') {
        navigate(event.data.url)
      }
    }

    navigator.serviceWorker.addEventListener('message', onMessage)
    return () => navigator.serviceWorker.removeEventListener('message', onMessage)
  }, [navigate])

  return null
}
