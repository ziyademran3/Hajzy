import { getSmartLockCodeStatus } from './ownerBookingMetrics.js'

const RESPONSE_WINDOW_MS = 2 * 60 * 60 * 1000
const SMART_LOCK_WARNING_WINDOW_MS = 24 * 60 * 60 * 1000
const CALENDAR_GAP_WINDOW_DAYS = 30
const LOW_REVIEW_THRESHOLD = 3
const NEW_REVIEW_WINDOW_DAYS = 7
const DAY_MS = 24 * 60 * 60 * 1000

const getStatus = (booking) => String(booking?.status || '').trim().toLowerCase()

const parseDate = (value) => {
  if (!value) return null
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/)
  const date = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  if (
    match
    && (
      date.getFullYear() !== Number(match[1])
      || date.getMonth() !== Number(match[2]) - 1
      || date.getDate() !== Number(match[3])
    )
  ) return null
  return date
}

const parseTimestamp = (value) => (
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? null
    : parseDate(value)
)

const parseBookingDay = (value) => {
  const date = parseDate(value)
  return date
    ? new Date(date.getFullYear(), date.getMonth(), date.getDate())
    : null
}

const getBookingInterval = (booking) => ({
  checkIn: parseBookingDay(booking?.checkIn || booking?.check_in || booking?.startDate || booking?.start_date),
  checkOut: parseBookingDay(booking?.checkOut || booking?.check_out || booking?.endDate || booking?.end_date),
})

const getPropertyId = (record) => record?.propertyId ?? record?.property_id

const getCreatedAt = (record) => (
  record?.requestedAt
  || record?.requested_at
  || record?.createdAt
  || record?.created_at
)

const getCalendarGapAlerts = (bookings, properties, now) => {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const windowEnd = new Date(today.getTime() + CALENDAR_GAP_WINDOW_DAYS * DAY_MS)
  const confirmedStatuses = new Set(['confirmed', 'paid', 'completed'])

  return properties.flatMap((property) => {
    const propertyBookings = bookings
      .filter((booking) => (
        String(getPropertyId(booking) ?? '') === String(property.id)
        && confirmedStatuses.has(getStatus(booking))
      ))
      .map((booking) => ({ booking, ...getBookingInterval(booking) }))
      .filter(({ checkIn, checkOut }) => checkIn && checkOut && checkOut > checkIn)
      .sort((first, second) => first.checkIn - second.checkIn)

    return propertyBookings.flatMap((booking, index) => {
      const nextBooking = propertyBookings[index + 1]
      if (!nextBooking) return []

      const gapNight = booking.checkOut
      const daysBetween = Math.round((nextBooking.checkIn - gapNight) / DAY_MS)
      if (
        daysBetween !== 1
        || gapNight < today
        || gapNight >= windowEnd
      ) return []

      return [{
        id: `calendar-gap:${property.id}:${gapNight.toISOString()}`,
        type: 'calendarGap',
        propertyId: property.id,
        date: gapNight,
      }]
    })
  })
}

const getNewLowReviewAlerts = (reviews, properties, now) => {
  const cutoff = new Date(now.getTime() - NEW_REVIEW_WINDOW_DAYS * DAY_MS)
  const propertyIds = new Set(properties.map((property) => String(property.id)))

  return reviews.flatMap((review) => {
    const rating = Number(review?.rating)
    const date = parseDate(getCreatedAt(review) || review?.date)
    const propertyId = getPropertyId(review)
    if (
      !Number.isFinite(rating)
      || rating <= 0
      || rating >= LOW_REVIEW_THRESHOLD
      || !date
      || date < cutoff
      || date > now
      || !propertyIds.has(String(propertyId ?? ''))
    ) return []

    return [{
      id: `low-review:${review.id ?? `${propertyId}:${date.toISOString()}:${rating}`}`,
      type: 'lowReview',
      propertyId,
      rating,
      date,
    }]
  })
}

export const getOwnerOperationalAlerts = (
  bookings = [],
  properties = [],
  reviews = [],
  now = new Date(),
) => {
  const safeBookings = Array.isArray(bookings) ? bookings.filter(Boolean) : []
  const safeProperties = Array.isArray(properties) ? properties.filter(Boolean) : []
  const safeReviews = Array.isArray(reviews) ? reviews.filter(Boolean) : []
  const ownedPropertyIds = new Set(safeProperties.map((property) => String(property.id)))
  const responseDeadline = new Date(now.getTime() + RESPONSE_WINDOW_MS)

  const pendingRequestAlerts = safeBookings.flatMap((booking) => {
    if (getStatus(booking) !== 'pending') return []
    const requestedAt = parseTimestamp(getCreatedAt(booking))
    const dueAt = requestedAt ? new Date(requestedAt.getTime() + RESPONSE_WINDOW_MS) : null
    if (dueAt && dueAt > responseDeadline) return []

    return [{
      id: `pending-request:${booking.id ?? getCreatedAt(booking) ?? 'unknown'}`,
      type: 'pendingRequest',
      bookingId: booking.id,
      propertyId: getPropertyId(booking),
      dueAt,
      overdue: Boolean(dueAt && dueAt <= now),
    }]
  })

  const smartLockAlerts = safeProperties.flatMap((property) => {
    const lock = getSmartLockCodeStatus(safeBookings, property.id, now)
    if (
      lock.status !== 'active'
      || !lock.expiresAt
      || lock.expiresAt <= now
      || lock.expiresAt.getTime() > now.getTime() + SMART_LOCK_WARNING_WINDOW_MS
    ) return []

    return [{
      id: `smart-lock:${property.id}`,
      type: 'smartLockExpiry',
      propertyId: property.id,
      expiresAt: lock.expiresAt,
    }]
  })

  return [
    ...pendingRequestAlerts,
    ...smartLockAlerts,
    ...getCalendarGapAlerts(safeBookings, safeProperties, now),
    ...getNewLowReviewAlerts(safeReviews, safeProperties, now),
  ].filter((alert) => (
    alert.type === 'pendingRequest'
      ? alert.propertyId === null
        || alert.propertyId === undefined
        || ownedPropertyIds.has(String(alert.propertyId))
      : ownedPropertyIds.has(String(alert.propertyId))
  ))
}
