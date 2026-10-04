import { useTranslation } from 'react-i18next'
import { formatNumber } from '../lib/formatters'

export default function PropertyRating({ rating, reviews, placement }) {
  const { t } = useTranslation()
  const formattedRating = formatNumber(rating ?? 0, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
  const formattedReviews = formatNumber(reviews ?? 0)

  return (
    <span
      className={`property-rating-badge${placement ? ` property-rating-badge--${placement}` : ''}`}
      aria-label={t('propertyMetrics.ratingSummary', {
        rating: formattedRating,
        reviews: formattedReviews,
      })}
    >
      <span className="material-symbols-outlined" aria-hidden="true">star</span>
      <span>{formattedRating}</span>
      <small>{t('propertyMetrics.reviewCount', { count: formattedReviews })}</small>
    </span>
  )
}
