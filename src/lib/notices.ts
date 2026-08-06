export const NOTICES_LAST_VIEWED_KEY = 'hamidam-notices-last-viewed'

export function getNoticesLastViewed(): string | null {
  return localStorage.getItem(NOTICES_LAST_VIEWED_KEY)
}

export function markNoticesViewed() {
  localStorage.setItem(NOTICES_LAST_VIEWED_KEY, new Date().toISOString())
}

export function isNoticeUnread(createdAt: string, lastViewed: string | null) {
  if (!lastViewed) return true
  return new Date(createdAt).getTime() > new Date(lastViewed).getTime()
}
