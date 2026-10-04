// Real user notification management service for Hajzy

import { formatNumber } from './formatters'

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
      return `${formatNumber(diffMinutes)}m ago`
    }
    if (diffMinutes === 1) return 'منذ دقيقة'
    if (diffMinutes === 2) return 'منذ دقيقتين'
    if (diffMinutes >= 3 && diffMinutes <= 10) return `منذ ${formatNumber(diffMinutes)} دقائق`
    return `منذ ${formatNumber(diffMinutes)} دقيقة`
  }

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) {
    if (lang === 'en') {
      return `${formatNumber(diffHours)}h ago`
    }
    if (diffHours === 1) return 'منذ ساعة'
    if (diffHours === 2) return 'منذ ساعتين'
    if (diffHours >= 3 && diffHours <= 10) return `منذ ${formatNumber(diffHours)} ساعات`
    return `منذ ${formatNumber(diffHours)} ساعة`
  }

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) {
    return lang === 'en' ? 'Yesterday' : 'أمس'
  }
  if (diffDays === 2) {
    return lang === 'en' ? '2 days ago' : 'منذ يومين'
  }
  if (diffDays <= 7) {
    return lang === 'en' ? `${formatNumber(diffDays)} days ago` : `منذ ${formatNumber(diffDays)} أيام`
  }

  return date.toLocaleDateString(lang === 'en' ? 'en-US-u-nu-latn' : 'ar-EG-u-nu-latn', {
    month: 'short',
    day: 'numeric',
    numberingSystem: 'latn',
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
 * Get notification preferences for a given user
 */
export const getNotificationPreferences = (userId) => {
  if (typeof window === 'undefined') {
    return { inApp: true, browserPush: false, email: true, whatsapp: false }
  }
  try {
    const key = `hajzy_notif_prefs_${userId || 'default'}`
    const raw = localStorage.getItem(key)
    if (raw) return { inApp: true, browserPush: false, email: true, whatsapp: false, ...JSON.parse(raw) }
  } catch {}
  return { inApp: true, browserPush: false, email: true, whatsapp: false }
}

/**
 * Save notification preferences for a given user
 */
export const saveNotificationPreferences = (userId, prefs) => {
  if (typeof window === 'undefined') return
  try {
    const key = `hajzy_notif_prefs_${userId || 'default'}`
    localStorage.setItem(key, JSON.stringify(prefs))
  } catch (err) {
    console.warn('saveNotificationPreferences error:', err)
  }
}

/**
 * Request browser push notification permission
 */
export const requestBrowserPushPermission = async () => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported'
  }
  try {
    const perm = await Notification.requestPermission()
    return perm
  } catch {
    return 'denied'
  }
}

/**
 * Trigger native browser notification if granted and enabled
 */
export const triggerBrowserNotification = (title, options = {}) => {
  if (typeof window === 'undefined' || !('Notification' in window)) return null
  if (Notification.permission !== 'granted') return null
  try {
    return new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options,
    })
  } catch (err) {
    console.warn('triggerBrowserNotification error:', err)
    return null
  }
}

/**
 * Add a new notification for a specific user and broadcast update
 */
export const createNotification = (userId, {
  type = 'info',
  title,
  body,
  detail,
  bookingId = null,
  propertyId = null,
  status = null,
  metadata = null,
  createdAt = new Date().toISOString(),
}) => {
  const normalizedTitle = typeof title === 'object' && title !== null
    ? title
    : { ar: String(title || ''), en: String(title || '') }

  const normalizedBody = typeof (body || detail) === 'object' && (body || detail) !== null
    ? (body || detail)
    : { ar: String(body || detail || ''), en: String(body || detail || '') }

  const targetUserId = String(userId || 'guest').trim()

  const newNotification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    userId: targetUserId,
    type,
    title: normalizedTitle,
    body: normalizedBody,
    detail: normalizedBody,
    bookingId,
    propertyId,
    status,
    metadata,
    createdAt,
    readAt: null,
    read: false,
  }

  const prefs = getNotificationPreferences(targetUserId)
  if (prefs.inApp) {
    const existing = getUserNotifications(targetUserId)
    const updated = [newNotification, ...existing].slice(0, 50)
    saveUserNotifications(targetUserId, updated)

    // Broadcast event in window for instant UI reactivity without page reload
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hajzy_notification_created', {
        detail: { userId: targetUserId, notification: newNotification },
      }))

      // Check user preferences for native browser push notification
      if (prefs.browserPush) {
        const textTitle = normalizedTitle.ar || normalizedTitle.en
        const textBody = normalizedBody.ar || normalizedBody.en
        triggerBrowserNotification(textTitle, {
          body: textBody,
          tag: newNotification.id,
        })
      }
    }
  }

  return newNotification
}

