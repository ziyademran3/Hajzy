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

const startOfDay = (date) => {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
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

export const getOwnerRevenueMetrics = (bookings = [], now = new Date(), properties = []) => {
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

  const today = startOfDay(now)
  const currentWeekStart = addDays(today, -6)
  const nextDay = addDays(today, 1)
  const previousWeekStart = addDays(today, -13)
  const currentWeekRevenue = sumAmounts(eligibleBookings.filter(({ paymentDate }) => (
    paymentDate && paymentDate >= currentWeekStart && paymentDate < nextDay
  )))
  const previousWeekRevenue = sumAmounts(eligibleBookings.filter(({ paymentDate }) => (
    paymentDate && paymentDate >= previousWeekStart && paymentDate < currentWeekStart
  )))
  const growthPercent = previousWeekRevenue > 0
    ? ((currentWeekRevenue - previousWeekRevenue) / previousWeekRevenue) * 100
    : null

  const chartStart = addDays(today, -29)
  const chartDays = 30
  const bars = Array.from({ length: 9 }, (_, index) => {
    const startOffset = Math.floor(index * chartDays / 9)
    const endOffset = Math.floor((index + 1) * chartDays / 9)
    const startDate = addDays(chartStart, startOffset)
    const endDate = addDays(chartStart, endOffset)
    const amount = sumAmounts(eligibleBookings.filter(({ paymentDate }) => (
      paymentDate && paymentDate >= startDate && paymentDate < endDate
    )))
    return {
      startDate,
      endDate: addDays(endDate, -1),
      amount,
    }
  })
  const maxBarAmount = Math.max(...bars.map(({ amount }) => amount), 0)

  return {
    totalRevenue,
    thisMonthRevenue,
    topRevenueCity: getTopRevenueCity(eligibleBookings, properties),
    growthPercent,
    hasRevenue: totalRevenue > 0,
    bars: bars.map((bar) => ({
      ...bar,
      height: maxBarAmount ? (bar.amount / maxBarAmount) * 100 : 0,
    })),
  }
}
