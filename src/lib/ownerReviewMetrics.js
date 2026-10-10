import { getOwnerMetricsPeriodRange } from './ownerMetricsPeriod.js'

const parseReviewDate = (review) => {
  const rawDate = review?.date || review?.createdAt || review?.created_at
  if (!rawDate) return null

  const dateOnly = String(rawDate).match(/^(\d{4})-(\d{2})-(\d{2})$/)
  const date = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(rawDate)
  return Number.isNaN(date.getTime()) ? null : date
}

const getAverageRating = (reviews, startDate, endDate) => {
  const ratings = reviews.flatMap((review) => {
    const rating = Number(review?.rating)
    const date = parseReviewDate(review)
    return date
      && date >= startDate
      && date < endDate
      && Number.isFinite(rating)
      && rating > 0
      && rating <= 5
      ? [rating]
      : []
  })

  return ratings.length
    ? ratings.reduce((total, rating) => total + rating, 0) / ratings.length
    : null
}

export const getOwnerReviewMetrics = (reviews = [], now = new Date(), period = 'lastThirtyDays') => {
  const safeReviews = Array.isArray(reviews) ? reviews.filter(Boolean) : []
  const { startDate, endDate, previousStartDate, previousEndDate } = getOwnerMetricsPeriodRange(period, now)

  return {
    averageRating: getAverageRating(safeReviews, startDate, endDate),
    previousAverageRating: getAverageRating(safeReviews, previousStartDate, previousEndDate),
  }
}
