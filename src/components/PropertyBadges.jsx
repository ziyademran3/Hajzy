import React from 'react'
import { useTranslation } from 'react-i18next'
import { getPropertyBadges } from '../lib/propertyBadges'

export default function PropertyBadges({ property }) {
  const { t } = useTranslation()
  const badges = getPropertyBadges(property)

  if (badges.length === 0) return null

  return (
    <div className="card-topline property-badge-list" role="group" aria-label={t('badges.propertyHighlights')}>
      {badges.map((badge) => {
        return (
          <span key={badge.type} className="property-deal-badge">
            {t('badges.discountPercent', { percent: badge.percent })}
          </span>
        )
      })}
    </div>
  )
}
