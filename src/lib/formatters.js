export const formatCurrency = (amount, currency = 'EGP', currentLanguage = 'ar') => {
  const isArabic = currentLanguage === 'ar'
  const locale = isArabic ? 'ar-EG' : 'en-US'
  const value = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  }).format(amount)
  const symbol = currency === 'EGP' ? (isArabic ? 'ج.م' : 'EGP') : currency

  return isArabic ? `${value} ${symbol}` : `${symbol} ${value}`
}

export const formatDate = (dateString, currentLanguage = 'ar') => {
  const locale = currentLanguage === 'ar' ? 'ar-EG' : 'en-US'

  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateString))
}