/**
 * Create an owner-targeted booking notification with comprehensive details
 * Types: 'booking_new' | 'booking_pending' | 'booking_confirmed' | 'booking_cancelled' | 'booking_modified'
 */
export const createOwnerBookingNotification = ({
  ownerId,
  property,
  booking,
  type = 'booking_new',
  guestName = '',
  guestPhone = '',
  guestEmail = '',
  dates = null,
  total = null,
  currency = 'EGP',
}) => {
  if (!ownerId) return null

  const propTitle = property?.title || 'عقارك'
  const propTitleEn = property?.titleEn || property?.title_en || propTitle
  const name = guestName || booking?.guestName || booking?.fullName || 'ضيف'
  const checkIn = dates?.checkIn || booking?.checkIn || booking?.startDate || ''
  const checkOut = dates?.checkOut || booking?.checkOut || booking?.endDate || ''
  const bookingTotal = total || booking?.total || booking?.totalPrice || 0
  const bookingCurrency = currency || booking?.currency || 'EGP'

  let title = { ar: 'طلب حجز جديد 🛎️', en: 'New Booking Request 🛎️' }
  let body = {
    ar: `حجز جديد من ${name} لعقار "${propTitle}" (${checkIn} إلى ${checkOut}) بإجمالي ${bookingTotal} ${bookingCurrency}.`,
    en: `New booking from ${name} for "${propTitleEn}" (${checkIn} to ${checkOut}) totaling ${bookingTotal} ${bookingCurrency}.`,
  }

  if (type === 'booking_pending') {
    title = { ar: 'طلب حجز بحاجة لمراجعتك ⏳', en: 'Booking Awaiting Review ⏳' }
    body = {
      ar: `طلب حجز جديد من ${name} لعقار "${propTitle}" يتطلب موافقتك (${checkIn} إلى ${checkOut}).`,
      en: `New booking request from ${name} for "${propTitleEn}" requires your approval (${checkIn} to ${checkOut}).`,
    }
  } else if (type === 'booking_confirmed') {
    title = { ar: 'تم تأكيد حجز 🌟', en: 'Booking Confirmed 🌟' }
    body = {
      ar: `تم تأكيد حجز ${name} في "${propTitle}" من ${checkIn} إلى ${checkOut}.`,
      en: `Booking for ${name} at "${propTitleEn}" has been confirmed (${checkIn} to ${checkOut}).`,
    }
  } else if (type === 'booking_cancelled') {
    title = { ar: 'إلغاء حجز ⚠️', en: 'Booking Cancelled ⚠️' }
    body = {
      ar: `تم إلغاء الحجز الخاص بـ ${name} في "${propTitle}" (${checkIn} إلى ${checkOut}).`,
      en: `Booking for ${name} at "${propTitleEn}" has been cancelled (${checkIn} to ${checkOut}).`,
    }
  } else if (type === 'booking_modified') {
    title = { ar: 'تعديل موعد الحجز ✏️', en: 'Booking Dates Updated ✏️' }
    body = {
      ar: `تم تعديل مواعيد حجز ${name} في "${propTitle}" إلى ${checkIn} حتى ${checkOut}.`,
      en: `Dates updated for ${name} at "${propTitleEn}" to ${checkIn} through ${checkOut}.`,
    }
  }

  return createNotification(ownerId, {
    type,
    title,
    body,
    bookingId: booking?.id,
    propertyId: property?.id,
    status: booking?.status || 'confirmed',
    metadata: {
      guestName: name,
      guestPhone,
      guestEmail,
      checkIn,
      checkOut,
      total: bookingTotal,
      currency: bookingCurrency,
      propertyTitle: propTitle,
    },
  })
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
