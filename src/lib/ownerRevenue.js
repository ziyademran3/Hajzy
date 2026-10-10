import { getOwnerMetricsPeriodRange } from './ownerMetricsPeriod.js'
import { getOwnerBookingMetrics } from './ownerBookingMetrics.js'

const getBookingStatus = (booking) => String(booking?.status || '').trim().toLowerCase()

const isPaidBooking = (booking) => {
  const status = getBookingStatus(booking)
  const paymentStatus = String(booking?.paymentStatus || booking?.payment_status || '').trim().toLowerCase()
  return status === 'paid'
    || (status === 'confirmed' && (
      Boolean(booking?.paidAt || booking?.paid_at)
      || paymentStatus === 'paid'
      || paymentStatus === 'succeeded'
    ))
}

const getBookingAmount = (booking) => {
  const amounts = [booking?.total, booking?.total_price, booking?.totalPrice]
    .map((value) => Number(value))
    .filter(Number.isFinite)
  return amounts.find((amount) => amount > 0) || 0
}

const getPaymentDate = (booking) => {
  const rawDate = booking?.paidAt
    || booking?.paid_at
    || booking?.createdAt
    || booking?.created_at
  if (!rawDate) return null
  const date = new Date(rawDate)
  return Number.isNaN(date.getTime()) ? null : date
}

const addDays = (date, days) => {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

const sumAmounts = (bookings) => bookings.reduce((sum, booking) => sum + booking.amount, 0)

const getTopRevenueCity = (bookings, properties) => {
  const propertyCities = new Map(
    (Array.isArray(properties) ? properties : [])
      .filter((property) => property?.id !== null && property?.id !== undefined)
      .map((property) => [String(property.id), String(property.city || '').trim()]),
  )
  const revenueByCity = new Map()

  bookings.forEach((booking) => {
    const propertyId = booking?.propertyId ?? booking?.property_id
    const city = propertyCities.get(String(propertyId ?? ''))
    if (!city || booking.amount <= 0) return
    revenueByCity.set(city, (revenueByCity.get(city) || 0) + booking.amount)
  })

  return [...revenueByCity.entries()]
    .map(([city, amount]) => ({ city, amount }))
    .sort((cityA, cityB) => cityB.amount - cityA.amount)[0] || null
}

export const getOwnerPropertyPerformance = (
  bookings = [],
  properties = [],
  now = new Date(),
  period = 'lastThirtyDays',
) => {
  const safeBookings = Array.isArray(bookings) ? bookings.filter(Boolean) : []
  const safeProperties = Array.isArray(properties)
    ? properties.filter((property) => property?.id !== null && property?.id !== undefined)
    : []
  const { startDate, endDate } = getOwnerMetricsPeriodRange(period, now)
  const revenueByProperty = new Map()

  safeBookings.filter(isPaidBooking).forEach((booking) => {
    const paymentDate = getPaymentDate(booking)
    const propertyId = booking?.propertyId ?? booking?.property_id
    if (
      propertyId === null
      || propertyId === undefined
      || !paymentDate
      || paymentDate < startDate
      || paymentDate >= endDate
    ) return

    const key = String(propertyId)
    const current = revenueByProperty.get(key) || { revenue: 0, bookingCount: 0 }
    current.revenue += getBookingAmount(booking)
    current.bookingCount += 1
    revenueByProperty.set(key, current)
  })

  return safeProperties
    .map((property) => {
      const { revenue = 0, bookingCount = 0 } = revenueByProperty.get(String(property.id)) || {}
      const occupancy = getOwnerBookingMetrics(safeBookings, [property], now, period)
      return {
        property,
        revenue,
        bookingCount,
        occupancyPercent: occupancy.occupancyPercent,
      }
    })
    .sort((propertyA, propertyB) => propertyB.revenue - propertyA.revenue)
}

export const getOwnerRevenueMetrics = (
  bookings = [],
  now = new Date(),
  properties = [],
  period = 'lastThirtyDays',
) => {
  const eligibleBookings = (Array.isArray(bookings) ? bookings : [])
    .filter(isPaidBooking)
    .map((booking) => ({
      amount: getBookingAmount(booking),
      paymentDate: getPaymentDate(booking),
      propertyId: booking?.propertyId ?? booking?.property_id,
    }))
  const totalRevenue = sumAmounts(eligibleBookings)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const thisMonthRevenue = sumAmounts(eligibleBookings.filter(({ paymentDate }) => (
    paymentDate && paymentDate >= monthStart && paymentDate < nextMonthStart
  )))

  const { startDate, endDate, previousStartDate, previousEndDate, days } = getOwnerMetricsPeriodRange(period, now)
  const periodBookings = eligibleBookings.filter(({ paymentDate }) => (
    paymentDate && paymentDate >= startDate && paymentDate < endDate
  ))
  const previousPeriodBookings = eligibleBookings.filter(({ paymentDate }) => (
    paymentDate && paymentDate >= previousStartDate && paymentDate < previousEndDate
  ))
  const periodRevenue = sumAmounts(periodBookings)
  const previousPeriodRevenue = sumAmounts(previousPeriodBookings)
  const growthPercent = previousPeriodRevenue > 0
    ? ((periodRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100
    : null

  const barCount = Math.min(9, days)
  const bars = Array.from({ length: barCount }, (_, index) => {
    const startOffset = Math.floor(index * days / barCount)
    const endOffset = Math.floor((index + 1) * days / barCount)
    const barStartDate = addDays(startDate, startOffset)
    const barEndDate = addDays(startDate, endOffset)
    const amount = sumAmounts(periodBookings.filter(({ paymentDate }) => (
      paymentDate && paymentDate >= barStartDate && paymentDate < barEndDate
    )))
    return {
      startDate: barStartDate,
      endDate: addDays(barEndDate, -1),
      amount,
    }
  })
  const maxBarAmount = Math.max(...bars.map(({ amount }) => amount), 0)

  return {
    totalRevenue,
    thisMonthRevenue,
    periodRevenue,
    previousPeriodRevenue,
    topRevenueCity: getTopRevenueCity(periodBookings, properties),
    growthPercent,
    hasRevenue: totalRevenue > 0,
    hasChartRevenue: periodRevenue > 0,
    bars: bars.map((bar) => ({
      ...bar,
      height: maxBarAmount ? (bar.amount / maxBarAmount) * 100 : 0,
    })),
  }
}
