import { getOwnerMetricsPeriodRange } from './ownerMetricsPeriod.js'

const getStatus = (booking) => String(booking?.status || '').trim().toLowerCase()

const isCancelled = (booking) => getStatus(booking) === 'cancelled'

const isConfirmed = (booking) => {
  const status = getStatus(booking)
  return status === 'confirmed' || status === 'paid'
}

const parseBookingDate = (value) => {
  if (!value) return null
  const dateOnly = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/)
  const year = dateOnly ? Number(dateOnly[1]) : null
  const month = dateOnly ? Number(dateOnly[2]) - 1 : null
  const day = dateOnly ? Number(dateOnly[3]) : null
  const parsed = dateOnly ? new Date(year, month, day) : new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  if (
    dateOnly
    && (
      parsed.getFullYear() !== year
      || parsed.getMonth() !== month
      || parsed.getDate() !== day
    )
  ) return null
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())
}

const addDays = (date, days) => {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

const dateKey = (date) => (
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
)

const getBookingInterval = (booking) => ({
  checkIn: parseBookingDate(booking.checkIn || booking.check_in || booking.startDate || booking.start_date),
  checkOut: parseBookingDate(booking.checkOut || booking.check_out || booking.endDate || booking.end_date),
})

const getRequestDate = (booking) => parseBookingDate(
  booking.createdAt
  || booking.created_at
  || booking.requestedAt
  || booking.requested_at
  || booking.checkIn
  || booking.check_in
  || booking.startDate
  || booking.start_date,
)

const isWithinPeriod = (date, startDate, endDate) => (
  date && date >= startDate && date < endDate
)

export const getSmartLockCodeStatus = (bookings = [], propertyId, now = new Date()) => {
  if (propertyId === null || propertyId === undefined || !Array.isArray(bookings)) {
    return { status: 'unlinked', expiresAt: null }
  }

  const linkedBookings = bookings.flatMap((booking) => {
    const status = getStatus(booking)
    if (
      !booking
      || String(booking.propertyId || booking.property_id || '') !== String(propertyId)
      || !['confirmed', 'paid', 'completed'].includes(status)
    ) return []

    const { checkIn, checkOut } = getBookingInterval(booking)
    if (!checkIn || !checkOut || checkOut <= checkIn) return []

    const expiresAt = new Date(checkOut)
    expiresAt.setHours(12, 0, 0, 0)
    return [{ checkIn, expiresAt }]
  })

  if (!linkedBookings.length) return { status: 'unlinked', expiresAt: null }

  const activeBookings = linkedBookings
    .filter(({ expiresAt }) => expiresAt >= now)
    .sort((a, b) => a.checkIn - b.checkIn)

  if (activeBookings.length) {
    return { status: 'active', expiresAt: activeBookings[0].expiresAt }
  }

  const latestExpiredBooking = linkedBookings
    .sort((a, b) => b.expiresAt - a.expiresAt)[0]
  return { status: 'expired', expiresAt: latestExpiredBooking.expiresAt }
}

const getPropertyNightKeys = (bookings, propertyIds, startDate, endDate) => {
  const keys = new Set()
  for (const booking of bookings) {
    if (!booking || isCancelled(booking)) continue
    const propertyId = String(booking.propertyId || booking.property_id || '')
    if (!propertyId || !propertyIds.has(propertyId)) continue
    const { checkIn, checkOut } = getBookingInterval(booking)
    if (!checkIn || !checkOut || checkOut <= checkIn) continue

    const start = checkIn > startDate ? checkIn : startDate
    const end = checkOut < endDate ? checkOut : endDate
    for (let night = start; night < end; night = addDays(night, 1)) {
      keys.add(`${propertyId}:${dateKey(night)}`)
    }
  }
  return keys
}

const calculateOccupancyPercent = (bookings, propertyIds, startDate, endDate) => {
  if (!propertyIds.size) return null

  let availableNights = 0
  for (let date = startDate; date < endDate; date = addDays(date, 1)) {
    availableNights += propertyIds.size
  }

  if (!availableNights) return null
  const bookedNights = getPropertyNightKeys(bookings, propertyIds, startDate, endDate)
  return (bookedNights.size / availableNights) * 100
}

export const getBookedDaysForProperty = (bookings, propertyId, year, monthIndex) => {
  if (propertyId === null || propertyId === undefined) return []
  const monthStart = new Date(year, monthIndex, 1)
  const nextMonthStart = new Date(year, monthIndex + 1, 1)
  const propertyIds = new Set([String(propertyId)])
  const bookedNights = getPropertyNightKeys(bookings, propertyIds, monthStart, nextMonthStart)
  return [...new Set([...bookedNights].map((key) => Number(key.slice(key.lastIndexOf(':') + 1).slice(-2))))]
    .sort((a, b) => a - b)
}

export const getOwnerBookingMetrics = (
  bookings = [],
  properties = [],
  now = new Date(),
  period = 'thisMonth',
) => {
  const safeBookings = Array.isArray(bookings) ? bookings.filter(Boolean) : []
  const safeProperties = Array.isArray(properties)
    ? properties.filter((property) => property?.id !== null && property?.id !== undefined)
    : []
  const { startDate, endDate, previousStartDate, previousEndDate, days } = getOwnerMetricsPeriodRange(period, now)
  const periodBookings = safeBookings.filter((booking) => (
    isWithinPeriod(getRequestDate(booking), startDate, endDate)
  ))
  const allActiveBookings = safeBookings.filter((booking) => !isCancelled(booking))
  const totalRequests = periodBookings.length
  const activeBookings = periodBookings.filter((booking) => !isCancelled(booking))
  const confirmedBookings = periodBookings.filter(isConfirmed)
  const bookingConversionPercent = totalRequests
    ? (activeBookings.length / totalRequests) * 100
    : null
  const confirmedRequestPercent = totalRequests
    ? (confirmedBookings.length / totalRequests) * 100
    : null

  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const propertyIds = new Set(safeProperties.map((property) => String(property.id)))
  const monthlyOccupancyPercent = calculateOccupancyPercent(
    allActiveBookings,
    propertyIds,
    currentMonthStart,
    nextMonthStart,
  )
  const previousMonthOccupancyPercent = calculateOccupancyPercent(
    allActiveBookings,
    propertyIds,
    previousMonthStart,
    currentMonthStart,
  )
  const monthlyOccupancyChangePoints = monthlyOccupancyPercent === null
    || previousMonthOccupancyPercent === null
    ? null
    : monthlyOccupancyPercent - previousMonthOccupancyPercent

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const lastSevenDays = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(today, index - 6)
    const nextDate = addDays(date, 1)
    return {
      date,
      occupancyPercent: calculateOccupancyPercent(allActiveBookings, propertyIds, date, nextDate),
    }
  })
  const currentMonthDays = Array.from(
    { length: Math.round((nextMonthStart - currentMonthStart) / 86400000) },
    (_, index) => {
      const date = addDays(currentMonthStart, index)
      return {
        date,
        occupancyPercent: calculateOccupancyPercent(allActiveBookings, propertyIds, date, addDays(date, 1)),
      }
    },
  )
  const occupancyPercent = calculateOccupancyPercent(
    allActiveBookings,
    propertyIds,
    startDate,
    endDate,
  )
  const previousOccupancyPercent = calculateOccupancyPercent(
    allActiveBookings,
    propertyIds,
    previousStartDate,
    previousEndDate,
  )
  const occupancyChangePoints = occupancyPercent === null || previousOccupancyPercent === null
    ? null
    : occupancyPercent - previousOccupancyPercent
  const dailyOccupancy = Array.from({ length: days }, (_, index) => {
    const date = addDays(startDate, index)
    return {
      date,
      occupancyPercent: calculateOccupancyPercent(allActiveBookings, propertyIds, date, addDays(date, 1)),
    }
  })

  return {
    totalRequests,
    activeBookingsCount: activeBookings.length,
    confirmedBookingsCount: confirmedBookings.length,
    pendingRequestsCount: safeBookings.filter((booking) => getStatus(booking) === 'pending').length,
    periodPendingRequestsCount: periodBookings.filter((booking) => getStatus(booking) === 'pending').length,
    bookingConversionPercent,
    confirmedRequestPercent,
    occupancyPercent,
    previousOccupancyPercent,
    occupancyChangePoints,
    monthlyOccupancyPercent,
    previousMonthOccupancyPercent,
    monthlyOccupancyChangePoints,
    lastSevenDays,
    currentMonthDays,
    dailyOccupancy,
  }
}
