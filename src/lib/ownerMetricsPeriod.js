export const OWNER_METRICS_PERIODS = [
  'thisWeek',
  'lastSevenDays',
  'lastThirtyDays',
  'thisMonth',
]

export const isOwnerMetricsPeriod = (period) => OWNER_METRICS_PERIODS.includes(period)

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

export const getOwnerMetricsPeriodRange = (period = 'lastThirtyDays', now = new Date()) => {
  const today = startOfDay(now)
  const endDate = addDays(today, 1)
  let startDate

  switch (period) {
    case 'thisWeek': {
      const daysSinceMonday = (today.getDay() + 6) % 7
      startDate = addDays(today, -daysSinceMonday)
      break
    }
    case 'lastSevenDays':
      startDate = addDays(today, -6)
      break
    case 'thisMonth':
      startDate = new Date(today.getFullYear(), today.getMonth(), 1)
      break
    case 'lastThirtyDays':
    default:
      startDate = addDays(today, -29)
      break
  }

  const periodDays = Math.round((endDate - startDate) / 86400000)
  const previousStartDate = period === 'thisMonth'
    ? new Date(today.getFullYear(), today.getMonth() - 1, 1)
    : addDays(startDate, -periodDays)
  const previousEndDate = period === 'thisMonth'
    ? addDays(
      previousStartDate,
      Math.min(
        today.getDate(),
        new Date(
          previousStartDate.getFullYear(),
          previousStartDate.getMonth() + 1,
          0,
        ).getDate(),
      ),
    )
    : startDate

  return {
    startDate,
    endDate,
    previousStartDate,
    previousEndDate,
    days: periodDays,
  }
}
