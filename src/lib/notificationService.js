// Real user notification management service for Hajzy

const STORAGE_PREFIX = 'hajzy_notifications_'
const LEGACY_MOCK_IDS = new Set(['welcome-note', 'price-drop-note', 'reminder-note'])

/**
 * Format relative time in Arabic or English based on an ISO timestamp
 */
export const formatRelativeTime = (isoString, lang = 'ar') => {
  if (!isoString) {
    return lang === 'en' ? 'Just now' : 'الآن'
  }

  const date = new Date(isoString)
  if (isNaN(date.getTime())) {
    return lang === 'en' ? 'Just now' : 'الآن'
  }

  const now = new Date()
  const diffSeconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000))

  if (diffSeconds < 60) {
    return lang === 'en' ? 'Just now' : 'الآن'
  }

  const diffMinutes = Math.floor(diffSeconds / 60)
  if (diffMinutes < 60) {
    if (lang === 'en') {
      return `${diffMinutes}m ago`
    }
    if (diffMinutes === 1) return 'منذ دقيقة'
    if (diffMinutes === 2) return 'منذ دقيقتين'
    if (diffMinutes >= 3 && diffMinutes <= 10) return `منذ ${diffMinutes} دقائق`
    return `منذ ${diffMinutes} دقيقة`
  }

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) {
    if (lang === 'en') {
      return `${diffHours}h ago`
    }
    if (diffHours === 1) return 'منذ ساعة'
    if (diffHours === 2) return 'منذ ساعتين'
    if (diffHours >= 3 && diffHours <= 10) return `منذ ${diffHours} ساعات`
    return `منذ ${diffHours} ساعة`
  }

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) {
    return lang === 'en' ? 'Yesterday' : 'أمس'
  }
  if (diffDays === 2) {
    return lang === 'en' ? '2 days ago' : 'منذ يومين'
  }
  if (diffDays <= 7) {
    return lang === 'en' ? `${diffDays} days ago` : `منذ ${diffDays} أيام`
  }

  return date.toLocaleDateString(lang === 'en' ? 'en-US' : 'ar-EG', {
    month: 'short',
    day: 'numeric',
  })
}

const getStorageKey = (userId) => {
  const safeId = String(userId || 'guest').trim()
  return `${STORAGE_PREFIX}${safeId}`
}

/**
 * Fetch notifications for a given user from local persistent storage
 */
export const getUserNotifications = (userId) => {
  if (typeof window === 'undefined') return []
  const key = getStorageKey(userId)
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((item) => item && !LEGACY_MOCK_IDS.has(item.id))
      .map((item) => ({
        ...item,
        read: Boolean(item.readAt || item.read),
      }))
  } catch {
    return []
  }
}

/**
 * Save notifications list for a given user to local persistent storage
 */
export const saveUserNotifications = (userId, notifications) => {
  if (typeof window === 'undefined') return
  const key = getStorageKey(userId)
  try {
    const cleaned = (Array.isArray(notifications) ? notifications : [])
      .filter((item) => item && !LEGACY_MOCK_IDS.has(item.id))
    localStorage.setItem(key, JSON.stringify(cleaned))
  } catch (err) {
    console.warn('Failed to save notifications to localStorage:', err)
  }
}

/**
 * Add a new notification for a specific user
 */
export const createNotification = (userId, {
  type = 'info',
  title,
  body,
  detail,
  bookingId = null,
  propertyId = null,
  createdAt = new Date().toISOString(),
}) => {
  const normalizedTitle = typeof title === 'object' && title !== null
    ? title
    : { ar: String(title || ''), en: String(title || '') }

  const normalizedBody = typeof (body || detail) === 'object' && (body || detail) !== null
    ? (body || detail)
    : { ar: String(body || detail || ''), en: String(body || detail || '') }

  const newNotification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    userId: String(userId || 'guest'),
    type,
    title: normalizedTitle,
    body: normalizedBody,
    detail: normalizedBody,
    bookingId,
    propertyId,
    createdAt,
    readAt: null,
    read: false,
  }

  const existing = getUserNotifications(userId)
  const updated = [newNotification, ...existing].slice(0, 50)
  saveUserNotifications(userId, updated)
  return newNotification
}

/**
 * Mark all notifications as read for a given user
 */
export const markAllAsRead = (userId) => {
  const existing = getUserNotifications(userId)
  const now = new Date().toISOString()
  const updated = existing.map((notif) => ({
    ...notif,
    readAt: notif.readAt || now,
    read: true,
  }))
  saveUserNotifications(userId, updated)
  return updated
}

/**
 * Delete a specific notification by ID for a user
 */
export const deleteNotification = (userId, notificationId) => {
  const existing = getUserNotifications(userId)
  const updated = existing.filter((notif) => notif.id !== notificationId)
  saveUserNotifications(userId, updated)
  return updated
}

/**
 * Clean up legacy mock notifications across all localStorage keys
 */
export const purgeLegacyMockNotifications = () => {
  if (typeof window === 'undefined') return
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(STORAGE_PREFIX)) {
        const raw = localStorage.getItem(key)
        if (raw) {
          try {
            const list = JSON.parse(raw)
            if (Array.isArray(list)) {
              const filtered = list.filter((item) => item && !LEGACY_MOCK_IDS.has(item.id))
              if (filtered.length !== list.length) {
                localStorage.setItem(key, JSON.stringify(filtered))
              }
            }
          } catch {}
        }
      }
    }
  } catch (e) {
    console.warn('purgeLegacyMockNotifications error:', e)
  }
}

/**
 * Check user's confirmed bookings and generate check-in reminder (24h prior) if not yet sent
 */
export const checkAndGenerateArrivalReminders = (userId, bookings) => {
  if (!userId || !Array.isArray(bookings) || bookings.length === 0) return []

  const existingNotifications = getUserNotifications(userId)
  const existingReminderBookingIds = new Set(
    existingNotifications
      .filter((n) => n.type === 'checkin_reminder' || n.type === 'warning')
      .map((n) => String(n.bookingId))
      .filter(Boolean)
  )

  const now = new Date()
  const ms24h = 24 * 60 * 60 * 1000
  const createdReminders = []

  for (const booking of bookings) {
    if (booking.status !== 'confirmed') continue
    if (!booking.checkIn) continue

    const checkInDate = new Date(booking.checkIn)
    if (isNaN(checkInDate.getTime())) continue

    const timeUntilCheckIn = checkInDate.getTime() - now.getTime()
    if (timeUntilCheckIn > 0 && timeUntilCheckIn <= ms24h) {
      const bookingKey = String(booking.id)
      if (!existingReminderBookingIds.has(bookingKey)) {
        const reminder = createNotification(userId, {
          type: 'checkin_reminder',
          bookingId: booking.id,
          propertyId: booking.propertyId,
          title: {
            ar: 'تذكير الوصول',
            en: 'Check-in Reminder',
          },
          body: {
            ar: `موعد وصولك إلى "${booking.title || 'إقامتك'}" غداً (${booking.checkIn}). نتمنى لك إقامة ممتعة!`,
            en: `Your check-in at "${booking.title || 'your stay'}" is tomorrow (${booking.checkIn}). Have a wonderful stay!`,
          },
        })
        createdReminders.push(reminder)
        existingReminderBookingIds.add(bookingKey)
      }
    }
  }

  return createdReminders
}
