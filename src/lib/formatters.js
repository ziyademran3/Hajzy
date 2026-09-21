export const formatCurrency = (amount, currency = 'EGP', currentLanguage = 'ar') => {
  const isArabic = currentLanguage === 'ar'
  const locale = isArabic ? 'ar-EG' : 'en-US'
  const value = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  }).format(amount)
  const symbol = currency === 'EGP' ? (isArabic ? 'ج.م' : 'EGP') : currency

  return isArabic ? `${value} ${symbol}` : `${symbol} ${value}`
}

/**
 * Safely parse a YYYY-MM-DD string into a local midnight Date object.
 * Returns null if the string is empty or invalid.
 */
export const parseISODate = (str) => {
  if (!str || typeof str !== 'string') return null
  const trimmed = str.trim()
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null

  const year = parseInt(match[1], 10)
  const month = parseInt(match[2], 10) - 1
  const day = parseInt(match[3], 10)

  const date = new Date(year, month, day)
  if (
    isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null
  }
  return date
}

/**
 * Build a YYYY-MM-DD string from year, month (1-based), day numbers.
 */
export const buildISODateString = (year, month, day) => {
  const y = String(year).padStart(4, '0')
  const m = String(month).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Safely convert a Date or string to YYYY-MM-DD without UTC timezone shift.
 */
export const formatISODate = (date) => {
  if (!date) return ''
  let d = date
  if (typeof date === 'string') {
    const parsed = parseISODate(date)
    if (parsed) return date.trim().slice(0, 10)
    d = new Date(date)
  }
  if (!(d instanceof Date) || isNaN(d.getTime())) return ''
  return buildISODateString(d.getFullYear(), d.getMonth() + 1, d.getDate())
}

/**
 * Calculate the number of nights between two dates.
 * Returns 0 if either date is invalid, null, or if end <= start.
 * Never throws an error.
 */
export const nightsBetween = (startDate, endDate) => {
  if (!startDate || !endDate) return 0

  let d1 = typeof startDate === 'string' ? parseISODate(startDate) : startDate
  if (!d1 || !(d1 instanceof Date) || isNaN(d1.getTime())) {
    if (typeof startDate === 'string') {
      const fallback = new Date(startDate)
      if (!isNaN(fallback.getTime())) d1 = fallback
    }
  }

  let d2 = typeof endDate === 'string' ? parseISODate(endDate) : endDate
  if (!d2 || !(d2 instanceof Date) || isNaN(d2.getTime())) {
    if (typeof endDate === 'string') {
      const fallback = new Date(endDate)
      if (!isNaN(fallback.getTime())) d2 = fallback
    }
  }

  if (!d1 || !d2 || isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0

  const utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate())
  const utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate())
  const diffDays = Math.round((utc2 - utc1) / (1000 * 60 * 60 * 24))

  return diffDays > 0 ? diffDays : 0
}

/**
 * Safely format a date for display in the current language.
 * Never throws RangeError on empty, null, or invalid dates.
 */
export const formatDate = (dateString, currentLanguage = 'ar') => {
  if (!dateString) return '—'

  let d = null
  if (typeof dateString === 'string') {
    d = parseISODate(dateString)
    if (!d) {
      const parsed = new Date(dateString)
      if (!isNaN(parsed.getTime())) d = parsed
    }
  } else if (dateString instanceof Date && !isNaN(dateString.getTime())) {
    d = dateString
  }

  if (!d) return '—'

  const locale = currentLanguage === 'ar' ? 'ar-EG' : 'en-US'
  try {
    return new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d)
  } catch {
    return '—'
  }
}
