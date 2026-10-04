import { useTranslation } from 'react-i18next'
import { formatCurrency } from '../lib/formatters'

export default function PropertyPrice({ amount, currency = 'EGP', language = 'ar' }) {
  const { t } = useTranslation()

  return (
    <span className="property-price-display">
      <strong>{formatCurrency(amount, currency, language)}</strong>
      <span>{t('propertyMetrics.perNight')}</span>
    </span>
  )
}
