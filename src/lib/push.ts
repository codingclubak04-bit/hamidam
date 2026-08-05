import { supabase } from './supabase'

export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

function urlBase64ToUint8Array(base64Url: string) {
  const padding = '='.repeat((4 - (base64Url.length % 4)) % 4)
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)))
}

export async function getExistingSubscription() {
  if (!isPushSupported()) return null
  const registration = await navigator.serviceWorker.ready
  return registration.pushManager.getSubscription()
}

export async function subscribeToPush(profileId: string): Promise<'subscribed' | 'denied' | 'unsupported' | 'error'> {
  if (!isPushSupported()) return 'unsupported'

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return 'denied'

  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY),
  })

  const json = subscription.toJSON()
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      profile_id: profileId,
      endpoint: json.endpoint!,
      p256dh: json.keys!.p256dh,
      auth: json.keys!.auth,
    },
    { onConflict: 'profile_id,endpoint' },
  )

  if (error) {
    console.error('푸시 구독 저장 실패:', error.message)
    // 로컬 구독은 이미 성공했지만 DB 저장이 실패한 경우, 로컬 구독을 그대로 두면
    // 다음 방문 시 getExistingSubscription()이 "이미 구독됨"으로 오판해 재시도할
    // 방법이 없어진다. 로컬 구독도 함께 롤백해 다음 시도가 정상 동작하게 한다.
    await subscription.unsubscribe().catch(() => {})
    return 'error'
  }
  return 'subscribed'
}

export async function unsubscribeFromPush(profileId: string): Promise<void> {
  const subscription = await getExistingSubscription()
  if (subscription) {
    const endpoint = subscription.endpoint
    await subscription.unsubscribe().catch(() => {})
    await supabase.from('push_subscriptions').delete().eq('profile_id', profileId).eq('endpoint', endpoint)
  }
}

export type PushStatus = 'on' | 'off' | 'denied' | 'unsupported'

/**
 * 로컬 브라우저 구독 존재 여부만으로는 실제 알림 수신 가능 여부를 보장할 수 없다
 * (DB 저장 실패, 다른 계정으로 로그인했던 기기의 잔존 구독 등으로 어긋날 수 있음).
 * 현재 로그인한 profileId + 이 기기의 endpoint가 DB에 실제로 저장돼 있는지까지 확인한다.
 */
export async function getPushStatus(profileId: string): Promise<PushStatus> {
  if (!isPushSupported()) return 'unsupported'
  if (Notification.permission === 'denied') return 'denied'

  const subscription = await getExistingSubscription()
  if (!subscription) return 'off'

  const { data } = await supabase
    .from('push_subscriptions')
    .select('id')
    .eq('profile_id', profileId)
    .eq('endpoint', subscription.endpoint)
    .maybeSingle()

  return data ? 'on' : 'off'
}
